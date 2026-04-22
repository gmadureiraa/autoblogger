import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { sql } from "@/lib/neon"
import { getPost, updatePost } from "@/lib/posts"
import { decryptSecret } from "@/lib/server/crypto"
import { publishToWordPress } from "@/lib/server/wordpress"

type SiteRow = {
  id: string
  site_url: string
  username: string
  app_password_encrypted: string
  default_status: string
  default_category_id: number | null
}

/**
 * POST /api/wordpress/publish
 * Body: { articleId: string, siteId: string, status?: "draft"|"publish"|"pending"|"private" }
 *
 * - Carrega post do Neon (escopa por user_id)
 * - Carrega site WP (escopa por user_id) + decripta senha
 * - Chama publishToWordPress (inclui upload de cover image)
 * - Atualiza post.meta com wpPostId + wpUrl + publishedAt
 */
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 })
  }

  const articleId = typeof body.articleId === "string" ? body.articleId : ""
  const siteId = typeof body.siteId === "string" ? body.siteId : ""
  const wantedStatus =
    typeof body.status === "string" &&
    ["draft", "publish", "pending", "private"].includes(body.status)
      ? (body.status as "draft" | "publish" | "pending" | "private")
      : undefined

  if (!articleId || !siteId) {
    return NextResponse.json(
      { error: "articleId e siteId sao obrigatorios" },
      { status: 400 }
    )
  }

  const post = await getPost(userId, articleId)
  if (!post) return NextResponse.json({ error: "Artigo nao encontrado" }, { status: 404 })

  const rows = await sql<SiteRow[]>`
    SELECT id, site_url, username, app_password_encrypted,
           default_status, default_category_id
    FROM wordpress_sites
    WHERE id = ${siteId} AND user_id = ${userId}
    LIMIT 1
  `
  const site = rows[0]
  if (!site) return NextResponse.json({ error: "Site WordPress nao encontrado" }, { status: 404 })

  let appPassword: string
  try {
    appPassword = decryptSecret(site.app_password_encrypted)
  } catch {
    return NextResponse.json(
      { error: "Nao foi possivel decriptar a credencial. Reconecte o site." },
      { status: 500 }
    )
  }

  const coverFromMeta =
    typeof (post.meta as Record<string, unknown>)?.coverImage === "string"
      ? ((post.meta as Record<string, unknown>).coverImage as string)
      : null

  const statusToSend =
    wantedStatus ?? ((site.default_status as "draft" | "publish") || "draft")

  try {
    const result = await publishToWordPress(
      { siteUrl: site.site_url, username: site.username, appPassword },
      {
        title: post.title,
        html: post.body_html ?? post.body_markdown ?? "",
        excerpt: post.excerpt,
        featuredImageUrl: coverFromMeta,
        status: statusToSend,
        slug: post.slug,
        categories: site.default_category_id ? [site.default_category_id] : undefined,
      }
    )

    // Atualiza meta do post com referencia do WP
    const existingMeta = (post.meta ?? {}) as Record<string, unknown>
    const wpHistory = Array.isArray(existingMeta.wpHistory)
      ? (existingMeta.wpHistory as Array<Record<string, unknown>>)
      : []
    wpHistory.push({
      siteId: site.id,
      siteUrl: site.site_url,
      wpPostId: result.wpPostId,
      wpUrl: result.wpUrl,
      wpStatus: result.wpStatus,
      featuredMediaId: result.featuredMediaId,
      publishedAt: new Date().toISOString(),
    })
    const newMeta: Record<string, unknown> = {
      ...existingMeta,
      wpHistory,
      wpLastPostId: result.wpPostId,
      wpLastUrl: result.wpUrl,
      wpLastStatus: result.wpStatus,
    }

    await updatePost(userId, articleId, {
      meta: newMeta,
      status: result.wpStatus === "publish" ? "published" : post.status,
    })

    return NextResponse.json({
      ok: true,
      wpPostId: result.wpPostId,
      wpUrl: result.wpUrl,
      wpStatus: result.wpStatus,
      featuredMediaId: result.featuredMediaId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao publicar no WordPress"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

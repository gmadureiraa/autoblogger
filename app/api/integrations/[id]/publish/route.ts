import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getPost, updatePost } from "@/lib/posts"
import {
  decryptCreds,
  getIntegration,
  markUsed,
} from "@/lib/integrations/store"
import { getAdapter, type PublishStatus } from "@/lib/integrations"

/**
 * POST /api/integrations/[id]/publish
 *
 * Body: { articleId: string, status?: "draft"|"publish"|"pending"|"private" }
 *
 * - Carrega post (escopa por user_id)
 * - Carrega integração + decripta credenciais
 * - Chama adapter.publish(...)
 * - Atualiza meta do post (history) + status local se publish bateu
 *
 * Erros:
 *   401 — não autenticado
 *   400 — payload inválido
 *   404 — post ou integração não encontrada
 *   500 — falha ao decriptar credenciais (reconectar)
 *   502 — adapter falhou (rede / API externa)
 */

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { id: integrationId } = await context.params

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const articleId = typeof body.articleId === "string" ? body.articleId : ""
  if (!articleId) {
    return NextResponse.json({ error: "articleId é obrigatório" }, { status: 400 })
  }

  const wantedStatus =
    typeof body.status === "string" &&
    ["draft", "publish", "pending", "private"].includes(body.status)
      ? (body.status as PublishStatus)
      : undefined

  const post = await getPost(userId, articleId)
  if (!post) return NextResponse.json({ error: "Artigo não encontrado" }, { status: 404 })

  const integration = await getIntegration(userId, integrationId)
  if (!integration)
    return NextResponse.json({ error: "Integração não encontrada" }, { status: 404 })

  let creds: Record<string, unknown>
  try {
    creds = decryptCreds(integration)
  } catch {
    return NextResponse.json(
      { error: "Não foi possível decriptar a credencial. Reconecte a integração." },
      { status: 500 }
    )
  }

  const adapter = getAdapter(integration.platform)
  const coverFromMeta =
    typeof (post.meta as Record<string, unknown>)?.coverImage === "string"
      ? ((post.meta as Record<string, unknown>).coverImage as string)
      : null

  try {
    const out = await adapter.publish(
      {
        title: post.title,
        html: post.body_html ?? post.body_markdown ?? "",
        excerpt: post.excerpt,
        slug: post.slug,
        markdown: post.body_markdown,
        featuredImageUrl: coverFromMeta,
      },
      creds,
      integration.metadata,
      { status: wantedStatus }
    )

    // Atualiza meta do post com referência da publicação
    const existingMeta = (post.meta ?? {}) as Record<string, unknown>
    const publishHistory = Array.isArray(existingMeta.publishHistory)
      ? (existingMeta.publishHistory as Array<Record<string, unknown>>)
      : []
    publishHistory.push({
      integrationId: integration.id,
      platform: integration.platform,
      displayName: integration.display_name,
      url: out.url,
      externalId: out.externalId,
      status: out.status,
      publishedAt: new Date().toISOString(),
    })
    const newMeta: Record<string, unknown> = {
      ...existingMeta,
      publishHistory,
      lastPublish: {
        platform: integration.platform,
        url: out.url,
        externalId: out.externalId,
        status: out.status,
      },
      // legado: mantém compat com /artigos/[id] que lê wpLastUrl
      ...(integration.platform === "wordpress"
        ? {
            wpLastPostId: out.externalId,
            wpLastUrl: out.url,
            wpLastStatus: out.status,
          }
        : {}),
    }

    await updatePost(userId, articleId, {
      meta: newMeta,
      status:
        out.status === "publish" || out.status === "published"
          ? "published"
          : post.status,
    })
    await markUsed(userId, integration.id)

    return NextResponse.json({
      ok: true,
      platform: integration.platform,
      url: out.url,
      externalId: out.externalId,
      status: out.status,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao publicar"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { sql } from "@/lib/neon"
import { decryptSecret } from "@/lib/server/crypto"
import { validateCredentials } from "@/lib/server/wordpress"

type SiteRow = {
  id: string
  site_url: string
  username: string
  app_password_encrypted: string
}

/**
 * POST /api/wordpress/test
 * Body: { siteId }
 *
 * Testa a conexao com um site ja conectado. Atualiza last_checked_at se ok.
 */
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })

  let body: { siteId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 })
  }

  const siteId = body.siteId ?? ""
  if (!siteId) return NextResponse.json({ error: "siteId obrigatorio" }, { status: 400 })

  const rows = await sql<SiteRow[]>`
    SELECT id, site_url, username, app_password_encrypted
    FROM wordpress_sites
    WHERE id = ${siteId} AND user_id = ${userId}
    LIMIT 1
  `
  const site = rows[0]
  if (!site) return NextResponse.json({ error: "Site nao encontrado" }, { status: 404 })

  try {
    const appPassword = decryptSecret(site.app_password_encrypted)
    const wpUser = await validateCredentials({
      siteUrl: site.site_url,
      username: site.username,
      appPassword,
    })
    await sql`
      UPDATE wordpress_sites SET last_checked_at = now()
      WHERE id = ${site.id} AND user_id = ${userId}
    `
    return NextResponse.json({ ok: true, user: { id: wpUser.id, name: wpUser.name, slug: wpUser.slug } })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha no teste"
    return NextResponse.json({ ok: false, error: message }, { status: 502 })
  }
}

import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { ensureProfile, sql } from "@/lib/neon"
import { encryptSecret } from "@/lib/server/crypto"
import { validateCredentials } from "@/lib/server/wordpress"

/**
 * POST /api/wordpress/connect
 * Body: { siteUrl, username, appPassword, label?, defaultStatus?, defaultCategoryId? }
 *
 * - Valida credencial via /wp-json/wp/v2/users/me
 * - Encripta app_password (AES-256-GCM)
 * - UPSERT em wordpress_sites (unique por user_id + site_url normalizado)
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

  const siteUrl = typeof body.siteUrl === "string" ? body.siteUrl.trim().replace(/\/+$/, "") : ""
  const username = typeof body.username === "string" ? body.username.trim() : ""
  const appPassword = typeof body.appPassword === "string" ? body.appPassword : ""
  const label = typeof body.label === "string" && body.label.trim() ? body.label.trim() : null
  const defaultStatus =
    typeof body.defaultStatus === "string" &&
    ["draft", "publish", "pending", "private"].includes(body.defaultStatus)
      ? (body.defaultStatus as "draft" | "publish" | "pending" | "private")
      : "draft"
  const defaultCategoryId =
    typeof body.defaultCategoryId === "number" && Number.isFinite(body.defaultCategoryId)
      ? Math.trunc(body.defaultCategoryId)
      : null

  if (!siteUrl || !username || !appPassword) {
    return NextResponse.json(
      { error: "Campos obrigatorios: siteUrl, username, appPassword." },
      { status: 400 }
    )
  }
  if (!/^https?:\/\//i.test(siteUrl)) {
    return NextResponse.json({ error: "siteUrl deve comecar com http:// ou https://" }, { status: 400 })
  }

  try {
    // Valida credencial no WordPress
    await validateCredentials({ siteUrl, username, appPassword })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Credenciais invalidas"
    return NextResponse.json({ error: `Credenciais invalidas: ${message}` }, { status: 401 })
  }

  let encrypted: string
  try {
    encrypted = encryptSecret(appPassword)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao encriptar"
    return NextResponse.json({ error: message }, { status: 500 })
  }

  try {
    // Garante profile existe antes do INSERT (FK)
    const user = await currentUser()
    await ensureProfile({
      clerkUserId: userId,
      email: user?.emailAddresses?.[0]?.emailAddress ?? null,
      name: user?.fullName ?? user?.username ?? null,
      avatarUrl: user?.imageUrl ?? null,
    })

    // Deduplica: se ja existir site com mesmo host, atualiza
    const existing = await sql<{ id: string }[]>`
      SELECT id FROM wordpress_sites
      WHERE user_id = ${userId} AND site_url = ${siteUrl}
      LIMIT 1
    `

    let row
    if (existing.length > 0) {
      ;[row] = await sql<{ id: string; site_url: string; username: string }[]>`
        UPDATE wordpress_sites SET
          username = ${username},
          app_password_encrypted = ${encrypted},
          label = COALESCE(${label}, label),
          default_status = ${defaultStatus},
          default_category_id = ${defaultCategoryId},
          last_checked_at = now()
        WHERE id = ${existing[0].id} AND user_id = ${userId}
        RETURNING id, site_url, username
      `
    } else {
      ;[row] = await sql<{ id: string; site_url: string; username: string }[]>`
        INSERT INTO wordpress_sites (
          user_id, site_url, username, app_password_encrypted,
          label, default_status, default_category_id, last_checked_at
        ) VALUES (
          ${userId}, ${siteUrl}, ${username}, ${encrypted},
          ${label}, ${defaultStatus}, ${defaultCategoryId}, now()
        )
        RETURNING id, site_url, username
      `
    }

    return NextResponse.json({ ok: true, site: row })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao salvar site"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

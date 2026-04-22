import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { sql } from "@/lib/neon"

export type WordPressSiteRow = {
  id: string
  user_id: string
  site_url: string
  username: string
  label: string | null
  default_status: string
  default_category_id: number | null
  last_checked_at: string | null
  created_at: string
}

/**
 * GET /api/wordpress/sites — lista sites WP conectados do usuario.
 * Nao retorna a app_password encriptada pra nao vazar pra cliente.
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })

  try {
    const rows = await sql<WordPressSiteRow[]>`
      SELECT id, user_id, site_url, username, label, default_status,
             default_category_id, last_checked_at, created_at
      FROM wordpress_sites
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `
    return NextResponse.json({ sites: rows })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao listar sites"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

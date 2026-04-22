import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { sql } from "@/lib/neon"

/**
 * DELETE /api/wordpress/sites/[id] — remove site WP conectado do usuario.
 */
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })
  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "id obrigatorio" }, { status: 400 })

  try {
    const rows = await sql<{ id: string }[]>`
      DELETE FROM wordpress_sites
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `
    if (rows.length === 0) {
      return NextResponse.json({ error: "site nao encontrado" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao deletar site"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

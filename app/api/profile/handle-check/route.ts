import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { sql } from "@/lib/neon"

const HANDLE_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/

/**
 * GET /api/profile/handle-check?handle=xxx
 * Retorna { ok: true } se disponivel, { ok: false, reason } se nao.
 * Requer auth pra evitar enumeracao publica.
 */
export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ ok: false, reason: "unauth" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const raw = (searchParams.get("handle") ?? "").trim().toLowerCase()
  if (!raw) return NextResponse.json({ ok: false, reason: "empty" })
  if (!HANDLE_REGEX.test(raw)) return NextResponse.json({ ok: false, reason: "invalid" })

  try {
    const rows = await sql<{ id: string }[]>`
      SELECT id FROM profiles
      WHERE LOWER(blog_handle) = ${raw} AND id <> ${userId}
      LIMIT 1
    `
    if (rows.length > 0) return NextResponse.json({ ok: false, reason: "taken" })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "erro"
    return NextResponse.json({ ok: false, reason: message }, { status: 500 })
  }
}

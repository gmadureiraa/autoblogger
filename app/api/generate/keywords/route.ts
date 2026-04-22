import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { researchKeywords } from "@/lib/server/keywords"
import { checkRateLimit, getClientKey } from "@/lib/server/rate-limit"

/**
 * POST /api/generate/keywords
 * Body: { query: string, gl?: "br"|"us"|..., hl?: "pt"|"en"|... }
 *
 * Retorna cluster de keywords do Google SERP (Serper.dev).
 * Requer SERPER_API_KEY no env + auth.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Auth necessaria" }, { status: 401 })

  const limited = checkRateLimit(`kw:${userId || getClientKey(request)}`, { limit: 20, windowMs: 60_000 })
  if (!limited.ok) {
    return NextResponse.json({ error: "Rate limit. Tenta em 1 min." }, { status: 429 })
  }

  const body = (await request.json().catch(() => ({}))) as { query?: string; gl?: string; hl?: string }
  const query = String(body.query ?? "").trim()
  if (!query) return NextResponse.json({ error: "Campo 'query' obrigatorio." }, { status: 400 })

  const cluster = await researchKeywords(query, body.gl, body.hl)
  if (!cluster) {
    return NextResponse.json(
      { error: "SERPER_API_KEY nao configurada ou consulta sem resultado." },
      { status: 503 }
    )
  }
  return NextResponse.json(cluster)
}

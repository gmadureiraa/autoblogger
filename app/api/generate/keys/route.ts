import { NextResponse } from "next/server"

/**
 * GET /api/generate/keys
 *
 * Endpoint publico que retorna apenas se o servidor tem GEMINI_API_KEY configurada.
 * Nao expoe o valor — so um boolean. Usado pelo /gerar pra decidir se o banner
 * "API Key necessaria" deve aparecer pra quem nao tem key local nem no profile.
 */
export async function GET() {
  const raw = process.env.GEMINI_API_KEY ?? ""
  const serverHasKey = Boolean(raw && raw !== "your-key-here")
  return NextResponse.json({ serverHasKey })
}

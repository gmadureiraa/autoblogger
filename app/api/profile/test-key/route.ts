import { NextResponse } from "next/server"

/**
 * Endpoint depreciado em 2026-04-28.
 *
 * Antes: testava a Gemini API key do usuário. Removido porque o servidor agora
 * usa sempre a chave global do .env (GEMINI_API_KEY). Usuários não precisam
 * mais (e não podem mais) cadastrar a própria.
 *
 * Mantido apenas como stub pra evitar 404 ruidoso em caches de cliente antigo.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Endpoint removido. O servidor usa a chave Gemini global e não permite mais cadastrar key por usuário.",
    },
    { status: 410 }
  )
}

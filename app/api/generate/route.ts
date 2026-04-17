import { NextRequest, NextResponse } from "next/server"
import { generateArticleFromTopic, generateArticleFromUrl } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mode, input, tone, apiKey } = body as {
      mode: "topic" | "url"
      input: string
      tone: string
      apiKey?: string
    }

    if (!input || !input.trim()) {
      return NextResponse.json(
        { error: "Input e obrigatorio" },
        { status: 400 }
      )
    }

    // Use client-provided API key first, then fall back to env
    const key = apiKey?.trim() || process.env.GEMINI_API_KEY
    if (!key || key === "your-key-here") {
      return NextResponse.json(
        { error: "API Key do Gemini nao configurada. Adicione sua key nas configuracoes." },
        { status: 400 }
      )
    }

    const article =
      mode === "url"
        ? await generateArticleFromUrl(input.trim(), tone || "informativo", key)
        : await generateArticleFromTopic(input.trim(), tone || "informativo", key)

    return NextResponse.json(article)
  } catch (error: unknown) {
    console.error("Generate error:", error)
    const message = error instanceof Error ? error.message : "Erro ao gerar artigo"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { generateArticleFromTopic, generateArticleFromUrl } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mode, input, tone } = body as {
      mode: "topic" | "url"
      input: string
      tone: string
    }

    if (!input || !input.trim()) {
      return NextResponse.json(
        { error: "Input e obrigatorio" },
        { status: 400 }
      )
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your-key-here") {
      return NextResponse.json(
        { error: "GEMINI_API_KEY nao configurada. Adicione sua key no .env.local" },
        { status: 500 }
      )
    }

    const article =
      mode === "url"
        ? await generateArticleFromUrl(input.trim(), tone || "informativo")
        : await generateArticleFromTopic(input.trim(), tone || "informativo")

    return NextResponse.json(article)
  } catch (error: any) {
    console.error("Generate error:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao gerar artigo" },
      { status: 500 }
    )
  }
}

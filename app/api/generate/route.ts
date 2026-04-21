import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { generateArticleFromTopic, generateArticleFromUrl } from "@/lib/gemini"
import { checkRateLimit, getClientKey } from "@/lib/server/rate-limit"
import { ensureProfile, sql } from "@/lib/neon"
import { createPost } from "@/lib/posts"
import { htmlToMarkdown, slugify, wordCountFromHtml } from "@/lib/markdown"

export async function POST(request: NextRequest) {
  try {
    // Rate limit baseado em IP (ou user ID se autenticado).
    const { userId } = await auth()
    const clientKey = userId || getClientKey(request)
    const limited = checkRateLimit(`generate:${clientKey}`, { limit: 30, windowMs: 60_000 })
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Muitas requisicoes. Tenta de novo em 1 minuto." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const {
      mode,
      input,
      tone,
      apiKey,
      persist,
    } = body as {
      mode: "topic" | "url"
      input: string
      tone: string
      apiKey?: string
      persist?: boolean
    }

    if (!input || !input.trim()) {
      return NextResponse.json({ error: "Input e obrigatorio" }, { status: 400 })
    }

    // Ordem de resolucao da key:
    // 1. key enviada no request (usuario na UI)
    // 2. gemini_api_key do profile (se autenticado)
    // 3. GEMINI_API_KEY do env
    let key = apiKey?.trim() || ""

    if (!key && userId) {
      const rows = await sql<{ gemini_api_key: string | null }[]>`
        SELECT gemini_api_key FROM profiles WHERE id = ${userId} LIMIT 1
      `
      if (rows[0]?.gemini_api_key) key = rows[0].gemini_api_key
    }

    if (!key) key = process.env.GEMINI_API_KEY ?? ""

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

    // Persistencia no Neon (quando user esta logado e pediu persist).
    let savedId: string | null = null
    if (persist !== false && userId) {
      const user = await currentUser()
      await ensureProfile({
        clerkUserId: userId,
        email: user?.emailAddresses?.[0]?.emailAddress ?? null,
        name: user?.fullName ?? user?.username ?? null,
        avatarUrl: user?.imageUrl ?? null,
      })

      const markdown = htmlToMarkdown(article.body)
      const wordCount = wordCountFromHtml(article.body)
      const saved = await createPost(userId, {
        title: article.title,
        slug: slugify(article.title),
        excerpt: article.metaDescription,
        body_html: article.body,
        body_markdown: markdown,
        meta: {
          headings: article.headings,
          internalLinks: article.internalLinks,
          seoScore: article.seoScore,
          tips: article.tips,
          wordCount,
          mode,
          sourceInput: input.trim(),
          tone: tone || "informativo",
        },
        status: "draft",
      })
      savedId = saved.id
    }

    return NextResponse.json({ ...article, id: savedId })
  } catch (error: unknown) {
    console.error("Generate error:", error)
    const message = error instanceof Error ? error.message : "Erro ao gerar artigo"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

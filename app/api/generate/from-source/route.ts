import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { ensureProfile, sql } from "@/lib/neon"
import { createPost } from "@/lib/posts"
import { extractFromUrl, extractFromYouTube } from "@/lib/server/extractors"
import { generateArticleFromSource } from "@/lib/gemini"
import { htmlToMarkdown, slugify, wordCountFromHtml } from "@/lib/markdown"
import { computeSeoScore, targetWordsFor, type ArticleLength } from "@/lib/seo"
import { generateCoverImage } from "@/lib/server/cover-image"
import { checkRateLimit, getClientKey } from "@/lib/server/rate-limit"

/**
 * POST /api/generate/from-source
 *
 * Gera um artigo a partir de uma fonte externa (URL ou YouTube).
 * O conteudo e EXTRAIDO (scraping / transcript) e alimenta o prompt como insumo.
 * Gemini regenera com voz propria — nao copia.
 *
 * Body: { source: "url" | "youtube", input: string, tone?: string, length?: "short"|"medium"|"long", niche?: string, withCover?: boolean }
 *
 * Retorna: { id, post, article }
 *
 * Requer: auth (Clerk) + GEMINI_API_KEY (env ou profile).
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Login necessario para importar fontes." }, { status: 401 })
    }

    const limited = checkRateLimit(`gen-src:${userId || getClientKey(request)}`, {
      limit: 10,
      windowMs: 60_000,
    })
    if (!limited.ok) {
      return NextResponse.json({ error: "Muitas importacoes. Aguarde 1 minuto." }, { status: 429 })
    }

    const body = (await request.json().catch(() => ({}))) as {
      source?: "url" | "youtube"
      input?: string
      tone?: string
      length?: string
      niche?: string
      withCover?: boolean
    }

    const source = body.source
    const input = String(body.input ?? "").trim()
    if (!source || (source !== "url" && source !== "youtube") || !input) {
      return NextResponse.json(
        { error: "Campos obrigatorios: source ('url'|'youtube') e input (URL/link)." },
        { status: 400 }
      )
    }

    const tone = body.tone || "informativo"
    const rawLength = String(body.length ?? "medium").toLowerCase()
    const length = (["short", "medium", "long"].includes(rawLength) ? rawLength : "medium") as ArticleLength
    const niche = body.niche?.trim() || null
    const withCover = body.withCover !== false

    // Resolve API key (profile → env)
    const rows = await sql<{ gemini_api_key: string | null }[]>`
      SELECT gemini_api_key FROM profiles WHERE id = ${userId} LIMIT 1
    `
    const key = rows[0]?.gemini_api_key || process.env.GEMINI_API_KEY || ""
    if (!key || key === "your-key-here") {
      return NextResponse.json(
        { error: "GEMINI_API_KEY nao configurada. Defina no env ou salve em /settings." },
        { status: 503 }
      )
    }

    // Enforce posts_limit
    const user = await currentUser()
    const profile = await ensureProfile({
      clerkUserId: userId,
      email: user?.emailAddresses?.[0]?.emailAddress ?? null,
      name: user?.fullName ?? user?.username ?? null,
      avatarUrl: user?.imageUrl ?? null,
    })
    if (profile.posts_count >= profile.posts_limit) {
      return NextResponse.json(
        {
          error: `Limite de ${profile.posts_limit} posts atingido no plano ${profile.plan}. Faca upgrade pra continuar.`,
          code: "POSTS_LIMIT_REACHED",
        },
        { status: 402 }
      )
    }

    // Extract content from source
    const extract = source === "url" ? await extractFromUrl(input) : await extractFromYouTube(input)
    if (!extract.text || extract.text.length < 200) {
      return NextResponse.json(
        { error: "Nao consegui extrair conteudo suficiente da fonte. Tente outra URL/video." },
        { status: 422 }
      )
    }

    const targetWords = targetWordsFor(length)
    const article = await generateArticleFromSource({
      sourceTitle: extract.title,
      sourceText: extract.text,
      sourceUrl: extract.url,
      sourceKind: extract.source,
      tone,
      targetWords,
      niche,
      apiKey: key,
    })

    const seo = computeSeoScore({
      title: article.title,
      metaDescription: article.metaDescription,
      bodyHtml: article.body,
      targetWords,
    })
    const wordCount = wordCountFromHtml(article.body)
    const markdown = htmlToMarkdown(article.body)

    // Cover image (async, best effort)
    let coverImage: string | null = null
    if (withCover) {
      coverImage = await generateCoverImage({
        articleTitle: article.title,
        niche,
        apiKey: key,
      })
    }

    const meta = {
      wordCount,
      tone,
      length,
      seoScore: seo.score,
      seoBreakdown: seo.breakdown,
      headings: article.headings,
      internalLinks: article.internalLinks,
      tips: [...(article.tips ?? []), ...seo.suggestions].slice(0, 10),
      mode: "source",
      sourceKind: extract.source,
      sourceUrl: extract.url,
      sourceTitle: extract.title,
      niche,
      coverImage,
    }

    const savedPost = await createPost(userId, {
      title: article.title,
      slug: slugify(article.title),
      excerpt: article.metaDescription,
      body_html: article.body,
      body_markdown: markdown,
      meta,
      status: "draft",
    })

    return NextResponse.json({
      id: savedPost.id,
      post: savedPost,
      article,
      meta,
    })
  } catch (error: unknown) {
    console.error("[/api/generate/from-source] error:", error)
    const message = error instanceof Error ? error.message : "Erro ao gerar artigo a partir da fonte"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

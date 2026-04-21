import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import {
  generateArticle,
  generateArticleFromTopic,
  generateArticleFromUrl,
  type ArticleOutput,
} from "@/lib/gemini"
import { checkRateLimit, getClientKey } from "@/lib/server/rate-limit"
import { ensureProfile, sql } from "@/lib/neon"
import { createPost } from "@/lib/posts"
import { htmlToMarkdown, slugify, wordCountFromHtml } from "@/lib/markdown"
import { computeSeoScore, targetWordsFor, type ArticleLength } from "@/lib/seo"

/**
 * POST /api/generate
 *
 * Contratos aceitos:
 *   1. Novo (recomendado): { title, niche?, tone, length }
 *      length ∈ "short" | "medium" | "long" (→ 500 / 1000 / 2000 palavras)
 *   2. Legado (UI /gerar atual): { mode: "topic"|"url", input, tone, apiKey?, persist? }
 *
 * Retorna:
 *   { id, post, title, metaDescription, headings, body, internalLinks, seoScore, tips, meta }
 *
 * Requer GEMINI_API_KEY no env (ou user com gemini_api_key no profile, ou apiKey no body).
 * Se GEMINI_API_KEY faltar em todos os lugares, retorna 503 claro sem quebrar build.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    // Rate limit por user ID (ou IP se anônimo).
    const clientKey = userId || getClientKey(request)
    const limited = checkRateLimit(`generate:${clientKey}`, { limit: 30, windowMs: 60_000 })
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Muitas requisições. Tenta de novo em 1 minuto." },
        { status: 429 }
      )
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

    // --- Detecta contrato ---
    const isNewContract = typeof body.title === "string" && !("mode" in body)
    const tone = (body.tone as string) || "informativo"
    const apiKeyFromBody = typeof body.apiKey === "string" ? body.apiKey.trim() : ""
    const persist = body.persist !== false // default true

    let length: ArticleLength = "medium"
    let inputTitle = ""
    let niche: string | null = null
    let mode: "topic" | "url" = "topic"
    let sourceInput = ""

    if (isNewContract) {
      inputTitle = String(body.title ?? "").trim()
      niche = body.niche ? String(body.niche).trim() : null
      const rawLength = String(body.length ?? "medium").toLowerCase()
      length = (["short", "medium", "long"].includes(rawLength) ? rawLength : "medium") as ArticleLength
      sourceInput = inputTitle
    } else {
      // Contrato legado
      mode = (body.mode as "topic" | "url") || "topic"
      const input = String(body.input ?? "").trim()
      sourceInput = input
      inputTitle = input
      if (typeof body.length === "string") {
        const raw = body.length.toLowerCase()
        length = (["short", "medium", "long"].includes(raw) ? raw : "medium") as ArticleLength
      }
    }

    if (!inputTitle) {
      return NextResponse.json({ error: "Campo 'title' (ou 'input') é obrigatório." }, { status: 400 })
    }

    const targetWords = targetWordsFor(length)

    // --- Resolve API key: body → profile.gemini_api_key → env.GEMINI_API_KEY ---
    let key = apiKeyFromBody
    if (!key && userId) {
      const rows = await sql<{ gemini_api_key: string | null }[]>`
        SELECT gemini_api_key FROM profiles WHERE id = ${userId} LIMIT 1
      `
      if (rows[0]?.gemini_api_key) key = rows[0].gemini_api_key
    }
    if (!key) key = process.env.GEMINI_API_KEY ?? ""
    if (!key || key === "your-key-here") {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY não configurada. Defina a variável no ambiente, ou passe `apiKey` no body, ou salve a sua key em /settings.",
        },
        { status: 503 }
      )
    }

    // --- Enforce posts_limit antes de gastar geração ---
    if (userId && persist) {
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
            error: `Limite de ${profile.posts_limit} posts atingido no plano ${profile.plan}. Faça upgrade pra continuar.`,
            code: "POSTS_LIMIT_REACHED",
            plan: profile.plan,
            posts_limit: profile.posts_limit,
            posts_count: profile.posts_count,
          },
          { status: 402 }
        )
      }
    }

    // --- Geração ---
    let article: ArticleOutput
    if (isNewContract) {
      article = await generateArticle({
        title: inputTitle,
        niche,
        tone,
        targetWords,
        apiKey: key,
      })
    } else if (mode === "url") {
      article = await generateArticleFromUrl(inputTitle, tone, key, targetWords)
    } else {
      article = await generateArticleFromTopic(inputTitle, tone, key, targetWords)
    }

    // --- Score SEO server-side (sobrescreve o que a IA devolveu) ---
    const seo = computeSeoScore({
      title: article.title,
      metaDescription: article.metaDescription,
      bodyHtml: article.body,
      targetWords,
    })

    const wordCount = wordCountFromHtml(article.body)
    const markdown = htmlToMarkdown(article.body)

    const meta = {
      wordCount,
      tone,
      length,
      seoScore: seo.score,
      seoBreakdown: seo.breakdown,
      headings: article.headings,
      internalLinks: article.internalLinks,
      tips: [...(article.tips ?? []), ...seo.suggestions].slice(0, 10),
      suggestions: seo.suggestions,
      mode: isNewContract ? "structured" : mode,
      sourceInput,
      niche,
    }

    // --- Persistência ---
    let savedPost: Awaited<ReturnType<typeof createPost>> | null = null
    if (persist && userId) {
      savedPost = await createPost(userId, {
        title: article.title,
        slug: slugify(article.title),
        excerpt: article.metaDescription,
        body_html: article.body,
        body_markdown: markdown,
        meta,
        status: "draft",
      })
      // posts_count é incrementado automaticamente pelo trigger `posts_increment_count` no Neon.
    }

    return NextResponse.json({
      // Id do post salvo (se logado) — null pra anônimos.
      id: savedPost?.id ?? null,
      post: savedPost,
      // Compat: campos chapados pro UI atual.
      title: article.title,
      metaDescription: article.metaDescription,
      headings: article.headings,
      body: article.body,
      internalLinks: article.internalLinks,
      seoScore: seo.score,
      tips: meta.tips,
      meta,
    })
  } catch (error: unknown) {
    console.error("[/api/generate] error:", error)
    const message = error instanceof Error ? error.message : "Erro ao gerar artigo"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

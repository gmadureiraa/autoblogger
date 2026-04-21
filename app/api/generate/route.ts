import { NextRequest, NextResponse } from "next/server"
import { generateArticleFromTopic, generateArticleFromUrl } from "@/lib/gemini"
import { requireAuthenticatedUser } from "@/lib/server/auth-helpers"
import { checkRateLimit, getClientKey } from "@/lib/server/rate-limit"
import { getSupabaseServerClient } from "@/lib/supabase"
import { htmlToMarkdown, slugify, wordCountFromHtml } from "@/lib/markdown"

export async function POST(request: NextRequest) {
  try {
    // Rate limit baseado em IP (ou user ID se autenticado). Dev-friendly.
    const clientKey = getClientKey(request)
    const limited = checkRateLimit(`generate:${clientKey}`, { limit: 30, windowMs: 60_000 })
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Muitas requisicoes. Tenta de novo em 1 minuto." },
        { status: 429 }
      )
    }

    // Auth opcional: se tiver Supabase configurado e tiver token, persiste.
    const auth = await requireAuthenticatedUser(request)
    if (auth.response && auth.supabaseConfigured) {
      // Se Supabase esta configurado mas nao tem auth, ainda permitimos gerar
      // (para compat com o fluxo atual que salva em localStorage).
      // Nada a fazer aqui; segue o fluxo.
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

    if (!key && auth.user && auth.accessToken) {
      const supabase = getSupabaseServerClient(auth.accessToken)
      if (supabase) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("gemini_api_key")
          .eq("id", auth.user.id)
          .maybeSingle()
        if (profile?.gemini_api_key) key = profile.gemini_api_key
      }
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

    // Persistencia opcional no Supabase (quando user esta logado e pediu persist).
    let savedId: string | null = null
    if (persist !== false && auth.user && auth.accessToken) {
      const supabase = getSupabaseServerClient(auth.accessToken)
      if (supabase) {
        const markdown = htmlToMarkdown(article.body)
        const wordCount = wordCountFromHtml(article.body)
        const { data: saved, error: saveError } = await supabase
          .from("posts")
          .insert({
            user_id: auth.user.id,
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
          .select()
          .single()
        if (!saveError && saved) savedId = saved.id
      }
    }

    return NextResponse.json({ ...article, id: savedId })
  } catch (error: unknown) {
    console.error("Generate error:", error)
    const message = error instanceof Error ? error.message : "Erro ao gerar artigo"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

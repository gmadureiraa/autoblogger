"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Copy, Check, FileText, Sparkles, ChevronLeft, Save, Layers, AlertTriangle, Youtube, Globe, X, RotateCw, ImageIcon } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"
import { createPost, postToMarkdown, downloadBlob } from "@/lib/posts-store"
import { htmlToMarkdown, slugify } from "@/lib/markdown"

const ease = [0.22, 1, 0.36, 1] as const

interface ArticleOutput {
  title: string
  metaDescription: string
  headings: string[]
  body: string
  internalLinks: string[]
  seoScore: number
  tips: string[]
}

interface BlogConfig {
  blogName: string
  niche: string
  tone: string
  frequency: number
}

type CoverStyle = "brutalist" | "editorial" | "abstract"

const COVER_STYLES: Array<{ id: CoverStyle; label: string; hint: string }> = [
  { id: "brutalist", label: "Brutalist", hint: "Verde + ASCII (default)" },
  { id: "editorial", label: "Editorial", hint: "Foto realística premium" },
  { id: "abstract", label: "Abstract", hint: "Gradientes + formas" },
]

type BatchItemStatus = "queued" | "running" | "ok" | "error" | "cancelled"

interface BatchItem {
  topic: string
  status: BatchItemStatus
  error?: string
  result?: ArticleOutput
}

const TONES = [
  { id: "informativo", label: "Informativo" },
  { id: "opinativo", label: "Opinativo" },
  { id: "educacional", label: "Educacional" },
  { id: "analitico", label: "Analitico" },
]

const BATCH_OPTIONS = [3, 5, 10]

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors px-2 py-1 border border-border hover:border-foreground"
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {label || "Copiar"}
    </button>
  )
}

function SeoScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#eab308" : "#ef4444"
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
        SEO SCORE
      </span>
      <div className="flex-1 h-2 border border-foreground">
        <div className="h-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-mono font-bold" style={{ color }}>
        {score}/100
      </span>
    </div>
  )
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  return text ? text.split(" ").length : 0
}

function RetryCountdown({
  seconds,
  onDone,
}: {
  seconds: number
  onDone: () => void
}) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    setRemaining(seconds)
  }, [seconds])

  useEffect(() => {
    if (remaining <= 0) {
      onDone()
      return
    }
    const t = setTimeout(() => setRemaining((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining, onDone])

  if (remaining <= 0) return null
  return (
    <span
      aria-live="polite"
      className="text-[10px] font-mono tracking-widest uppercase text-destructive"
    >
      retry em {remaining}s
    </span>
  )
}

export default function GerarPage() {
  const { isSignedIn } = useUser()
  const authed = Boolean(isSignedIn)
  const [mode, setMode] = useState<"topic" | "url" | "youtube">("topic")
  const [input, setInput] = useState("")
  const [tone, setTone] = useState("informativo")
  const [coverStyle, setCoverStyle] = useState<CoverStyle>("brutalist")
  const [loading, setLoading] = useState(false)
  const [article, setArticle] = useState<ArticleOutput | null>(null)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [blogConfig, setBlogConfig] = useState<BlogConfig | null>(null)

  // Batch mode
  const [batchMode, setBatchMode] = useState(false)
  const [batchCount, setBatchCount] = useState(3)
  const [batchTopics, setBatchTopics] = useState("")
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
  const batchAbortRef = useRef<AbortController | null>(null)

  // Servidor tem GEMINI_API_KEY configurada? (apenas pra exibir aviso se ausente)
  const [serverHasKey, setServerHasKey] = useState(true) // assume true; flip se /keys responder false
  const [errorMeta, setErrorMeta] = useState<{ status?: number; retryIn?: number } | null>(null)

  // Load config from localStorage
  useEffect(() => {
    try {
      const configStr = localStorage.getItem("autoblogger_config")
      if (configStr) {
        const config: BlogConfig = JSON.parse(configStr)
        setBlogConfig(config)
        if (config.tone) setTone(config.tone)
      }
    } catch {}
  }, [])

  // Checagem rapida se o servidor tem GEMINI_API_KEY (publico, sem dado sensivel).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/generate/keys", { cache: "no-store" })
        if (!res.ok || cancelled) return
        const data = await res.json()
        setServerHasKey(Boolean(data?.serverHasKey))
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const canGenerate = serverHasKey

  const handleGenerate = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError("")
    setErrorMeta(null)
    setArticle(null)
    setSaved(false)

    try {
      const isSource = mode === "url" || mode === "youtube"
      if (isSource && !authed) {
        setError("Import de URL/YouTube requer login. Crie sua conta ou entre.")
        return
      }

      const endpoint = isSource ? "/api/generate/from-source" : "/api/generate"
      const body = isSource
        ? { source: mode, input, tone, length: "medium", withCover: true, coverStyle }
        : { mode, input, tone, persist: authed, coverStyle }

      const res = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        // Mensagens user-friendly por status code.
        let msg = data.error || "Erro ao gerar artigo"
        const retryAfterHeader = res.headers.get("retry-after")
        const retryIn =
          retryAfterHeader && Number.isFinite(Number(retryAfterHeader))
            ? Number(retryAfterHeader)
            : data?.retryAfter && Number.isFinite(Number(data.retryAfter))
              ? Number(data.retryAfter)
              : undefined
        if (res.status === 402) {
          msg = data.error || "Limite de artigos atingido. Faca upgrade pra continuar."
        } else if (res.status === 429) {
          msg = retryIn
            ? `Muitas geracoes seguidas. Tente de novo em ${retryIn}s.`
            : "Muitas geracoes seguidas. Aguarde 1 minuto."
        } else if (res.status === 503) {
          msg = data.error || "Servidor indisponivel. Tente novamente em instantes."
        } else if (res.status === 422) {
          msg = data.error || "Conteudo da fonte muito curto pra gerar artigo."
        }
        setError(msg)
        setErrorMeta({ status: res.status, retryIn })
        toast.error("Falha ao gerar", { description: msg })
        return
      }

      const article = isSource
        ? {
            title: data.article?.title ?? "",
            metaDescription: data.article?.metaDescription ?? "",
            headings: data.article?.headings ?? [],
            body: data.article?.body ?? "",
            internalLinks: data.article?.internalLinks ?? [],
            seoScore: data.meta?.seoScore ?? 0,
            tips: data.meta?.tips ?? [],
          }
        : data

      setArticle(article)
      if (authed && data.id) {
        setSaved(true)
        toast.success("Artigo gerado e salvo", {
          description: `"${article.title}" entrou na sua biblioteca como rascunho.`,
        })
      } else if (article?.title) {
        toast.success("Artigo gerado", {
          description: "Salve no localStorage ou crie uma conta pra sincronizar.",
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro de conexao"
      setError(message)
      toast.error("Erro de conexao", { description: message })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Batch generation com:
   *  - serial loop (Gemini Free tem 15 RPM, evita estourar quota)
   *  - cada item com try/catch isolado (uma falha não derruba as outras)
   *  - progress UI por item (queued/running/ok/error/cancelled)
   *  - cancel via AbortController (para na próxima iteração)
   *  - delay 4.2s entre items (=> ~14 RPM, fica abaixo do limite)
   */
  const runBatch = async (items: BatchItem[]) => {
    if (!canGenerate) return
    if (batchAbortRef.current) batchAbortRef.current.abort()
    const abort = new AbortController()
    batchAbortRef.current = abort

    setLoading(true)
    setError("")
    setBatchItems(items.map((it) => ({ ...it })))

    const updateItem = (idx: number, patch: Partial<BatchItem>) => {
      setBatchItems((prev) => {
        const next = [...prev]
        next[idx] = { ...next[idx], ...patch }
        return next
      })
    }

    for (let i = 0; i < items.length; i++) {
      if (abort.signal.aborted) {
        // marca todos restantes como cancelled
        setBatchItems((prev) =>
          prev.map((it, j) =>
            j >= i && it.status === "queued" ? { ...it, status: "cancelled" } : it
          )
        )
        break
      }
      const topic = items[i].topic
      updateItem(i, { status: "running", error: undefined })

      try {
        const res = await apiFetch("/api/generate", {
          method: "POST",
          body: JSON.stringify({
            mode: "topic",
            input: topic,
            tone,
            persist: authed,
            coverStyle,
          }),
          signal: abort.signal,
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          let msg = data.error || `Erro ${res.status}`
          if (res.status === 402) msg = "Limite do plano atingido."
          if (res.status === 429) msg = "Rate limit Gemini. Aguarde."
          if (res.status === 503) msg = "Servidor mal configurado."
          updateItem(i, { status: "error", error: msg })
        } else {
          if (!authed) {
            try {
              await saveArticleToStorage(data, topic)
            } catch {}
          }
          updateItem(i, { status: "ok", result: data })
        }
      } catch (err: unknown) {
        if (abort.signal.aborted) {
          updateItem(i, { status: "cancelled" })
          break
        }
        updateItem(i, {
          status: "error",
          error: err instanceof Error ? err.message : "Erro de rede",
        })
      }

      // Throttle pra respeitar Gemini Free (15 RPM). 4.2s = ~14 req/min.
      // Skip se for o último item.
      if (i < items.length - 1 && !abort.signal.aborted) {
        await new Promise((r) => setTimeout(r, 4200))
      }
    }

    setLoading(false)
    batchAbortRef.current = null
  }

  const handleBatchGenerate = async () => {
    const topics = batchTopics
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t !== "")
      .slice(0, batchCount)

    if (topics.length === 0) return

    const items: BatchItem[] = topics.map((topic) => ({ topic, status: "queued" }))
    await runBatch(items)
  }

  const handleCancelBatch = () => {
    batchAbortRef.current?.abort()
    toast.message("Cancelando geração...", {
      description: "O item atual termina e o resto é cancelado.",
    })
  }

  const handleRetryFailed = async () => {
    const failed = batchItems.filter((it) => it.status === "error" || it.status === "cancelled")
    if (failed.length === 0) return
    // Reseta os falhados pra queued; mantém os ok como ok pra o usuário ver continuidade
    const next: BatchItem[] = batchItems.map((it) =>
      it.status === "error" || it.status === "cancelled"
        ? { ...it, status: "queued", error: undefined }
        : it
    )
    setBatchItems(next)
    // Roda só os que ficaram queued, mas precisamos um runBatch que receba a lista inteira
    // e pule os já ok. Mais simples: extrair só os queued e fazê-los individualmente.
    if (batchAbortRef.current) batchAbortRef.current.abort()
    const abort = new AbortController()
    batchAbortRef.current = abort
    setLoading(true)

    const updateAt = (topicIdx: number, patch: Partial<BatchItem>) => {
      setBatchItems((prev) => {
        const arr = [...prev]
        arr[topicIdx] = { ...arr[topicIdx], ...patch }
        return arr
      })
    }

    for (let i = 0; i < next.length; i++) {
      if (next[i].status !== "queued") continue
      if (abort.signal.aborted) break

      updateAt(i, { status: "running", error: undefined })
      try {
        const res = await apiFetch("/api/generate", {
          method: "POST",
          body: JSON.stringify({
            mode: "topic",
            input: next[i].topic,
            tone,
            persist: authed,
            coverStyle,
          }),
          signal: abort.signal,
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          updateAt(i, {
            status: "error",
            error: data.error || `Erro ${res.status}`,
          })
        } else {
          if (!authed) {
            try {
              await saveArticleToStorage(data, next[i].topic)
            } catch {}
          }
          updateAt(i, { status: "ok", result: data })
        }
      } catch (err) {
        if (abort.signal.aborted) {
          updateAt(i, { status: "cancelled" })
          break
        }
        updateAt(i, {
          status: "error",
          error: err instanceof Error ? err.message : "Erro de rede",
        })
      }
      await new Promise((r) => setTimeout(r, 4200))
    }
    setLoading(false)
    batchAbortRef.current = null
  }

  const batchOk = batchItems.filter((it) => it.status === "ok").length
  const batchFailed = batchItems.filter(
    (it) => it.status === "error" || it.status === "cancelled"
  ).length
  const batchRunning = batchItems.filter((it) => it.status === "running").length
  const batchTotal = batchItems.length

  const saveArticleToStorage = async (art: ArticleOutput, topic?: string) => {
    try {
      const markdown = htmlToMarkdown(art.body)
      await createPost(
        {
          title: art.title,
          slug: slugify(art.title),
          excerpt: art.metaDescription,
          body_html: art.body,
          body_markdown: markdown,
          meta: {
            headings: art.headings,
            internalLinks: art.internalLinks,
            seoScore: art.seoScore,
            tips: art.tips,
            wordCount: countWords(art.body),
            sourceInput: topic || input,
            mode,
            tone,
          },
          status: "draft",
        },
        { authed }
      )
      setSaved(true)
      toast.success("Artigo salvo", {
        description: authed
          ? "Sincronizado com sua conta. Acesse em /artigos."
          : "Salvo nesse navegador. Crie conta pra sincronizar.",
      })
    } catch (err) {
      console.error("save error", err)
      toast.error("Falha ao salvar", {
        description: err instanceof Error ? err.message : "Erro desconhecido",
      })
    }
  }

  const exportMarkdown = () => {
    if (!article) return
    const fakePost = {
      id: "export",
      user_id: "export",
      title: article.title,
      slug: slugify(article.title),
      excerpt: article.metaDescription,
      body_html: article.body,
      body_markdown: htmlToMarkdown(article.body),
      meta: {
        headings: article.headings,
        internalLinks: article.internalLinks,
        seoScore: article.seoScore,
        tips: article.tips,
        wordCount: countWords(article.body),
      },
      status: "draft" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const md = postToMarkdown(fakePost)
    downloadBlob(
      `${article.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.md`,
      md
    )
  }

  return (
    <div className="min-h-screen dot-grid-bg">
      {/* Navbar mini */}
      <div className="w-full px-4 pt-4 lg:px-6 lg:pt-6">
        <nav className="w-full border border-foreground/20 bg-background/80 backdrop-blur-sm px-6 py-3 lg:px-8">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft size={14} />
              <div className="w-6 h-6 bg-[#10b981] flex items-center justify-center">
                <span className="text-background font-mono font-bold text-xs">A</span>
              </div>
              <span className="text-xs font-mono tracking-[0.15em] uppercase font-bold">
                AutoBlogger
              </span>
            </a>
            <div className="flex items-center gap-4">
              <a
                href="/artigos"
                className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase hover:text-foreground transition-colors"
              >
                Meus Artigos
              </a>
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                Gerador de Artigos
              </span>
            </div>
          </div>
        </nav>
      </div>

      <main className="w-full px-6 py-12 lg:px-12 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
              {"// AUTOBLOGGER: GERAR_ARTIGO"}
            </span>
            <div className="flex-1 border-t border-border" />
            <span className="inline-block h-2 w-2 bg-[#10b981] animate-blink" />
          </div>

          <h1 className="font-pixel text-2xl sm:text-4xl lg:text-5xl tracking-tight text-foreground mb-3">
            GERAR ARTIGO
          </h1>
          <p className="text-xs lg:text-sm text-muted-foreground font-mono max-w-lg">
            {blogConfig
              ? `Blog: ${blogConfig.blogName} | Nicho: ${blogConfig.niche}`
              : "Insira um topico, URL, video do YouTube ou keyword e gere um artigo SEO completo com imagem de capa."}
          </p>
        </motion.div>

        {/* Banner de erro: servidor sem GEMINI_API_KEY (caso raríssimo, só quando o env do deploy quebrou) */}
        {!canGenerate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-destructive bg-destructive/10 px-5 py-4 mb-8"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={14} className="text-destructive mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-mono text-foreground font-bold mb-1">Servidor mal configurado</p>
                <p className="text-xs font-mono text-muted-foreground">
                  A geração está temporariamente indisponível. Tenta de novo em alguns minutos ou contate o suporte.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mode toggle: Single vs Batch */}
        <div className="flex gap-0 mb-8">
          <button
            onClick={() => setBatchMode(false)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono tracking-widest uppercase border-2 border-foreground transition-colors ${
              !batchMode ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText size={12} />
            Artigo unico
          </button>
          <button
            onClick={() => setBatchMode(true)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono tracking-widest uppercase border-2 border-foreground -ml-[2px] transition-colors ${
              batchMode ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers size={12} />
            Gerar em massa
          </button>
        </div>

        {/* SINGLE MODE */}
        {!batchMode && (
          <>
            {/* Input Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease }}
              className="border-2 border-foreground mb-8"
            >
              {/* Tab bar */}
              <div className="flex border-b-2 border-foreground flex-wrap">
                <button
                  onClick={() => setMode("topic")}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-mono tracking-widest uppercase transition-colors ${
                    mode === "topic"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText size={12} />
                  Topico
                </button>
                <button
                  onClick={() => setMode("url")}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-mono tracking-widest uppercase border-l-2 border-foreground transition-colors ${
                    mode === "url"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Globe size={12} />
                  URL
                </button>
                <button
                  onClick={() => setMode("youtube")}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-mono tracking-widest uppercase border-l-2 border-foreground transition-colors ${
                    mode === "youtube"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Youtube size={12} />
                  YouTube
                </button>
                <div className="flex-1" />
                <span className="flex items-center px-5 text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                  Gemini 2.5 Flash
                </span>
              </div>

              {/* Input area */}
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                    {mode === "topic"
                      ? "TOPICO DO ARTIGO"
                      : mode === "url"
                        ? "URL DE REFERENCIA"
                        : "LINK DO VIDEO DO YOUTUBE"}
                  </label>
                  <input
                    type={mode === "topic" ? "text" : "url"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      mode === "topic"
                        ? "Ex: Como investir em Bitcoin em 2026"
                        : mode === "url"
                          ? "Ex: https://tecnoblog.net/post/..."
                          : "Ex: https://www.youtube.com/watch?v=..."
                    }
                    className="w-full bg-transparent border-2 border-foreground px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#10b981] transition-colors"
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  />
                  {(mode === "url" || mode === "youtube") && (
                    <p className="text-[10px] font-mono text-muted-foreground mt-1.5">
                      {mode === "url"
                        ? "A gente extrai o conteudo e gera um artigo original baseado nele (nao copia)."
                        : "Pegamos a transcricao do video e geramos um artigo de blog otimizado pra SEO."}
                      {" "}Imagem de capa gerada automaticamente.
                    </p>
                  )}
                </div>

                {/* Tone selector */}
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                    TOM DO ARTIGO
                  </label>
                  <div className="flex gap-0 flex-wrap">
                    {TONES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTone(t.id)}
                        className={`px-4 py-2 text-xs font-mono tracking-widest uppercase border-2 border-foreground -ml-[2px] first:ml-0 transition-colors ${
                          tone === t.id
                            ? "bg-[#10b981] text-background border-[#10b981]"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cover style selector */}
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 flex items-center gap-2">
                    <ImageIcon size={11} />
                    ESTILO DA CAPA
                  </label>
                  <div className="flex gap-0 flex-wrap">
                    {COVER_STYLES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setCoverStyle(s.id)}
                        title={s.hint}
                        className={`px-4 py-2 text-xs font-mono tracking-widest uppercase border-2 border-foreground -ml-[2px] first:ml-0 transition-colors ${
                          coverStyle === s.id
                            ? "bg-[#10b981] text-background border-[#10b981]"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground/70 mt-1.5">
                    {COVER_STYLES.find((s) => s.id === coverStyle)?.hint}
                  </p>
                </div>

                {/* Generate button */}
                <motion.button
                  onClick={handleGenerate}
                  disabled={loading || !input.trim() || (mode === "topic" && !canGenerate)}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.97 }}
                  className={`group flex items-center justify-center gap-0 text-sm font-mono tracking-wider uppercase ${
                    loading || (mode === "topic" && !canGenerate)
                      ? "bg-muted text-muted-foreground cursor-wait"
                      : "bg-foreground text-background cursor-pointer"
                  }`}
                >
                  <span className="flex items-center justify-center w-10 h-10 bg-[#10b981]">
                    {loading ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="inline-flex"
                      >
                        <Sparkles size={16} className="text-background" />
                      </motion.span>
                    ) : (
                      <ArrowRight size={16} strokeWidth={2} className="text-background" />
                    )}
                  </span>
                  <span className="flex-1 py-2.5">
                    {loading
                      ? mode === "youtube"
                        ? "Extraindo transcricao + gerando..."
                        : mode === "url"
                          ? "Extraindo URL + gerando..."
                          : "Gerando artigo..."
                      : mode === "topic"
                        ? "Gerar artigo"
                        : mode === "url"
                          ? "Importar URL + gerar"
                          : "Importar YouTube + gerar"}
                  </span>
                </motion.button>
              </div>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="border-2 border-destructive bg-destructive/10 px-5 py-3 mb-8 flex flex-wrap items-center justify-between gap-3"
                >
                  <span className="text-xs font-mono text-destructive">{error}</span>
                  <div className="flex items-center gap-3">
                    {errorMeta?.status === 429 && (
                      <RetryCountdown
                        seconds={errorMeta.retryIn ?? 60}
                        onDone={() => {
                          setError("")
                          setErrorMeta(null)
                        }}
                      />
                    )}
                    {errorMeta?.status === 402 && (
                      <a
                        href="/#pricing"
                        className="text-[10px] font-mono tracking-widest uppercase border-2 border-destructive text-destructive px-3 py-1.5 hover:bg-destructive hover:text-background transition-colors"
                      >
                        Ver planos →
                      </a>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading skeleton durante geracao single */}
            <AnimatePresence>
              {loading && !article && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease }}
                  className="border-2 border-foreground/30 mb-8 overflow-hidden"
                  aria-live="polite"
                  role="status"
                >
                  <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground/30 bg-foreground/5">
                    <div className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="inline-flex"
                      >
                        <Sparkles size={12} className="text-[#10b981]" />
                      </motion.span>
                      <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-muted-foreground">
                        Gerando...
                      </span>
                    </div>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                      {mode === "youtube"
                        ? "extraindo transcricao"
                        : mode === "url"
                          ? "extraindo URL"
                          : "estruturando topicos"}
                    </span>
                  </div>
                  {/* SEO bar skeleton */}
                  <div className="px-5 py-4 border-b-2 border-foreground/30 flex items-center gap-3">
                    <div className="h-2 w-16 bg-foreground/10" />
                    <div className="flex-1 h-2 bg-foreground/10 overflow-hidden relative">
                      <motion.div
                        className="absolute inset-y-0 left-0 w-1/3 bg-[#10b981]/40"
                        animate={{ x: ["-100%", "300%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    <div className="h-3 w-12 bg-foreground/10" />
                  </div>
                  {/* Title skeleton */}
                  <div className="px-5 py-4 border-b-2 border-foreground/30 space-y-2">
                    <div className="h-2 w-20 bg-foreground/10" />
                    <div className="h-5 w-3/4 bg-foreground/15" />
                    <div className="h-5 w-1/2 bg-foreground/10" />
                  </div>
                  {/* Body skeleton */}
                  <div className="px-5 py-4 border-b-2 border-foreground/30 space-y-2">
                    <div className="h-2 w-32 bg-foreground/10 mb-3" />
                    <div className="h-2.5 w-full bg-foreground/10" />
                    <div className="h-2.5 w-[95%] bg-foreground/10" />
                    <div className="h-2.5 w-[88%] bg-foreground/10" />
                    <div className="h-4 w-1/3 bg-foreground/15 mt-4" />
                    <div className="h-2.5 w-full bg-foreground/10" />
                    <div className="h-2.5 w-[92%] bg-foreground/10" />
                    <div className="h-2.5 w-[80%] bg-foreground/10" />
                  </div>
                  <div className="px-5 py-3 text-center">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                      Pode levar 10-30s. Nao feche essa aba.
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state — antes da primeira geracao */}
            {!loading && !article && !error && !input && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease }}
                className="border-2 border-dashed border-foreground/30 px-6 py-10 text-center"
              >
                <div className="flex items-center justify-center gap-1 mb-3 opacity-60">
                  <FileText size={14} className="text-[#10b981]" />
                  <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                    Output preview
                  </span>
                </div>
                <p className="text-xs font-mono text-muted-foreground/80 mb-4 max-w-md mx-auto leading-relaxed">
                  Cole um topico, URL ou link do YouTube acima. A IA gera{" "}
                  <span className="text-foreground">titulo + meta description + corpo HTML</span>{" "}
                  com headings H2, links internos sugeridos e SEO score.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60">
                  <span>~ 800-1200 palavras</span>
                  <span className="text-muted-foreground/30">·</span>
                  <span>~ 10-30s</span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="text-[#10b981]">Capa incluida</span>
                </div>
              </motion.div>
            )}

            {/* Output */}
            <AnimatePresence>
              {article && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, ease }}
                  className="border-2 border-foreground"
                >
                  {/* Output header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground text-background">
                    <span className="text-[10px] tracking-[0.2em] uppercase font-mono">
                      ARTIGO GERADO
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => void saveArticleToStorage(article)}
                        className={`flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase transition-colors px-2 py-1 border ${
                          saved
                            ? "text-[#10b981] border-[#10b981]"
                            : "text-background/60 hover:text-background border-background/20 hover:border-background/60"
                        }`}
                      >
                        {saved ? <Check size={10} /> : <Save size={10} />}
                        {saved ? "Salvo" : "Salvar"}
                      </button>
                      <button
                        onClick={exportMarkdown}
                        className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-background/60 hover:text-background transition-colors px-2 py-1 border border-background/20 hover:border-background/60"
                      >
                        <FileText size={10} />
                        Exportar MD
                      </button>
                    </div>
                  </div>

                  {/* SEO Score */}
                  <div className="px-5 py-4 border-b-2 border-foreground">
                    <SeoScoreBar score={article.seoScore} />
                  </div>

                  {/* Title */}
                  <div className="px-5 py-4 border-b-2 border-foreground">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
                        TITULO
                      </span>
                      <CopyButton text={article.title} />
                    </div>
                    <h2 className="text-xl lg:text-2xl font-mono font-bold tracking-tight">
                      {article.title}
                    </h2>
                  </div>

                  {/* Meta Description */}
                  <div className="px-5 py-4 border-b-2 border-foreground">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
                        META DESCRIPTION
                      </span>
                      <CopyButton text={article.metaDescription} />
                    </div>
                    <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                      {article.metaDescription}
                    </p>
                  </div>

                  {/* Headings */}
                  <div className="px-5 py-4 border-b-2 border-foreground">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
                        ESTRUTURA H2
                      </span>
                      <CopyButton text={article.headings.join("\n")} />
                    </div>
                    <div className="flex flex-col gap-1">
                      {article.headings.map((h, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-[#10b981]">H2</span>
                          <span className="text-xs font-mono">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-5 py-4 border-b-2 border-foreground">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
                        CORPO DO ARTIGO ({countWords(article.body)} palavras)
                      </span>
                      <CopyButton text={article.body} label="Copiar HTML" />
                    </div>
                    <div
                      className="prose prose-sm max-w-none font-mono text-foreground
                        [&_h2]:text-base [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-[#10b981]
                        [&_p]:text-xs [&_p]:leading-relaxed [&_p]:mb-3 [&_p]:text-muted-foreground
                        [&_strong]:text-foreground
                        [&_ul]:ml-4 [&_li]:text-xs [&_li]:text-muted-foreground [&_li]:mb-1"
                      dangerouslySetInnerHTML={{ __html: article.body }}
                    />
                  </div>

                  {/* Internal Links */}
                  <div className="px-5 py-4 border-b-2 border-foreground">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono block mb-2">
                      SUGESTOES DE LINKS INTERNOS
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {article.internalLinks.map((link, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono tracking-widest uppercase px-3 py-1 border border-[#10b981] text-[#10b981]"
                        >
                          {link}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="px-5 py-4">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono block mb-2">
                      DICAS DE MELHORIA
                    </span>
                    <div className="flex flex-col gap-2">
                      {article.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-[10px] font-mono text-[#10b981] mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                          <span className="text-xs font-mono text-muted-foreground">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* BATCH MODE */}
        {batchMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="border-2 border-foreground mb-8"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground text-background">
              <span className="text-[10px] tracking-[0.2em] uppercase font-mono">
                GERAR EM MASSA
              </span>
              <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-background/60">
                Gemini 2.5 Flash
              </span>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Batch count selector */}
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                  QUANTIDADE DE ARTIGOS
                </label>
                <div className="flex gap-0">
                  {BATCH_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setBatchCount(n)}
                      className={`px-5 py-2 text-sm font-mono font-bold border-2 border-foreground -ml-[2px] first:ml-0 transition-colors ${
                        batchCount === n
                          ? "bg-[#10b981] text-background border-[#10b981]"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topics textarea */}
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                  TOPICOS (UM POR LINHA)
                </label>
                <textarea
                  value={batchTopics}
                  onChange={(e) => setBatchTopics(e.target.value)}
                  placeholder={`Ex:\nComo investir em Bitcoin em 2026\nMelhores carteiras de criptomoedas\nO que e DeFi e como comecar`}
                  rows={batchCount + 1}
                  className="w-full bg-transparent border-2 border-foreground px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#10b981] transition-colors resize-none"
                />
              </div>

              {/* Tone */}
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                  TOM
                </label>
                <div className="flex gap-0 flex-wrap">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={`px-4 py-2 text-xs font-mono tracking-widest uppercase border-2 border-foreground -ml-[2px] first:ml-0 transition-colors ${
                        tone === t.id
                          ? "bg-[#10b981] text-background border-[#10b981]"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cover style */}
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 flex items-center gap-2">
                  <ImageIcon size={11} />
                  ESTILO DA CAPA
                </label>
                <div className="flex gap-0 flex-wrap">
                  {COVER_STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setCoverStyle(s.id)}
                      title={s.hint}
                      className={`px-4 py-2 text-xs font-mono tracking-widest uppercase border-2 border-foreground -ml-[2px] first:ml-0 transition-colors ${
                        coverStyle === s.id
                          ? "bg-[#10b981] text-background border-[#10b981]"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress */}
              {batchTotal > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                      {loading
                        ? `Gerando... ${batchOk + batchFailed}/${batchTotal}`
                        : `Concluído: ${batchOk}/${batchTotal} OK · ${batchFailed} falhou`}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#10b981]">
                      {Math.round(((batchOk + batchFailed) / batchTotal) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 border border-foreground flex">
                    <div
                      className="h-full bg-[#10b981] transition-all duration-500"
                      style={{ width: `${(batchOk / batchTotal) * 100}%` }}
                    />
                    <div
                      className="h-full bg-destructive transition-all duration-500"
                      style={{ width: `${(batchFailed / batchTotal) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Generate / Cancel buttons */}
              {loading ? (
                <div className="flex flex-wrap gap-3">
                  <motion.button
                    onClick={handleCancelBatch}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 bg-destructive text-background px-5 py-2.5 text-xs font-mono tracking-widest uppercase"
                  >
                    <X size={12} />
                    Cancelar batch
                  </motion.button>
                  <span className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                    <Sparkles size={12} className="animate-pulse text-[#10b981]" />
                    {batchRunning > 0 ? `Item ${batchOk + batchFailed + 1}/${batchTotal} em andamento` : "Aguardando..."}
                  </span>
                </div>
              ) : (
                <motion.button
                  onClick={handleBatchGenerate}
                  disabled={!batchTopics.trim() || !canGenerate}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={`group flex items-center justify-center gap-0 text-sm font-mono tracking-wider uppercase ${
                    !canGenerate || !batchTopics.trim()
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-foreground text-background cursor-pointer"
                  }`}
                >
                  <span className="flex items-center justify-center w-10 h-10 bg-[#10b981]">
                    <Layers size={16} strokeWidth={2} className="text-background" />
                  </span>
                  <span className="flex-1 py-2.5">
                    Gerar {Math.min(batchCount, batchTopics.split("\n").filter((t) => t.trim()).length || batchCount)} artigos
                  </span>
                </motion.button>
              )}
            </div>

            {/* Batch items list */}
            {batchItems.length > 0 && (
              <div className="border-t-2 border-foreground">
                <div className="px-5 py-3 bg-foreground/10 flex items-center justify-between">
                  <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-muted-foreground">
                    Status do batch
                  </span>
                  {!loading && batchFailed > 0 && (
                    <button
                      onClick={handleRetryFailed}
                      className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-[#10b981] hover:underline"
                    >
                      <RotateCw size={10} />
                      Tentar de novo as {batchFailed} que falharam
                    </button>
                  )}
                </div>
                {batchItems.map((it, i) => {
                  const colorByStatus: Record<BatchItemStatus, string> = {
                    queued: "text-muted-foreground/60",
                    running: "text-[#eab308]",
                    ok: "text-[#10b981]",
                    error: "text-destructive",
                    cancelled: "text-muted-foreground",
                  }
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between px-5 py-3 border-b border-foreground/20 last:border-b-0"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className={`text-[10px] font-mono ${colorByStatus[it.status]}`}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-xs font-mono font-bold truncate flex-1">
                          {it.result?.title || it.topic}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {it.status === "ok" && (
                          <>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              SEO: {it.result?.seoScore ?? "—"}
                            </span>
                            <Check size={10} className="text-[#10b981]" />
                          </>
                        )}
                        {it.status === "running" && (
                          <span className="text-[10px] font-mono tracking-widest uppercase text-[#eab308] flex items-center gap-1">
                            <Sparkles size={10} className="animate-pulse" />
                            gerando
                          </span>
                        )}
                        {it.status === "queued" && (
                          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60">
                            aguardando
                          </span>
                        )}
                        {it.status === "cancelled" && (
                          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                            cancelado
                          </span>
                        )}
                        {it.status === "error" && (
                          <span
                            className="text-[10px] font-mono tracking-widest uppercase text-destructive truncate max-w-[180px]"
                            title={it.error}
                          >
                            {it.error || "erro"}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
                {!loading && batchOk > 0 && (
                  <div className="px-5 py-3">
                    <a
                      href="/artigos"
                      className="text-xs font-mono text-[#10b981] hover:underline tracking-widest uppercase"
                    >
                      Ver todos os artigos salvos →
                    </a>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  )
}

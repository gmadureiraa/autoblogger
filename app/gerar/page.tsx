"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Copy, Check, FileText, Link, Sparkles, ChevronLeft, Save, Layers, ExternalLink, Key } from "lucide-react"
import { useUser } from "@clerk/nextjs"
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

interface SavedArticle extends ArticleOutput {
  id: string
  createdAt: string
  topic: string
  tone: string
  wordCount: number
}

interface BlogConfig {
  blogName: string
  niche: string
  tone: string
  apiKey: string
  frequency: number
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

export default function GerarPage() {
  const { isSignedIn } = useUser()
  const authed = Boolean(isSignedIn)
  const [mode, setMode] = useState<"topic" | "url">("topic")
  const [input, setInput] = useState("")
  const [tone, setTone] = useState("informativo")
  const [loading, setLoading] = useState(false)
  const [article, setArticle] = useState<ArticleOutput | null>(null)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [blogConfig, setBlogConfig] = useState<BlogConfig | null>(null)

  // Batch mode
  const [batchMode, setBatchMode] = useState(false)
  const [batchCount, setBatchCount] = useState(3)
  const [batchTopics, setBatchTopics] = useState("")
  const [batchProgress, setBatchProgress] = useState(0)
  const [batchTotal, setBatchTotal] = useState(0)
  const [batchResults, setBatchResults] = useState<ArticleOutput[]>([])

  // Load config from localStorage
  useEffect(() => {
    try {
      const configStr = localStorage.getItem("autoblogger_config")
      if (configStr) {
        const config: BlogConfig = JSON.parse(configStr)
        setBlogConfig(config)
        if (config.apiKey) setApiKey(config.apiKey)
        if (config.tone) setTone(config.tone)
      }
    } catch {}
  }, [])

  const hasApiKey = apiKey.trim() !== ""

  const saveApiKey = (key: string) => {
    setApiKey(key)
    try {
      const configStr = localStorage.getItem("autoblogger_config")
      const config = configStr ? JSON.parse(configStr) : {}
      config.apiKey = key
      localStorage.setItem("autoblogger_config", JSON.stringify(config))
      setBlogConfig({ ...blogConfig, apiKey: key } as BlogConfig)
      setShowApiKeyInput(false)
    } catch {}
  }

  const handleGenerate = async () => {
    if (!input.trim() || !hasApiKey) return
    setLoading(true)
    setError("")
    setArticle(null)
    setSaved(false)

    try {
      const res = await apiFetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({ mode, input, tone, apiKey, persist: authed }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao gerar artigo")
        return
      }

      setArticle(data)
      // Se autenticado, o post ja foi persistido no Supabase pelo backend (via persist:true).
      // Caso contrario, marca como nao salvo pra o user poder clicar em "Salvar" (localStorage).
      if (authed && data.id) {
        setSaved(true)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro de conexao"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleBatchGenerate = async () => {
    if (!hasApiKey) return
    const topics = batchTopics
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t !== "")
      .slice(0, batchCount)

    if (topics.length === 0) return

    setBatchProgress(0)
    setBatchTotal(topics.length)
    setBatchResults([])
    setLoading(true)
    setError("")

    const results: ArticleOutput[] = []

    for (let i = 0; i < topics.length; i++) {
      setBatchProgress(i + 1)
      try {
        const res = await apiFetch("/api/generate", {
          method: "POST",
          body: JSON.stringify({
            mode: "topic",
            input: topics[i],
            tone,
            apiKey,
            persist: authed,
          }),
        })
        const data = await res.json()
        if (res.ok) {
          results.push(data)
          // Se autenticado, o backend ja persistiu. Se nao, salva local.
          if (!authed) {
            await saveArticleToStorage(data, topics[i])
          }
        }
      } catch {}
    }

    setBatchResults(results)
    setLoading(false)
  }

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
    } catch (err) {
      console.error("save error", err)
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
              : "Insira um topico ou URL e gere um artigo completo com SEO otimizado usando Gemini 2.0 Flash."}
          </p>
        </motion.div>

        {/* API Key warning */}
        {!hasApiKey && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-[#eab308] bg-[#eab308]/10 px-5 py-4 mb-8"
          >
            <div className="flex items-start gap-3">
              <Key size={14} className="text-[#eab308] mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-mono text-foreground font-bold mb-1">API Key necessaria</p>
                <p className="text-xs font-mono text-muted-foreground mb-3">
                  Voce precisa de uma API key do Google Gemini para gerar artigos.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="Cole sua API key aqui..."
                    className="flex-1 bg-transparent border-2 border-foreground px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#10b981]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveApiKey((e.target as HTMLInputElement).value)
                    }}
                  />
                  <a
                    href="https://ai.google.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-mono text-[#10b981] hover:underline shrink-0"
                  >
                    <ExternalLink size={10} />
                    Obter key
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* API Key edit (when already set) */}
        {hasApiKey && (
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
              API KEY: ***{apiKey.slice(-4)}
            </span>
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="text-[10px] font-mono tracking-widest uppercase text-[#10b981] hover:underline"
            >
              {showApiKeyInput ? "Cancelar" : "Alterar"}
            </button>
            {showApiKeyInput && (
              <input
                type="password"
                placeholder="Nova API key..."
                className="flex-1 bg-transparent border-2 border-foreground px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#10b981]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveApiKey((e.target as HTMLInputElement).value)
                }}
              />
            )}
          </div>
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
              <div className="flex border-b-2 border-foreground">
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
                  <Link size={12} />
                  URL
                </button>
                <div className="flex-1" />
                <span className="flex items-center px-5 text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                  Gemini 2.0 Flash
                </span>
              </div>

              {/* Input area */}
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                    {mode === "topic" ? "TOPICO DO ARTIGO" : "URL DE REFERENCIA"}
                  </label>
                  <input
                    type={mode === "url" ? "url" : "text"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={mode === "topic" ? "Ex: Como investir em Bitcoin em 2026" : "Ex: https://exemplo.com/artigo"}
                    className="w-full bg-transparent border-2 border-foreground px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#10b981] transition-colors"
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  />
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

                {/* Generate button */}
                <motion.button
                  onClick={handleGenerate}
                  disabled={loading || !input.trim() || !hasApiKey}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.97 }}
                  className={`group flex items-center justify-center gap-0 text-sm font-mono tracking-wider uppercase ${
                    loading || !hasApiKey
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
                    {loading ? "Gerando artigo..." : "Gerar artigo"}
                  </span>
                </motion.button>
              </div>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="border-2 border-destructive bg-destructive/10 px-5 py-3 mb-8"
                >
                  <span className="text-xs font-mono text-destructive">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

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
                Gemini 2.0 Flash
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

              {/* Progress */}
              {loading && batchTotal > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                      Gerando {batchProgress}/{batchTotal}...
                    </span>
                    <span className="text-xs font-mono font-bold text-[#10b981]">
                      {Math.round((batchProgress / batchTotal) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 border border-foreground">
                    <div
                      className="h-full bg-[#10b981] transition-all duration-500"
                      style={{ width: `${(batchProgress / batchTotal) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Generate button */}
              <motion.button
                onClick={handleBatchGenerate}
                disabled={loading || !batchTopics.trim() || !hasApiKey}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.97 }}
                className={`group flex items-center justify-center gap-0 text-sm font-mono tracking-wider uppercase ${
                  loading || !hasApiKey
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
                    <Layers size={16} strokeWidth={2} className="text-background" />
                  )}
                </span>
                <span className="flex-1 py-2.5">
                  {loading ? `Gerando ${batchProgress}/${batchTotal}...` : `Gerar ${batchCount} artigos`}
                </span>
              </motion.button>
            </div>

            {/* Batch results */}
            {batchResults.length > 0 && !loading && (
              <div className="border-t-2 border-foreground">
                <div className="px-5 py-3 bg-[#10b981] text-background">
                  <span className="text-[10px] tracking-[0.2em] uppercase font-mono">
                    {batchResults.length} ARTIGOS GERADOS E SALVOS
                  </span>
                </div>
                {batchResults.map((art, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-foreground/20 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-[#10b981]">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-xs font-mono font-bold truncate max-w-xs">{art.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        SEO: {art.seoScore}
                      </span>
                      <Check size={10} className="text-[#10b981]" />
                    </div>
                  </div>
                ))}
                <div className="px-5 py-3">
                  <a
                    href="/artigos"
                    className="text-xs font-mono text-[#10b981] hover:underline tracking-widest uppercase"
                  >
                    Ver todos os artigos salvos →
                  </a>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  )
}

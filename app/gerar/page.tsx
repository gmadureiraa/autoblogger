"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Copy, Check, FileText, Link, Sparkles, ChevronLeft } from "lucide-react"

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

const TONES = [
  { id: "informativo", label: "Informativo" },
  { id: "opinativo", label: "Opinativo" },
  { id: "educacional", label: "Educacional" },
  { id: "analitico", label: "Analitico" },
]

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

export default function GerarPage() {
  const [mode, setMode] = useState<"topic" | "url">("topic")
  const [input, setInput] = useState("")
  const [tone, setTone] = useState("informativo")
  const [loading, setLoading] = useState(false)
  const [article, setArticle] = useState<ArticleOutput | null>(null)
  const [error, setError] = useState("")

  const handleGenerate = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError("")
    setArticle(null)

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, input, tone }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao gerar artigo")
        return
      }

      setArticle(data)
    } catch (err: any) {
      setError(err.message || "Erro de conexao")
    } finally {
      setLoading(false)
    }
  }

  const exportMarkdown = () => {
    if (!article) return
    const md = `# ${article.title}\n\n> ${article.metaDescription}\n\n${article.body.replace(/<h2>/g, "\n## ").replace(/<\/h2>/g, "\n").replace(/<p>/g, "\n").replace(/<\/p>/g, "\n").replace(/<strong>/g, "**").replace(/<\/strong>/g, "**").replace(/<em>/g, "_").replace(/<\/em>/g, "_").replace(/<ul>/g, "").replace(/<\/ul>/g, "").replace(/<li>/g, "- ").replace(/<\/li>/g, "\n").replace(/<[^>]*>/g, "")}\n\n---\n\nSEO Score: ${article.seoScore}/100\nInternal Links: ${article.internalLinks.join(", ")}\nDicas: ${article.tips.join("; ")}`
    const blob = new Blob([md], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${article.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
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
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
              Gerador de Artigos
            </span>
          </div>
        </nav>
      </div>

      <main className="w-full px-6 py-12 lg:px-12 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-12"
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
            Insira um topico ou URL e gere um artigo completo com SEO otimizado usando Gemini 2.0 Flash.
          </p>
        </motion.div>

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
              <div className="flex gap-0">
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
              disabled={loading || !input.trim()}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className={`group flex items-center justify-center gap-0 text-sm font-mono tracking-wider uppercase ${
                loading
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
                    CORPO DO ARTIGO
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
      </main>
    </div>
  )
}

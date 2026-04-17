"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, Copy, Check, Trash2, FileText, ArrowLeft, Search } from "lucide-react"

const ease = [0.22, 1, 0.36, 1] as const

interface SavedArticle {
  id: string
  title: string
  metaDescription: string
  headings: string[]
  body: string
  internalLinks: string[]
  seoScore: number
  tips: string[]
  createdAt: string
  topic: string
  tone: string
  wordCount: number
}

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
      <div className="flex-1 h-1.5 border border-foreground">
        <div className="h-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-mono font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  )
}

export default function ArtigosPage() {
  const [articles, setArticles] = useState<SavedArticle[]>([])
  const [selected, setSelected] = useState<SavedArticle | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    try {
      const saved = localStorage.getItem("autoblogger_articles")
      if (saved) setArticles(JSON.parse(saved))
    } catch {}
  }, [])

  const deleteArticle = (id: string) => {
    const updated = articles.filter((a) => a.id !== id)
    setArticles(updated)
    localStorage.setItem("autoblogger_articles", JSON.stringify(updated))
    if (selected?.id === id) setSelected(null)
  }

  const exportMarkdown = (art: SavedArticle) => {
    const md = `# ${art.title}\n\n> ${art.metaDescription}\n\n${art.body
      .replace(/<h2>/g, "\n## ")
      .replace(/<\/h2>/g, "\n")
      .replace(/<p>/g, "\n")
      .replace(/<\/p>/g, "\n")
      .replace(/<strong>/g, "**")
      .replace(/<\/strong>/g, "**")
      .replace(/<em>/g, "_")
      .replace(/<\/em>/g, "_")
      .replace(/<ul>/g, "")
      .replace(/<\/ul>/g, "")
      .replace(/<li>/g, "- ")
      .replace(/<\/li>/g, "\n")
      .replace(/<[^>]*>/g, "")}\n\n---\nSEO Score: ${art.seoScore}/100`
    const blob = new Blob([md], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${art.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.topic.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })
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
                href="/gerar"
                className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase hover:text-foreground transition-colors"
              >
                Gerar Artigo
              </a>
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                Meus Artigos ({articles.length})
              </span>
            </div>
          </div>
        </nav>
      </div>

      <main className="w-full px-6 py-12 lg:px-12 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
              {"// AUTOBLOGGER: MEUS_ARTIGOS"}
            </span>
            <div className="flex-1 border-t border-border" />
            <span className="inline-block h-2 w-2 bg-[#10b981] animate-blink" />
          </div>

          <h1 className="font-pixel text-2xl sm:text-4xl lg:text-5xl tracking-tight text-foreground mb-3">
            MEUS ARTIGOS
          </h1>
          <p className="text-xs lg:text-sm text-muted-foreground font-mono">
            {articles.length} artigos salvos no seu navegador.
          </p>
        </motion.div>

        {/* Selected article view */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease }}
              className="border-2 border-foreground mb-8"
            >
              {/* Article header */}
              <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground text-background">
                <button
                  onClick={() => setSelected(null)}
                  className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-background/60 hover:text-background"
                >
                  <ArrowLeft size={10} />
                  Voltar
                </button>
                <div className="flex items-center gap-2">
                  <CopyButton text={selected.body} label="HTML" />
                  <button
                    onClick={() => exportMarkdown(selected)}
                    className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-background/60 hover:text-background transition-colors px-2 py-1 border border-background/20 hover:border-background/60"
                  >
                    <FileText size={10} />
                    MD
                  </button>
                </div>
              </div>

              {/* SEO + meta */}
              <div className="px-5 py-4 border-b-2 border-foreground">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                    {formatDate(selected.createdAt)}
                  </span>
                  <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                    {selected.wordCount} palavras
                  </span>
                  <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                    Tom: {selected.tone}
                  </span>
                </div>
                <SeoScoreBar score={selected.seoScore} />
              </div>

              {/* Title */}
              <div className="px-5 py-4 border-b-2 border-foreground">
                <h2 className="text-xl lg:text-2xl font-mono font-bold tracking-tight mb-2">
                  {selected.title}
                </h2>
                <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                  {selected.metaDescription}
                </p>
              </div>

              {/* Body */}
              <div className="px-5 py-4">
                <div
                  className="prose prose-sm max-w-none font-mono text-foreground
                    [&_h2]:text-base [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-[#10b981]
                    [&_p]:text-xs [&_p]:leading-relaxed [&_p]:mb-3 [&_p]:text-muted-foreground
                    [&_strong]:text-foreground
                    [&_ul]:ml-4 [&_li]:text-xs [&_li]:text-muted-foreground [&_li]:mb-1"
                  dangerouslySetInnerHTML={{ __html: selected.body }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Article list */}
        {!selected && (
          <>
            {/* Search */}
            {articles.length > 0 && (
              <div className="flex items-center gap-0 mb-6 border-2 border-foreground">
                <span className="flex items-center justify-center w-10 h-10 bg-foreground">
                  <Search size={14} className="text-background" />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar artigos..."
                  className="flex-1 bg-transparent px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                />
              </div>
            )}

            {articles.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-2 border-foreground/30 px-8 py-16 text-center"
              >
                <FileText size={32} className="text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm font-mono text-muted-foreground mb-4">
                  Nenhum artigo salvo ainda.
                </p>
                <a
                  href="/gerar"
                  className="text-xs font-mono text-[#10b981] hover:underline tracking-widest uppercase"
                >
                  Gerar primeiro artigo →
                </a>
              </motion.div>
            ) : (
              <div className="border-2 border-foreground">
                {/* Table header */}
                <div className="hidden md:grid grid-cols-[1fr_80px_80px_80px_40px] gap-0 px-5 py-2 border-b-2 border-foreground bg-foreground text-background">
                  <span className="text-[10px] font-mono tracking-widest uppercase">Titulo</span>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-center">Data</span>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-center">SEO</span>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-center">Palavras</span>
                  <span />
                </div>

                {filtered.map((art, i) => (
                  <motion.div
                    key={art.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3, ease }}
                    className="grid grid-cols-1 md:grid-cols-[1fr_80px_80px_80px_40px] gap-2 md:gap-0 px-5 py-3 border-b border-foreground/20 last:border-b-0 hover:bg-foreground/5 transition-colors cursor-pointer group"
                    onClick={() => setSelected(art)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-mono font-bold truncate group-hover:text-[#10b981] transition-colors">
                        {art.title}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground truncate md:hidden">
                        {formatDate(art.createdAt)} | SEO: {art.seoScore} | {art.wordCount} palavras
                      </span>
                    </div>
                    <span className="hidden md:flex items-center justify-center text-[10px] font-mono text-muted-foreground">
                      {formatDate(art.createdAt)}
                    </span>
                    <span className="hidden md:flex items-center justify-center">
                      <span
                        className="text-[10px] font-mono font-bold"
                        style={{
                          color: art.seoScore >= 80 ? "#10b981" : art.seoScore >= 60 ? "#eab308" : "#ef4444",
                        }}
                      >
                        {art.seoScore}
                      </span>
                    </span>
                    <span className="hidden md:flex items-center justify-center text-[10px] font-mono text-muted-foreground">
                      {art.wordCount}
                    </span>
                    <div className="hidden md:flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteArticle(art.id)
                        }}
                        className="text-muted-foreground/30 hover:text-destructive transition-colors p-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {filtered.length === 0 && articles.length > 0 && search && (
              <p className="text-xs font-mono text-muted-foreground mt-4">
                Nenhum artigo encontrado para &quot;{search}&quot;.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}

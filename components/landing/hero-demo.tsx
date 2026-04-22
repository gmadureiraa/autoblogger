"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Check, Copy, Globe, Youtube, AlertCircle } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

const ease = [0.22, 1, 0.36, 1] as const

type DemoResult = {
  title: string
  metaDescription: string
  body: string
  seoScore: number
  wordCount?: number
}

function wordCount(html: string): number {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length
}

export function HeroDemo() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()
  const [mode, setMode] = useState<"url" | "youtube">("url")
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DemoResult | null>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const handleSubmit = async () => {
    if (!input.trim()) return
    setError("")
    setResult(null)

    // Sem login, redireciona pro signup com a URL preenchida
    if (isLoaded && !isSignedIn) {
      const params = new URLSearchParams({ source: mode, input: input.trim() })
      router.push(`/onboarding?${params.toString()}`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/generate/from-source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: mode,
          input: input.trim(),
          tone: "informativo",
          length: "medium",
          withCover: false,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Falha ao gerar")
      } else {
        setResult({
          title: data.article?.title ?? "",
          metaDescription: data.article?.metaDescription ?? "",
          body: data.article?.body ?? "",
          seoScore: data.meta?.seoScore ?? 0,
          wordCount: data.meta?.wordCount ?? wordCount(data.article?.body ?? ""),
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de rede")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result.body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="border-2 border-foreground bg-background/80 backdrop-blur-sm">
        {/* Tab switcher */}
        <div className="flex border-b-2 border-foreground">
          <button
            onClick={() => setMode("url")}
            className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono tracking-widest uppercase transition-colors ${
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
            className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono tracking-widest uppercase border-l-2 border-foreground transition-colors ${
              mode === "youtube"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Youtube size={12} />
            YouTube
          </button>
          <div className="flex-1" />
          <span className="hidden sm:flex items-center px-4 text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
            Gemini 2.5 Flash · Imagen 4
          </span>
        </div>

        {/* Input + CTA */}
        <div className="flex flex-col md:flex-row items-stretch gap-0">
          <input
            type="url"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder={
              mode === "url"
                ? "Cole a URL de um artigo — ex: https://www.coindesk.com/..."
                : "Cole o link do video — ex: https://youtube.com/watch?v=..."
            }
            className="flex-1 bg-transparent px-4 md:px-5 py-4 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
            className="group flex items-center gap-0 bg-foreground text-background text-xs md:text-sm font-mono tracking-wider uppercase disabled:opacity-50 disabled:cursor-wait min-w-[220px]"
          >
            <span className="flex items-center justify-center w-12 h-12 bg-[#10b981] shrink-0">
              {loading ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-flex"
                >
                  <Sparkles size={16} className="text-background" />
                </motion.span>
              ) : (
                <ArrowRight size={16} className="text-background" />
              )}
            </span>
            <span className="flex-1 px-4 md:px-5 py-2.5 text-left">
              {loading ? "Gerando..." : "Gerar artigo gratis"}
            </span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 border-2 border-destructive bg-destructive/10 px-4 py-2 flex items-center gap-2 text-destructive"
        >
          <AlertCircle size={14} />
          <span className="text-xs font-mono">{error}</span>
        </motion.div>
      )}

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mt-6 border-2 border-foreground bg-background"
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-foreground bg-foreground text-background">
            <span className="text-[10px] tracking-[0.2em] uppercase font-mono">Rascunho gerado</span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-background/60">
                SEO {result.seoScore}/100 · {result.wordCount} palavras
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] font-mono tracking-widest uppercase hover:text-[#10b981] transition-colors"
              >
                {copied ? <Check size={10} /> : <Copy size={10} />}
                Copiar
              </button>
            </div>
          </div>
          <div className="p-5">
            <h3 className="text-lg lg:text-xl font-mono font-bold mb-2 leading-tight">{result.title}</h3>
            <p className="text-xs font-mono text-muted-foreground italic mb-4">{result.metaDescription}</p>
            <div
              className="prose prose-sm max-w-none font-mono max-h-96 overflow-y-auto
                [&_h2]:text-sm [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-[#10b981]
                [&_p]:text-xs [&_p]:leading-relaxed [&_p]:mb-2 [&_p]:text-muted-foreground
                [&_strong]:text-foreground
                [&_ul]:ml-4 [&_li]:text-xs [&_li]:text-muted-foreground [&_li]:mb-1"
              dangerouslySetInnerHTML={{ __html: result.body }}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, Loader2, Sparkles, Trash2 } from "lucide-react"

type Msg = { role: "user" | "model"; text: string }

const SUGGESTIONS = [
  "Como estruturar um cluster de conteudo para SEO?",
  "Qual o melhor jeito de reescrever um video do YouTube em artigo?",
  "Como o Google avalia EEAT em 2026?",
  "Me da um template de intro de blog que converte.",
  "Como publicar no WordPress via autoblogger?",
]

// Renderer simples de markdown (negrito, inline code, listas, h2/h3, paragrafo)
function renderMarkdown(text: string): string {
  let out = text
    // escape primeiro
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  // code blocks ```
  out = out.replace(/```([\s\S]*?)```/g, (_, code) =>
    `<pre class="bg-foreground text-background text-[11px] font-mono p-3 my-2 overflow-x-auto whitespace-pre-wrap">${code.trim()}</pre>`
  )
  // inline code
  out = out.replace(/`([^`\n]+)`/g, '<code class="bg-muted px-1 py-0.5 text-[11px] font-mono">$1</code>')
  // bold
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
  // italic
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  // headings ##
  out = out.replace(/^###\s+(.+)$/gm, '<h4 class="text-sm font-mono font-bold uppercase tracking-wide mt-3 mb-1">$1</h4>')
  out = out.replace(/^##\s+(.+)$/gm, '<h3 class="text-base font-mono font-bold uppercase tracking-wide mt-4 mb-2">$1</h3>')
  // numbered lists
  out = out.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="flex gap-2 my-1"><span class="font-mono text-[#10b981] font-bold">$1.</span><span>$2</span></div>')
  // bullets
  out = out.replace(/^-\s+(.+)$/gm, '<div class="flex gap-2 my-1"><span class="font-mono text-[#10b981]">-</span><span>$1</span></div>')
  // double newline -> paragraph break
  out = out
    .split(/\n{2,}/)
    .map((p) => {
      if (/^<(h3|h4|pre|div)/.test(p.trim())) return p
      return `<p class="my-2">${p.replace(/\n/g, "<br/>")}</p>`
    })
    .join("\n")
  return out
}

export function EnsinaAiChat() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, loading])

  async function send(content: string) {
    const text = content.trim()
    if (!text || loading) return
    setError(null)
    setInput("")

    const newUserMsg: Msg = { role: "user", text }
    const history = messages
    setMessages([...history, newUserMsg, { role: "model", text: "" }])
    setLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const resp = await fetch("/api/ensina-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, message: text }),
        signal: controller.signal,
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }))
        throw new Error(err.error || `HTTP ${resp.status}`)
      }
      if (!resp.body) throw new Error("Sem resposta do servidor.")

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let acc = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        acc += chunk
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: "model", text: acc }
          return copy
        })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao responder."
      setError(msg)
      setMessages((prev) => {
        const copy = [...prev]
        // se ultima msg for vazia do model, remove
        if (copy.length && copy[copy.length - 1].role === "model" && !copy[copy.length - 1].text) {
          copy.pop()
        }
        return copy
      })
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  function clearChat() {
    abortRef.current?.abort()
    setMessages([])
    setError(null)
  }

  return (
    <div className="border-2 border-foreground bg-background flex flex-col min-h-[560px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-foreground bg-foreground/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#10b981] flex items-center justify-center">
            <Sparkles size={14} strokeWidth={2} className="text-background" />
          </div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider">
            Ensina AI
          </span>
          {loading && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground ml-2">
              <Loader2 size={10} className="animate-spin" />
              pensando...
            </span>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            <Trash2 size={12} />
            Limpar
          </button>
        )}
      </div>

      {/* Scroll area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5 max-h-[min(70vh,680px)]"
      >
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-5">
              Faca uma pergunta ou escolha uma sugestao
            </p>
            <div className="grid gap-2 max-w-xl mx-auto">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-xs font-mono border border-border hover:border-foreground hover:bg-foreground/5 transition-colors px-3 py-2.5 group flex items-center gap-2"
                >
                  <span className="text-[#10b981] group-hover:translate-x-0.5 transition-transform">
                    &gt;
                  </span>
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "model" && (
              <div className="shrink-0 w-7 h-7 bg-[#10b981] flex items-center justify-center">
                <Sparkles size={12} strokeWidth={2} className="text-background" />
              </div>
            )}
            <div
              className={`max-w-[85%] text-sm font-mono leading-relaxed ${
                m.role === "user"
                  ? "bg-foreground text-background px-3 py-2"
                  : "text-foreground"
              }`}
            >
              {m.role === "user" ? (
                <span className="whitespace-pre-wrap">{m.text}</span>
              ) : m.text ? (
                <div
                  className="prose-chat"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }}
                />
              ) : (
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Loader2 size={12} className="animate-spin" />
                  gerando resposta...
                </span>
              )}
            </div>
            {m.role === "user" && (
              <div className="shrink-0 w-7 h-7 border-2 border-foreground flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold">YOU</span>
              </div>
            )}
          </div>
        ))}

        {error && (
          <div className="border-2 border-destructive bg-destructive/10 px-3 py-2 text-xs font-mono text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="border-t-2 border-foreground p-3 flex items-stretch gap-2 bg-background"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Pergunta sobre SEO, blog, IA, WordPress..."
          className="flex-1 bg-transparent border-2 border-foreground px-3 py-2.5 text-sm font-mono focus:outline-none focus:bg-foreground/5 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="group flex items-center gap-0 bg-foreground text-background text-xs font-mono tracking-wider uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center justify-center w-10 h-full bg-[#10b981] min-h-[42px]">
            {loading ? (
              <Loader2 size={14} className="text-background animate-spin" />
            ) : (
              <ArrowRight
                size={14}
                strokeWidth={2}
                className="text-background group-hover:translate-x-0.5 transition-transform"
              />
            )}
          </span>
          <span className="px-4 py-2.5 whitespace-nowrap">Enviar</span>
        </button>
      </form>
    </div>
  )
}

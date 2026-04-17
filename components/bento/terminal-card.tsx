"use client"

import { useEffect, useState } from "react"

const LOG_LINES = [
  "> Inicializando AutoBlogger...",
  "> Nicho detectado: criptomoedas",
  "> Conectando Gemini 2.0 Flash...",
  "> Pesquisando trending topics...",
  "> Gerando artigo: 'Bitcoin atinge nova ATH'",
  "> Otimizando SEO on-page...",
  "> Inserindo meta description...",
  "> Gerando headings H2/H3...",
  "> Schema markup: ArticlePosting",
  "> Internal linking: 3 artigos...",
  "> SEO Score: 94/100",
  "> Publicando no WordPress...",
  "> Status: PUBLICADO",
  "> Proximo artigo em: 4h 23m",
  "> --------- CICLO COMPLETO ---------",
]

export function TerminalCard() {
  const [lines, setLines] = useState<string[]>([])
  const [currentLine, setCurrentLine] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLine((prev) => {
        const next = prev + 1
        if (next >= LOG_LINES.length) {
          setLines([])
          return 0
        }
        setLines((l) => [...l.slice(-8), LOG_LINES[next]])
        return next
      })
    }, 600)

    setLines([LOG_LINES[0]])

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 border-b-2 border-foreground px-4 py-2">
        <span className="h-2 w-2 bg-[#10b981]" />
        <span className="h-2 w-2 bg-foreground" />
        <span className="h-2 w-2 border border-foreground" />
        <span className="ml-auto text-[10px] tracking-widest text-muted-foreground uppercase">
          IA que escreve por voce
        </span>
      </div>
      <div className="flex-1 bg-foreground p-4 overflow-hidden">
        <div className="flex flex-col gap-1">
          {lines.map((line, i) => (
            <span
              key={`${currentLine}-${i}`}
              className="text-xs text-background font-mono block"
              style={{ opacity: i === lines.length - 1 ? 1 : 0.6 }}
            >
              {line}
            </span>
          ))}
          <span className="text-xs text-[#10b981] font-mono animate-blink">{"_"}</span>
        </div>
      </div>
    </div>
  )
}

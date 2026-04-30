"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import { AsciiParticles } from "./ascii-particles"

const ease = [0.22, 1, 0.36, 1] as const

const FRONTMATTER = `---
title: "5 estrategias de SEO que ainda funcionam em 2026"
slug: "estrategias-seo-2026"
description: "O algoritmo mudou. Estas 5 taticas sobreviveram a era da AI Overview."
date: "2026-04-28"
category: "SEO"
tags: ["seo", "google", "ai-overviews", "content"]
seoScore: 94
wordCount: 1247
coverImage: "/og/estrategias-seo-2026.png"
---`

const BODY = `# 5 estrategias de SEO que ainda funcionam em 2026

A AI Overview do Google reorganizou o jogo. Quem dependia de \`how to\`
articles genericos perdeu **40% do trafego organico**. Quem ja entendia
intent ganhou. Estes sao os 5 movimentos que ainda escalam.

## 1. Topical authority em vez de keyword spam

Cluster completo > pagina avulsa. O Google pondera contexto, nao
densidade. Construa 8-12 paginas por topic, com hub + spokes.

- Hub: visao geral 2.000+ palavras
- Spokes: subtopicos especificos 1.000-1.500 palavras
- Internal linking entre todos

## 2. Schema markup como diferencial`

interface Props {
  delay?: number
}

export function OutputPreview({ delay = 0 }: Props) {
  const reduce = useReducedMotion()
  const [typedFm, setTypedFm] = useState("")
  const [typedBody, setTypedBody] = useState("")
  const [phase, setPhase] = useState<"idle" | "fm" | "body" | "done">("idle")

  useEffect(() => {
    if (reduce) {
      setTypedFm(FRONTMATTER)
      setTypedBody(BODY)
      setPhase("done")
      return
    }
    const startTimer = setTimeout(() => setPhase("fm"), 600 + delay * 1000)
    return () => clearTimeout(startTimer)
  }, [reduce, delay])

  useEffect(() => {
    if (phase === "fm") {
      let i = 0
      const interval = setInterval(() => {
        i += 8
        setTypedFm(FRONTMATTER.slice(0, i))
        if (i >= FRONTMATTER.length) {
          clearInterval(interval)
          setPhase("body")
        }
      }, 18)
      return () => clearInterval(interval)
    }
    if (phase === "body") {
      let i = 0
      const interval = setInterval(() => {
        i += 12
        setTypedBody(BODY.slice(0, i))
        if (i >= BODY.length) {
          clearInterval(interval)
          setPhase("done")
        }
      }, 14)
      return () => clearInterval(interval)
    }
  }, [phase])

  return (
    <section className="relative w-full px-6 lg:px-12 py-24">
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center gap-4 mb-8 max-w-6xl mx-auto"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          {"// OUTPUT"}
        </span>
        <div className="flex-1 border-t border-border" />
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          markdown + frontmatter
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease }}
        className="max-w-6xl mx-auto mb-10 relative"
      >
        <h2 className="font-pixel text-3xl md:text-4xl lg:text-5xl tracking-tight uppercase leading-[1.05] max-w-3xl">
          O QUE SAI <span className="text-[#10b981]">DA MAQUINA</span>.
        </h2>
        <p className="mt-4 text-xs md:text-sm font-mono text-muted-foreground max-w-xl">
          Markdown limpo com frontmatter pronto pra Next.js, Astro, Hugo, Gatsby ou
          qualquer SSG. Ou publica direto no WordPress via REST.
        </p>

        {/* ASCII particles: chars caem com gravidade + colisao — pequeno, ao lado do titulo */}
        <div
          aria-hidden="true"
          className="hidden lg:block absolute right-0 top-0 pointer-events-none"
        >
          <AsciiParticles width={56} height={14} fontSize={9} opacity={0.5} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.7, ease }}
        className="relative max-w-6xl mx-auto border-2 border-foreground bg-background/80 backdrop-blur-sm shadow-[8px_8px_0_0_hsl(var(--foreground)/0.08)]"
      >
        {/* Terminal header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-foreground bg-foreground text-background">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
            <span className="ml-3 text-[10px] font-mono tracking-widest uppercase opacity-80">
              article.md
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono tracking-widest uppercase opacity-60">
              SEO 94/100
            </span>
            <span className="hidden sm:inline-block h-3 w-px bg-background/30" />
            <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono tracking-widest uppercase text-[#10b981]">
              <Check size={10} />
              ready
            </span>
          </div>
        </div>

        {/* Code body */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr]">
          {/* Line numbers */}
          <div
            className="hidden lg:flex flex-col items-end gap-0 px-3 py-5 border-r-2 border-foreground bg-foreground/[0.03] select-none"
            aria-hidden="true"
          >
            {Array.from({ length: 32 }).map((_, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono text-muted-foreground/40 leading-[1.55] tabular-nums"
              >
                {String(idx + 1).padStart(2, "0")}
              </span>
            ))}
          </div>

          <div className="px-5 py-5 text-[11px] md:text-xs font-mono leading-[1.55] overflow-x-auto">
            {/* Frontmatter highlighted */}
            <div className="text-muted-foreground whitespace-pre">
              {typedFm.split("\n").map((line, i) => {
                if (line.startsWith("---")) {
                  return (
                    <div key={i} className="text-[#10b981]">
                      {line || " "}
                    </div>
                  )
                }
                const m = line.match(/^(\s*)([\w]+):\s?(.*)$/)
                if (m) {
                  return (
                    <div key={i}>
                      {m[1]}
                      <span className="text-[#10b981]">{m[2]}</span>
                      <span className="text-foreground">: </span>
                      <span className="text-foreground">{m[3]}</span>
                    </div>
                  )
                }
                return <div key={i}>{line || " "}</div>
              })}
            </div>
            {phase !== "idle" && <div className="h-3" />}
            <div className="text-foreground whitespace-pre-wrap break-words">
              {typedBody.split("\n").map((line, i) => {
                if (line.startsWith("# ")) {
                  return (
                    <div key={i} className="text-[#10b981] font-bold">
                      {line}
                    </div>
                  )
                }
                if (line.startsWith("## ")) {
                  return (
                    <div key={i} className="text-foreground font-bold mt-2">
                      {line}
                    </div>
                  )
                }
                if (line.startsWith("- ")) {
                  return (
                    <div key={i} className="text-muted-foreground">
                      <span className="text-[#10b981]">-</span>
                      {line.slice(1)}
                    </div>
                  )
                }
                return (
                  <div key={i} className="text-muted-foreground">
                    {line || " "}
                  </div>
                )
              })}
              {phase !== "done" && phase !== "idle" && (
                <span className="inline-block w-2 h-3 bg-[#10b981] animate-blink align-middle ml-0.5" />
              )}
              {phase === "done" && (
                <span className="inline-block w-1.5 h-3 bg-[#10b981] animate-blink align-middle ml-1" />
              )}
            </div>
          </div>

          {/* Label "GENERATED IN 4.2s" aparece ao concluir typing */}
          {phase === "done" && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease }}
              className="absolute right-3 top-12 hidden md:flex items-center gap-2 border border-[#10b981]/40 bg-background/85 backdrop-blur-sm px-2 py-1"
            >
              <span className="inline-block h-1.5 w-1.5 bg-[#10b981] animate-blink" />
              <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-[#10b981]">
                [ GENERATED IN 4.2s ]
              </span>
            </motion.div>
          )}
        </div>

        {/* Footer com stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-t-2 border-foreground">
          {[
            { k: "PALAVRAS", v: "1.247" },
            { k: "TEMPO LEITURA", v: "5MIN" },
            { k: "SEO SCORE", v: "94" },
            { k: "STATUS", v: "READY", accent: true },
          ].map((m, i) => {
            const isLast = i === 3
            const isMobileFirstRow = i < 2
            const isMobileOddCol = i % 2 === 0
            return (
            <div
              key={m.k}
              className={[
                "flex flex-col gap-1 px-4 py-3",
                // mobile 2 col
                isMobileOddCol ? "max-md:border-r-2 max-md:border-foreground" : "",
                isMobileFirstRow ? "max-md:border-b-2 max-md:border-foreground" : "",
                // desktop 4 col
                !isLast ? "md:border-r-2 md:border-foreground" : "",
              ].join(" ")}
            >
              <span className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground">
                {m.k}
              </span>
              <span
                className={`font-mono font-bold text-sm tabular-nums ${
                  m.accent ? "text-[#10b981]" : "text-foreground"
                }`}
              >
                {m.v}
              </span>
            </div>
            )
          })}
        </div>
      </motion.div>
    </section>
  )
}

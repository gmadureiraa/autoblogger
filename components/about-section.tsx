"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useInView } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const

/* -- scramble text reveal -- */
function ScrambleText({ text, className }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-50px" })
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_./:"

  useEffect(() => {
    if (!inView) return
    let iteration = 0
    const interval = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((char, i) => {
            if (char === " ") return " "
            if (i < iteration) return text[i]
            return chars[Math.floor(Math.random() * chars.length)]
          })
          .join("")
      )
      iteration += 0.5
      if (iteration >= text.length) {
        setDisplay(text)
        clearInterval(interval)
      }
    }, 30)
    return () => clearInterval(interval)
  }, [inView, text])

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}

/* -- blinking cursor -- */
function BlinkDot() {
  return <span className="inline-block h-2 w-2 bg-[#10b981] animate-blink" />
}

/* -- live article counter -- */
function ArticleCounter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const base = 12847 + Math.floor(Math.random() * 500)
    setCount(base)
    const interval = setInterval(() => setCount((c) => c + 1), 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className="font-mono text-[#10b981]" style={{ fontVariantNumeric: "tabular-nums" }}>
      {count.toLocaleString("pt-BR")} artigos gerados
    </span>
  )
}

/* -- API cost table -- */
const API_COSTS = [
  { freq: "1/dia", cost: "~R$15/mes", articles: "365 artigos/ano" },
  { freq: "3/dia", cost: "~R$45/mes", articles: "1.095 artigos/ano" },
  { freq: "5/dia", cost: "~R$75/mes", articles: "1.825 artigos/ano" },
  { freq: "10/dia", cost: "~R$150/mes", articles: "3.650 artigos/ano" },
]

/* -- main about section -- */
export function AboutSection() {
  return (
    <section id="como-funciona" className="w-full px-6 py-20 lg:px-12">
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center gap-4 mb-8"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          {"// SECTION: TRANSPARENCIA_CUSTOS"}
        </span>
        <div className="flex-1 border-t border-border" />
        <BlinkDot />
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          003
        </span>
      </motion.div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-0 border-2 border-foreground">
        {/* Left: API Cost Table */}
        <motion.div
          initial={{ opacity: 0, x: -30, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease }}
          className="relative w-full lg:w-1/2 border-b-2 lg:border-b-0 lg:border-r-2 border-foreground overflow-hidden bg-foreground"
        >
          {/* Header overlay */}
          <div className="flex items-center justify-between px-5 py-3 border-b-2 border-background/20">
            <span className="text-[10px] tracking-[0.2em] uppercase text-background/60 font-mono">
              CUSTO API GEMINI (SUA CONTA)
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#10b981] font-mono">
              TRANSPARENTE
            </span>
          </div>

          {/* Table */}
          <div className="p-5">
            <div className="grid grid-cols-3 gap-2 border-b border-background/20 pb-3 mb-3">
              <span className="text-[10px] tracking-[0.15em] uppercase text-background/50 font-mono">Frequencia</span>
              <span className="text-[10px] tracking-[0.15em] uppercase text-background/50 font-mono">Custo API</span>
              <span className="text-[10px] tracking-[0.15em] uppercase text-background/50 font-mono text-right">Producao</span>
            </div>
            {API_COSTS.map((row, i) => (
              <motion.div
                key={row.freq}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.4, ease }}
                className="grid grid-cols-3 gap-2 py-3 border-b border-background/10 last:border-none"
              >
                <span className="text-sm font-mono text-background font-bold">{row.freq}</span>
                <span className="text-sm font-mono text-[#10b981] font-bold">{row.cost}</span>
                <span className="text-sm font-mono text-background/80 text-right">{row.articles}</span>
              </motion.div>
            ))}

            <div className="mt-6 pt-4 border-t border-background/20">
              <p className="text-xs font-mono text-background/50 leading-relaxed">
                * Voce usa sua propria API key do Google Gemini. Sem markups, sem surpresas. O custo e so do token consumido.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right: Content */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.1, ease }}
          className="flex flex-col w-full lg:w-1/2"
        >
          {/* Header bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground">
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
              COMO_FUNCIONA.md
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
              v1.0.0
            </span>
          </div>

          {/* Content body */}
          <div className="flex-1 flex flex-col justify-between px-5 py-6 lg:py-8">
            <div className="flex flex-col gap-6">
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: 0.2, ease }}
                className="text-2xl lg:text-3xl font-mono font-bold tracking-tight uppercase text-balance"
              >
                Sua API, seu controle.
                <br />
                <span className="text-[#10b981]">Transparencia total.</span>
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: 0.3, duration: 0.5, ease }}
                className="flex flex-col gap-4"
              >
                <p className="text-xs lg:text-sm font-mono text-muted-foreground leading-relaxed">
                  Nos construimos e configuramos toda a infraestrutura. Voce conecta sua propria API key do Google Gemini e tem visibilidade total dos custos. Sem intermediarios, sem markups escondidos.
                </p>
                <p className="text-xs lg:text-sm font-mono text-muted-foreground leading-relaxed">
                  O Gemini 2.0 Flash e o modelo mais rapido e barato do mercado para geracao de conteudo em escala. Cada artigo custa centavos — e voce controla exatamente quanto quer gastar.
                </p>
              </motion.div>

              {/* Counter line */}
              <motion.div
                initial={{ opacity: 0, scaleX: 0.8 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5, ease }}
                style={{ transformOrigin: "left" }}
                className="flex items-center gap-3 py-3 border-t-2 border-b-2 border-foreground"
              >
                <span className="h-1.5 w-1.5 bg-[#10b981]" />
                <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
                  TOTAL:
                </span>
                <ArticleCounter />
              </motion.div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-0 mt-6">
              {[
                { label: "MODELO_IA", value: "Gemini 2.0" },
                { label: "SETUP", value: "48h" },
                { label: "SEO_SCORE", value: "94+" },
                { label: "UPTIME", value: "99.9%" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                  whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ delay: 0.15 + i * 0.08, duration: 0.5, ease }}
                  className="flex flex-col gap-1 border-2 border-foreground px-4 py-3"
                >
                  <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
                    {stat.label}
                  </span>
                  <span className="text-xl lg:text-2xl font-mono font-bold tracking-tight">
                    <ScrambleText text={stat.value} />
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

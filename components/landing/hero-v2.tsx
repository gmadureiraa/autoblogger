"use client"

import { motion } from "framer-motion"
import { HeroDemo } from "./hero-demo"

const ease = [0.22, 1, 0.36, 1] as const

export function HeroV2() {
  return (
    <section className="relative w-full px-6 pt-6 pb-20 lg:px-12 lg:pt-10 lg:pb-24">
      {/* Tag */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center gap-3 max-w-4xl mx-auto mb-6"
      >
        <span className="inline-block h-2 w-2 bg-[#10b981] animate-blink" />
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          Blog autopilot · Gemini 2.5 + Imagen 4 · Next.js
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease }}
        className="font-pixel text-4xl sm:text-6xl lg:text-7xl xl:text-8xl tracking-tight text-foreground text-center max-w-5xl mx-auto mb-6 select-none leading-[0.95]"
      >
        AUTOPILOT PARA BLOG SEO.
        <br />
        <span className="text-[#10b981]">ARTIGOS DE 1000+ PALAVRAS</span>
        <br />
        EM MINUTOS.
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease }}
        className="text-sm sm:text-base font-mono text-muted-foreground text-center max-w-2xl mx-auto mb-10 leading-relaxed"
      >
        Cole uma URL ou link de video. A IA extrai, reescreve com voz propria, gera capa e
        publica no seu blog publico ou WordPress. Zero redator, zero config.
      </motion.p>

      {/* Demo interativo */}
      <HeroDemo />

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease }}
        className="flex flex-wrap items-center justify-center gap-6 mt-10 max-w-3xl mx-auto"
      >
        {[
          { value: "< 90s", label: "para gerar" },
          { value: "1000+", label: "palavras por artigo" },
          { value: "92", label: "SEO score medio" },
          { value: "3", label: "integrações" },
        ].map((stat, i) => (
          <div key={stat.label} className="flex items-center gap-2">
            {i > 0 && <span className="h-4 w-px bg-border" />}
            <span className="text-sm font-mono font-bold text-[#10b981]">{stat.value}</span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
              {stat.label}
            </span>
          </div>
        ))}
      </motion.div>
    </section>
  )
}

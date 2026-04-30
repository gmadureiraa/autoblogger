"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { HeroDemo } from "./hero-demo"
import { AsciiWave } from "./ascii-wave"

const ease = [0.22, 1, 0.36, 1] as const

export function HeroV2() {
  return (
    <section className="relative w-full px-6 pt-16 pb-24 lg:px-12 md:pt-20 lg:pb-32">
      {/* Tag superior */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center justify-center gap-3 mb-8 md:mb-10"
      >
        <span className="inline-flex items-center gap-2 border border-foreground/20 bg-background/60 backdrop-blur-sm px-3 py-1.5">
          <span className="inline-block h-1.5 w-1.5 bg-[#10b981] animate-blink" />
          <span className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-mono">
            Blog autopilot · Gemini 2.5 + Imagen 4 · Next.js
          </span>
        </span>
      </motion.div>

      {/* Headline gigante */}
      <motion.h1
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease }}
        className="font-pixel text-[28px] sm:text-4xl md:text-5xl lg:text-6xl xl:text-[68px] tracking-tight text-foreground text-center max-w-4xl mx-auto mb-6 md:mb-8 select-none leading-[1.1]"
      >
        AUTOPILOT
        <br />
        PARA BLOG SEO.
        <br />
        <span
          className="bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(90deg, #10b981 0%, #34d399 50%, #10b981 100%)",
          }}
        >
          1000+ PALAVRAS
        </span>
        <br />
        EM MINUTOS.
      </motion.h1>

      {/* Sub */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease }}
        className="text-sm sm:text-base md:text-lg font-mono text-muted-foreground text-center max-w-xl mx-auto mb-12 md:mb-14 leading-relaxed"
      >
        Cole uma URL ou link de video. A IA extrai, reescreve com voz propria, gera capa e
        publica no seu blog publico ou WordPress.
        <span className="block mt-1 text-foreground/80">Zero redator, zero config.</span>
      </motion.p>

      {/* Wrapper do playground com label "LIVE PLAYGROUND" */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease }}
        className="max-w-3xl mx-auto relative"
      >
        {/* ASCII wave — fogo de chars subindo/descendo a esquerda do playground em telas grandes */}
        <div
          aria-hidden="true"
          className="hidden xl:block absolute -left-[260px] top-0 pointer-events-none"
        >
          <AsciiWave width={48} height={18} fontSize={8} opacity={0.45} />
        </div>
        <div className="flex items-center gap-3 mb-3 px-1">
          <span className="inline-block h-1.5 w-1.5 bg-[#10b981] animate-blink" />
          <span className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-mono">
            LIVE PLAYGROUND
          </span>
          <div className="flex-1 h-px bg-border/60" />
          <span className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-mono">
            tente agora
          </span>
        </div>

        {/* Container com shadow brutalist */}
        <div className="relative shadow-[8px_8px_0_0_hsl(var(--foreground))]">
          <HeroDemo />
        </div>
      </motion.div>

      {/* Stats inline */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45, ease }}
        className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-14 md:mt-16 max-w-3xl mx-auto"
      >
        {[
          { value: "< 90s", label: "para gerar" },
          { value: "1000+", label: "palavras" },
          { value: "92", label: "SEO score" },
          { value: "3", label: "integracoes" },
        ].map((stat, i) => (
          <div key={stat.label} className="flex items-center gap-2">
            {i > 0 && <span className="hidden sm:inline-block h-4 w-px bg-border" />}
            <span className="text-sm md:text-base font-mono font-bold text-[#10b981] tabular-nums">
              {stat.value}
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
              {stat.label}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Scroll cue */}
      <motion.a
        href="#how-it-works"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7, ease }}
        className="hidden md:flex flex-col items-center gap-2 mt-20 group"
      >
        <span className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground/60 font-mono group-hover:text-foreground transition-colors">
          ROLE PRA VER COMO FUNCIONA
        </span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-muted-foreground/60 group-hover:text-[#10b981] transition-colors"
        >
          <ArrowRight size={16} className="rotate-90" />
        </motion.span>
      </motion.a>
    </section>
  )
}

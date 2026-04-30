"use client"

import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import { AsciiClean } from "./ascii-clean"
import { AsciiWave } from "./ascii-wave"

const ease = [0.22, 1, 0.36, 1] as const

export function FinalCta() {
  return (
    <section className="relative w-full px-6 lg:px-12 py-28 overflow-hidden">
      {/* Glow circular atras */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.18), rgba(16, 185, 129, 0) 65%)",
          filter: "blur(40px)",
        }}
      />

      {/* ASCII clean — drift sutil de fundo full width, esconde em mobile */}
      <div
        aria-hidden="true"
        className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none overflow-hidden"
      >
        <AsciiClean width={120} height={20} fontSize={9} opacity={0.18} />
      </div>
      {/* Wave discreta lateral — so em telas xl */}
      <div
        aria-hidden="true"
        className="hidden xl:block absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none"
      >
        <AsciiWave width={28} height={20} fontSize={8} opacity={0.32} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease }}
        className="relative max-w-4xl mx-auto text-center"
      >
        <div className="flex items-center gap-2 justify-center mb-6">
          <span className="inline-block h-1.5 w-1.5 bg-[#10b981] animate-blink" />
          <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground font-mono">
            PRONTO PRA AUTOPILOT?
          </span>
          <span className="inline-block h-1.5 w-1.5 bg-[#10b981] animate-blink" />
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease }}
          className="font-pixel text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tight leading-[1] uppercase select-none"
        >
          GERA SEU PRIMEIRO
          <br />
          <span className="text-[#10b981]">ARTIGO</span> EM 90s.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.15, ease }}
          className="mt-6 text-sm md:text-base font-mono text-muted-foreground max-w-xl mx-auto leading-relaxed"
        >
          Sem cartao. Sem onboarding burocratico. Cola um link, escolhe o tom, sai
          pronto pra publicar.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.25, ease }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.a
            href="/gerar"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group inline-flex items-stretch bg-foreground text-background text-sm md:text-base font-mono tracking-wider uppercase shadow-[6px_6px_0_0_hsl(var(--foreground))] hover:shadow-[8px_8px_0_0_#10b981] transition-shadow"
          >
            <span className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-[#10b981] group-hover:rotate-12 transition-transform">
              <Sparkles size={18} className="text-background" />
            </span>
            <span className="flex items-center px-6 md:px-8">Gerar artigo gratis</span>
          </motion.a>
          <motion.a
            href="/#pricing"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group inline-flex items-stretch border-2 border-foreground bg-transparent text-foreground text-sm md:text-base font-mono tracking-wider uppercase hover:bg-foreground hover:text-background transition-colors"
          >
            <span className="flex items-center px-6 md:px-8 py-3 md:py-4">Ver planos</span>
            <span className="flex items-center justify-center w-12 md:w-14 border-l-2 border-foreground group-hover:border-background">
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4, ease }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-mono tracking-[0.18em] uppercase text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 bg-[#10b981]" />
            sem cartao
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 bg-[#10b981]" />
            5 artigos gratis
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 bg-[#10b981]" />
            cancela a qualquer hora
          </span>
        </motion.div>
      </motion.div>
    </section>
  )
}

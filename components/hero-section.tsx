"use client"

import { WorkflowDiagram } from "@/components/workflow-diagram"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const

export function HeroSection() {
  return (
    <section className="relative w-full px-12 pt-6 pb-12 lg:px-24 lg:pt-10 lg:pb-16">
      <div className="flex flex-col items-center text-center">
        {/* Top headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease }}
          className="font-pixel text-3xl sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight text-foreground mb-2 select-none"
        >
          SEU BLOG PRODUZINDO
        </motion.h1>

        {/* Central Workflow Diagram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease }}
          className="w-full max-w-2xl my-4 lg:my-6"
        >
          <WorkflowDiagram />
        </motion.div>

        {/* Bottom headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.25, ease }}
          className="font-pixel text-3xl sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight text-foreground mb-4 select-none"
          aria-hidden="true"
        >
          SOZINHO. <span className="text-[#10b981]">24/7.</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45, ease }}
          className="text-xs lg:text-sm text-muted-foreground max-w-lg mb-6 leading-relaxed font-mono"
        >
          De blogs de nicho a portais de noticias — monte sua maquina de conteudo SEO em minutos. Sem saber programar. Sem contratar redator.
        </motion.p>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.52, ease }}
          className="flex items-center gap-6 mb-8"
        >
          {[
            { value: "2.000+", label: "artigos gerados" },
            { value: "50+", label: "blogs no ar" },
            { value: "92", label: "SEO score medio" },
          ].map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-2">
              {i > 0 && <span className="h-4 w-px bg-border" />}
              <span className="text-sm font-mono font-bold text-[#10b981]">{stat.value}</span>
              <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6, ease }}
          className="flex items-center gap-4"
        >
          <motion.a
            href="/signup"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group flex items-center gap-0 bg-foreground text-background text-sm font-mono tracking-wider uppercase cursor-pointer"
          >
            <span className="flex items-center justify-center w-10 h-10 bg-[#10b981]">
              <motion.span
                className="inline-flex"
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <ArrowRight size={16} strokeWidth={2} className="text-background" />
              </motion.span>
            </span>
            <span className="px-5 py-2.5">
              Comecar agora
            </span>
          </motion.a>

          <motion.a
            href="#pricing"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-0 border-2 border-foreground text-foreground text-sm font-mono tracking-wider uppercase cursor-pointer px-5 py-2 hover:bg-foreground hover:text-background transition-colors"
          >
            Ver planos
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}

"use client"

import { motion } from "framer-motion"
import { Settings, Key, Rocket } from "lucide-react"

const ease = [0.22, 1, 0.36, 1] as const

const STEPS = [
  {
    number: "01",
    icon: Settings,
    title: "Configure seu blog",
    description: "Defina o nicho, tom de voz e frequencia de publicacao. Leva menos de 2 minutos.",
  },
  {
    number: "02",
    icon: Key,
    title: "Conecte sua API Gemini",
    description: "Cole sua API key gratuita do Google. Voce controla os custos direto na sua conta Google.",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Publique no automatico",
    description: "Gere artigos otimizados para SEO instantaneamente. De 1 a 15 artigos por dia, 24/7.",
  },
]

function BlinkDot() {
  return <span className="inline-block h-2 w-2 bg-[#10b981] animate-blink" />
}

export function HowItWorksSection() {
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
          {"// SECTION: COMO_FUNCIONA"}
        </span>
        <div className="flex-1 border-t border-border" />
        <BlinkDot />
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          001
        </span>
      </motion.div>

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease }}
        className="flex flex-col gap-3 mb-12"
      >
        <h2 className="text-2xl lg:text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
          3 passos. <span className="text-[#10b981]">Zero complicacao.</span>
        </h2>
        <p className="text-xs lg:text-sm font-mono text-muted-foreground leading-relaxed max-w-md">
          Do zero ao blog publicando conteudo SEO no piloto automatico.
        </p>
      </motion.div>

      {/* Steps grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-foreground">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.12, duration: 0.6, ease }}
            className={`flex flex-col p-6 lg:p-8 ${
              i < STEPS.length - 1 ? "border-b-2 md:border-b-0 md:border-r-2 border-foreground" : ""
            }`}
          >
            {/* Step header */}
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 bg-[#10b981] flex items-center justify-center">
                <step.icon size={18} strokeWidth={2} className="text-background" />
              </div>
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
                PASSO {step.number}
              </span>
            </div>

            {/* Step content */}
            <h3 className="text-sm lg:text-base font-mono font-bold uppercase tracking-wide mb-3">
              {step.title}
            </h3>
            <p className="text-xs font-mono text-muted-foreground leading-relaxed">
              {step.description}
            </p>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div className="hidden md:flex items-center justify-end mt-auto pt-4">
                <div className="h-px w-8 bg-[#10b981]" />
                <div className="h-2 w-2 bg-[#10b981]" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  )
}

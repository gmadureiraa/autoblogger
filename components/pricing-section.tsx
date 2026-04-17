"use client"

import { useEffect, useState } from "react"
import { ArrowRight, Check, Minus } from "lucide-react"
import { motion } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const
const WHATSAPP_URL = "https://wa.me/5521987899372?text=Oi!%20Quero%20saber%20mais%20sobre%20o%20AutoBlogger"

/* -- scramble-in price effect -- */
function ScramblePrice({ target, prefix = "R$" }: { target: string; prefix?: string }) {
  const [display, setDisplay] = useState(target.replace(/[0-9]/g, "0"))

  useEffect(() => {
    let iterations = 0
    const maxIterations = 18
    const interval = setInterval(() => {
      if (iterations >= maxIterations) {
        setDisplay(target)
        clearInterval(interval)
        return
      }
      setDisplay(
        target
          .split("")
          .map((char, i) => {
            if (!/[0-9]/.test(char)) return char
            if (iterations > maxIterations - 5 && i < iterations - (maxIterations - 5)) return char
            return String(Math.floor(Math.random() * 10))
          })
          .join("")
      )
      iterations++
    }, 50)
    return () => clearInterval(interval)
  }, [target])

  return (
    <span className="font-mono font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}{display}
    </span>
  )
}

/* -- blinking cursor indicator -- */
function BlinkDot() {
  return <span className="inline-block h-2 w-2 bg-[#10b981] animate-blink" />
}

/* -- tier config -- */
interface Tier {
  id: string
  name: string
  price: string
  period: string
  tag: string | null
  description: string
  features: { text: string; included: boolean }[]
  cta: string
  highlighted: boolean
}

const TIERS: Tier[] = [
  {
    id: "starter",
    name: "STARTER",
    price: "997",
    period: "setup unico",
    tag: null,
    description: "Ideal para quem quer comecar. 1 blog, 1 artigo/dia, setup completo.",
    features: [
      { text: "1 artigo por dia", included: true },
      { text: "Setup completo em 48h", included: true },
      { text: "Design padrao responsivo", included: true },
      { text: "SEO on-page automatico", included: true },
      { text: "30 dias de suporte", included: true },
      { text: "Newsletter integrada", included: false },
      { text: "Design premium customizado", included: false },
    ],
    cta: "QUERO O STARTER",
    highlighted: false,
  },
  {
    id: "growth",
    name: "GROWTH",
    price: "2.497",
    period: "setup unico",
    tag: "MAIS POPULAR",
    description: "Para quem quer escalar. 5 artigos/dia, design premium, newsletter.",
    features: [
      { text: "5 artigos por dia", included: true },
      { text: "Setup completo em 48h", included: true },
      { text: "Design premium customizado", included: true },
      { text: "SEO on-page automatico", included: true },
      { text: "90 dias de suporte", included: true },
      { text: "Newsletter integrada", included: true },
      { text: "Analytics dashboard", included: true },
    ],
    cta: "QUERO O GROWTH",
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "ENTERPRISE",
    price: "CONSULTA",
    period: "",
    tag: null,
    description: "Multiplos blogs. Volume ilimitado. Solucao sob medida.",
    features: [
      { text: "Multiplos blogs simultaneos", included: true },
      { text: "Artigos ilimitados", included: true },
      { text: "Design exclusivo por blog", included: true },
      { text: "SEO avancado + link building", included: true },
      { text: "Suporte dedicado ilimitado", included: true },
      { text: "Newsletter + automacoes", included: true },
      { text: "Consultoria de conteudo", included: true },
    ],
    cta: "FALAR COM ESPECIALISTA",
    highlighted: false,
  },
]

/* -- single pricing card -- */
function PricingCard({ tier, index }: { tier: Tier; index: number }) {
  const isCustom = tier.price === "CONSULTA"

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.12, duration: 0.6, ease }}
      className={`flex flex-col h-full ${
        tier.highlighted
          ? "border-2 border-foreground bg-foreground text-background"
          : "border-2 border-foreground bg-background text-foreground"
      }`}
    >
      {/* Card header */}
      <div
        className={`flex items-center justify-between px-5 py-3 border-b-2 ${
          tier.highlighted ? "border-background/20" : "border-foreground"
        }`}
      >
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono">
          {tier.name}
        </span>
        <div className="flex items-center gap-2">
          {tier.tag && (
            <span className="bg-[#10b981] text-background text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 font-mono">
              {tier.tag}
            </span>
          )}
          <span className="text-[10px] tracking-[0.2em] font-mono opacity-50">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Price block */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-baseline gap-1">
          {isCustom ? (
            <span className="text-3xl lg:text-4xl font-mono font-bold tracking-tight">SOB CONSULTA</span>
          ) : (
            <span className="text-3xl lg:text-4xl">
              <ScramblePrice target={tier.price} />
            </span>
          )}
        </div>
        {tier.period && (
          <span
            className={`text-xs font-mono tracking-widest uppercase ${
              tier.highlighted ? "text-background/50" : "text-muted-foreground"
            }`}
          >
            {tier.period}
          </span>
        )}
        <p
          className={`text-xs font-mono mt-3 leading-relaxed ${
            tier.highlighted ? "text-background/60" : "text-muted-foreground"
          }`}
        >
          {tier.description}
        </p>
      </div>

      {/* Feature list */}
      <div
        className={`flex-1 px-5 py-4 border-t-2 ${
          tier.highlighted ? "border-background/20" : "border-foreground"
        }`}
      >
        <div className="flex flex-col gap-3">
          {tier.features.map((feature, fi) => (
            <motion.div
              key={feature.text}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12 + 0.3 + fi * 0.04, duration: 0.35, ease }}
              className="flex items-start gap-3"
            >
              {feature.included ? (
                <Check
                  size={12}
                  strokeWidth={2.5}
                  className="mt-0.5 shrink-0 text-[#10b981]"
                />
              ) : (
                <Minus
                  size={12}
                  strokeWidth={2}
                  className={`mt-0.5 shrink-0 ${
                    tier.highlighted ? "text-background/30" : "text-muted-foreground/40"
                  }`}
                />
              )}
              <span
                className={`text-xs font-mono leading-relaxed ${
                  feature.included
                    ? ""
                    : tier.highlighted
                    ? "text-background/30 line-through"
                    : "text-muted-foreground/40 line-through"
                }`}
              >
                {feature.text}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5 pt-3">
        <motion.a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className={`group w-full flex items-center justify-center gap-0 text-xs font-mono tracking-wider uppercase cursor-pointer ${
            tier.highlighted
              ? "bg-background text-foreground"
              : "bg-foreground text-background"
          }`}
        >
          <span className="flex items-center justify-center w-9 h-9 bg-[#10b981]">
            <ArrowRight size={14} strokeWidth={2} className="text-background" />
          </span>
          <span className="flex-1 py-2.5">{tier.cta}</span>
        </motion.a>
      </div>
    </motion.div>
  )
}

/* -- main pricing section -- */
export function PricingSection() {
  return (
    <section id="pricing" className="w-full px-6 py-20 lg:px-12">
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center gap-4 mb-8"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          {"// SECTION: PRICING"}
        </span>
        <div className="flex-1 border-t border-border" />
        <BlinkDot />
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          004
        </span>
      </motion.div>

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease }}
        className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12"
      >
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl lg:text-3xl font-mono font-bold tracking-tight uppercase text-foreground text-balance">
            Escolha seu plano
          </h2>
          <p className="text-xs lg:text-sm font-mono text-muted-foreground leading-relaxed max-w-md">
            Setup unico. Sem mensalidade. O unico custo recorrente e a API do Gemini (sua conta, seu controle).
          </p>
        </div>
      </motion.div>

      {/* Pricing grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {TIERS.map((tier, i) => (
          <PricingCard key={tier.id} tier={tier} index={i} />
        ))}
      </div>

      {/* Bottom note */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.5, ease }}
        className="flex items-center gap-3 mt-6"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          {"* Pagamento unico. Custo da API Gemini por conta do cliente (a partir de ~R$15/mes)."}
        </span>
        <div className="flex-1 border-t border-border" />
      </motion.div>
    </section>
  )
}

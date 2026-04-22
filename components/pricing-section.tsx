"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { ArrowRight, Check, Minus } from "lucide-react"
import { motion } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const

function ScramblePrice({ target, prefix = "$" }: { target: string; prefix?: string }) {
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

function BlinkDot() {
  return <span className="inline-block h-2 w-2 bg-[#10b981] animate-blink" />
}

interface Tier {
  id: "free" | "pro" | "agency"
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
    id: "free",
    name: "FREE",
    price: "0",
    period: "/mes",
    tag: null,
    description: "Pra testar. 5 artigos, geração por tópico, export Markdown.",
    features: [
      { text: "Ate 5 artigos", included: true },
      { text: "Gerar por topico", included: true },
      { text: "SEO on-page automatico", included: true },
      { text: "Export Markdown", included: true },
      { text: "Import URL / YouTube", included: false },
      { text: "Imagem de capa IA", included: false },
      { text: "Blog publico", included: false },
    ],
    cta: "COMECAR GRATIS",
    highlighted: false,
  },
  {
    id: "pro",
    name: "PRO",
    price: "19.99",
    period: "/mes",
    tag: "MAIS POPULAR",
    description: "Pra quem escala. 50 artigos, import YouTube/URL, imagens IA e blog publico.",
    features: [
      { text: "50 artigos por mes", included: true },
      { text: "Import URL + YouTube", included: true },
      { text: "Keyword research (Serper)", included: true },
      { text: "Imagem de capa IA (Imagen 4)", included: true },
      { text: "Blog publico em /blog/user", included: true },
      { text: "Agendamento diario", included: true },
      { text: "Suporte prioritario", included: true },
    ],
    cta: "ASSINAR PRO",
    highlighted: true,
  },
  {
    id: "agency",
    name: "AGENCY",
    price: "49.99",
    period: "/mes",
    tag: null,
    description: "Pra agencias. 200 artigos, multi-cliente, webhook WordPress/Wix.",
    features: [
      { text: "200 artigos por mes", included: true },
      { text: "Tudo do Pro", included: true },
      { text: "Webhook WordPress / Wix", included: true },
      { text: "JSON-LD Article + sitemap index", included: true },
      { text: "Multi-idioma", included: true },
      { text: "White-label do blog", included: true },
      { text: "Account manager", included: true },
    ],
    cta: "ASSINAR AGENCY",
    highlighted: false,
  },
]

function PricingCard({ tier, index, onClick }: { tier: Tier; index: number; onClick: () => void }) {
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
      <div
        className={`flex items-center justify-between px-5 py-3 border-b-2 ${
          tier.highlighted ? "border-background/20" : "border-foreground"
        }`}
      >
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono">{tier.name}</span>
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

      <div className="px-5 pt-6 pb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl lg:text-4xl">
            <ScramblePrice target={tier.price} />
          </span>
          <span
            className={`text-xs font-mono tracking-widest uppercase ${
              tier.highlighted ? "text-background/50" : "text-muted-foreground"
            }`}
          >
            {tier.period}
          </span>
        </div>
        <p
          className={`text-xs font-mono mt-3 leading-relaxed ${
            tier.highlighted ? "text-background/60" : "text-muted-foreground"
          }`}
        >
          {tier.description}
        </p>
      </div>

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
                <Check size={12} strokeWidth={2.5} className="mt-0.5 shrink-0 text-[#10b981]" />
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

      <div className="px-5 pb-5 pt-3">
        <motion.button
          onClick={onClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className={`group w-full flex items-center justify-center gap-0 text-xs font-mono tracking-wider uppercase cursor-pointer ${
            tier.highlighted ? "bg-background text-foreground" : "bg-foreground text-background"
          }`}
        >
          <span className="flex items-center justify-center w-9 h-9 bg-[#10b981]">
            <ArrowRight size={14} strokeWidth={2} className="text-background" />
          </span>
          <span className="flex-1 py-2.5">{tier.cta}</span>
        </motion.button>
      </div>
    </motion.div>
  )
}

export function PricingSection() {
  const router = useRouter()
  const { isSignedIn } = useUser()

  const handleClick = async (tier: Tier) => {
    if (tier.id === "free") {
      router.push(isSignedIn ? "/gerar" : "/sign-up")
      return
    }
    if (!isSignedIn) {
      router.push(`/sign-up?redirect_url=${encodeURIComponent(`/?upgrade=${tier.id}`)}`)
      return
    }
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: tier.id }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
        return
      }
      alert(data.error ?? "Checkout indisponivel. Tenta novamente em instantes.")
    } catch {
      alert("Erro de conexao.")
    }
  }

  return (
    <section id="pricing" className="w-full px-6 py-20 lg:px-12">
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
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">004</span>
      </motion.div>

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
            Assinatura mensal em USD. Troca de plano a qualquer momento. Cancelamento self-service.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {TIERS.map((tier, i) => (
          <PricingCard key={tier.id} tier={tier} index={i} onClick={() => handleClick(tier)} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.5, ease }}
        className="flex items-center gap-3 mt-6"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          {"* Cobrado em USD via Stripe. Custo da API Gemini incluso (fair use) ou use sua propria key."}
        </span>
        <div className="flex-1 border-t border-border" />
      </motion.div>
    </section>
  )
}

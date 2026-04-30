"use client"

import { motion } from "framer-motion"
import { Check, Clock } from "lucide-react"

const ease = [0.22, 1, 0.36, 1] as const

const integrations = [
  {
    name: "WordPress",
    status: "live" as const,
    description: "Publica direto via REST API + Application Password. Upload automatico da capa.",
  },
  {
    name: "Shopify",
    status: "soon" as const,
    description: "Sync de posts pro Shopify Online Store blog. Chegando.",
  },
  {
    name: "Webflow",
    status: "soon" as const,
    description: "CMS do Webflow via API. Chegando.",
  },
]

export function IntegrationsRow() {
  return (
    <section id="integrations" className="relative w-full px-6 py-24 lg:px-12 lg:py-28">
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center gap-4 mb-8 max-w-5xl mx-auto"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          {"// INTEGRATIONS"}
        </span>
        <div className="flex-1 border-t border-border" />
        <span className="inline-block h-2 w-2 bg-[#10b981] animate-blink" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease }}
        className="max-w-5xl mx-auto mb-12"
      >
        <h2 className="font-pixel text-3xl md:text-4xl lg:text-5xl tracking-tight uppercase leading-[1.05] max-w-3xl">
          PUBLIQUE ONDE
          <br />
          <span className="text-[#10b981]">SEU BLOG JA VIVE</span>.
        </h2>
        <p className="mt-4 text-xs md:text-sm font-mono text-muted-foreground max-w-xl">
          Gere uma vez, publique em qualquer lugar. Ou use o blog publico incluso
          em <code className="text-foreground bg-foreground/10 px-1.5 py-0.5">/blog/seu-handle</code>.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 border-2 border-foreground max-w-5xl mx-auto bg-background/40 backdrop-blur-sm">
        {integrations.map((int, i) => (
          <motion.div
            key={int.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.08, ease }}
            className={`group flex flex-col p-6 md:p-7 hover:bg-foreground/5 transition-colors ${
              i < integrations.length - 1
                ? "border-b-2 md:border-b-0 md:border-r-2 border-foreground"
                : ""
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-pixel text-xl uppercase tracking-tight">{int.name}</span>
              {int.status === "live" ? (
                <span className="flex items-center gap-1 text-[10px] font-mono tracking-widest uppercase text-[#10b981] border border-[#10b981] px-2 py-0.5">
                  <Check size={10} />
                  ao vivo
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-mono tracking-widest uppercase text-muted-foreground border border-muted-foreground/50 px-2 py-0.5">
                  <Clock size={10} />
                  em breve
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-muted-foreground leading-relaxed">
              {int.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

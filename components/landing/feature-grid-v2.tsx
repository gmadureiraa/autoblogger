"use client"

import { motion } from "framer-motion"
import { Link2, Youtube, Search, Image as ImageIcon, Globe, Layers } from "lucide-react"

const ease = [0.22, 1, 0.36, 1] as const

const FEATURES = [
  {
    icon: Link2,
    title: "URL → Artigo",
    description:
      "Cole qualquer link. A gente extrai, reescreve com voz propria e estrutura para SEO.",
  },
  {
    icon: Youtube,
    title: "YouTube → Artigo",
    description:
      "Transcricao + reescrita. Transforma video em post de 1000+ palavras com headings e bullets.",
  },
  {
    icon: Search,
    title: "Keyword Cluster",
    description:
      "Pesquisa de keywords com dados reais do Serper. Acha o topic cluster antes de escrever.",
  },
  {
    icon: ImageIcon,
    title: "Capa gerada por IA",
    description:
      "Imagem 16:9 feita pelo Imagen 4, sem texto e sem marca d'agua. Tudo pronto pra publicar.",
  },
  {
    icon: Globe,
    title: "Blog publico incluso",
    description:
      "Seu handle virou subdominio. /blog/seu-handle com SSG, JSON-LD, meta tags e ISR.",
  },
  {
    icon: Layers,
    title: "Batch + schedule",
    description:
      "Gere 3, 5 ou 10 artigos em fila. Agende publicacao. A maquina trabalha por voce.",
  },
]

export function FeatureGridV2() {
  return (
    <section id="features" className="w-full px-6 py-20 lg:px-12">
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center gap-4 mb-8 max-w-6xl mx-auto"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          {"// FEATURES"}
        </span>
        <div className="flex-1 border-t border-border" />
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          6 modulos
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease }}
        className="max-w-6xl mx-auto mb-10"
      >
        <h2 className="text-2xl lg:text-3xl font-mono font-bold uppercase tracking-tight mb-3">
          Tudo que voce precisa. <span className="text-[#10b981]">Nada que voce nao usa.</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-2 border-foreground max-w-6xl mx-auto">
        {FEATURES.map((f, i) => {
          const isRightEdge = (i + 1) % 3 === 0
          const isMdRightEdge = (i + 1) % 2 === 0
          const isLastRow = i >= FEATURES.length - 3
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.06, ease }}
              className={`flex flex-col p-6 md:p-7 min-h-[180px] ${
                !isRightEdge ? "lg:border-r-2 lg:border-foreground" : ""
              } ${!isMdRightEdge ? "md:max-lg:border-r-2 md:max-lg:border-foreground" : ""} ${
                !isLastRow ? "border-b-2 border-foreground" : ""
              }`}
            >
              <div className="w-10 h-10 bg-[#10b981] flex items-center justify-center mb-4">
                <f.icon size={18} strokeWidth={2} className="text-background" />
              </div>
              <h3 className="text-sm lg:text-base font-mono font-bold uppercase tracking-wide mb-2">
                {f.title}
              </h3>
              <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

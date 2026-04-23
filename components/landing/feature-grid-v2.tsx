"use client"

import { motion } from "framer-motion"
import { Link2, Youtube, Search, Image as ImageIcon, Globe, Layers, Sparkles, Skull } from "lucide-react"

const ease = [0.22, 1, 0.36, 1] as const

const FEATURES = [
  {
    icon: Link2,
    title: "URL → Artigo",
    description:
      "Cole qualquer link. A gente extrai, reescreve com voz propria e estrutura para SEO.",
    href: "/gerar",
  },
  {
    icon: Youtube,
    title: "YouTube → Artigo",
    description:
      "Transcricao + reescrita. Transforma video em post de 1000+ palavras com headings e bullets.",
    href: "/gerar",
  },
  {
    icon: Search,
    title: "Keyword Cluster",
    description:
      "Pesquisa de keywords com dados reais do Serper. Acha o topic cluster antes de escrever.",
    href: "/gerar",
  },
  {
    icon: ImageIcon,
    title: "Capa gerada por IA",
    description:
      "Imagem 16:9 feita pelo Imagen 4, sem texto e sem marca d'agua. Tudo pronto pra publicar.",
    href: "/gerar",
  },
  {
    icon: Sparkles,
    title: "Ensina AI",
    description:
      "Tutor IA em streaming. Pergunte sobre SEO, copy, WordPress, estrategia. Resposta em menos de 10s.",
    href: "/ensina-ai",
    badge: "NOVO",
  },
  {
    icon: Skull,
    title: "Destrua Minha Startup",
    description:
      "Autopsia preventiva. 5 dimensoes avaliadas, killers listados, saviors priorizados. Brutal e util.",
    href: "/destrua-startup",
    badge: "NOVO",
  },
  {
    icon: Globe,
    title: "Blog publico incluso",
    description:
      "Seu handle virou subdominio. /blog/seu-handle com SSG, JSON-LD, meta tags e ISR.",
    href: "#pricing",
  },
  {
    icon: Layers,
    title: "Batch + schedule",
    description:
      "Gere 3, 5 ou 10 artigos em fila. Agende publicacao. A maquina trabalha por voce.",
    href: "#pricing",
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
          8 modulos
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-2 border-foreground max-w-6xl mx-auto">
        {FEATURES.map((f, i) => {
          const lgPerRow = 4
          const mdPerRow = 2
          const isLgRightEdge = (i + 1) % lgPerRow === 0
          const isMdRightEdge = (i + 1) % mdPerRow === 0
          const lgTotalRows = Math.ceil(FEATURES.length / lgPerRow)
          const lgRow = Math.floor(i / lgPerRow)
          const isLgLastRow = lgRow === lgTotalRows - 1
          const mdTotalRows = Math.ceil(FEATURES.length / mdPerRow)
          const mdRow = Math.floor(i / mdPerRow)
          const isMdLastRow = mdRow === mdTotalRows - 1
          const isLast = i === FEATURES.length - 1
          return (
            <motion.a
              href={f.href}
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.05, ease }}
              className={`group relative flex flex-col p-6 md:p-7 min-h-[180px] hover:bg-foreground/5 transition-colors ${
                !isLgRightEdge ? "lg:border-r-2 lg:border-foreground" : ""
              } ${!isMdRightEdge ? "md:max-lg:border-r-2 md:max-lg:border-foreground" : ""} ${
                !isLgLastRow ? "lg:border-b-2 lg:border-foreground" : ""
              } ${!isMdLastRow ? "md:max-lg:border-b-2 md:max-lg:border-foreground" : ""} ${
                !isLast ? "max-md:border-b-2 max-md:border-foreground" : ""
              }`}
            >
              {f.badge && (
                <span className="absolute top-3 right-3 bg-[#10b981] text-background text-[9px] font-mono font-bold tracking-widest px-1.5 py-0.5">
                  {f.badge}
                </span>
              )}
              <div className="w-10 h-10 bg-[#10b981] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <f.icon size={18} strokeWidth={2} className="text-background" />
              </div>
              <h3 className="text-sm lg:text-base font-mono font-bold uppercase tracking-wide mb-2">
                {f.title}
              </h3>
              <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </motion.a>
          )
        })}
      </div>
    </section>
  )
}

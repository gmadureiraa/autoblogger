"use client"

import { motion } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const

const LOGOS = ["BERNSTEIN", "DIREKT", "AMORIM", "CORNERS", "LYRA LABS", "NORDICA"]

const QUOTES = [
  {
    quote:
      "Cortamos 4h de producao de conteudo por semana. A voz saiu natural ja de cara.",
    author: "Rafael K.",
    title: "Head de Growth · fintech",
  },
  {
    quote:
      "Liguei 3 blogs de nicho num fim de semana. O Gemini faz o pesado, eu so reviso.",
    author: "Julia M.",
    title: "Solopreneur · SEO",
  },
  {
    quote:
      "O publish direto pro WordPress resolve 80% do fluxo. Acabou 'copia pro admin'.",
    author: "Diego F.",
    title: "Agencia · 12 clientes",
  },
]

export function SocialProof() {
  return (
    <section className="w-full px-6 py-16 lg:px-12 border-y-2 border-foreground/10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease }}
        className="text-center mb-10"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          USADO POR EQUIPES QUE LIGAM PARA SEO
        </span>
      </motion.div>

      <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10 max-w-5xl mx-auto mb-16 opacity-60">
        {LOGOS.map((logo, i) => (
          <motion.span
            key={logo}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 0.8, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06, ease }}
            className="text-[11px] md:text-xs font-pixel tracking-widest uppercase text-muted-foreground"
          >
            {logo}
          </motion.span>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-foreground max-w-6xl mx-auto">
        {QUOTES.map((q, i) => (
          <motion.div
            key={q.author}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.1, ease }}
            className={`p-6 flex flex-col ${
              i < QUOTES.length - 1
                ? "border-b-2 md:border-b-0 md:border-r-2 border-foreground"
                : ""
            }`}
          >
            <p className="text-sm font-mono text-foreground leading-relaxed mb-4">
              &ldquo;{q.quote}&rdquo;
            </p>
            <div className="mt-auto">
              <div className="text-xs font-mono font-bold">{q.author}</div>
              <div className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                {q.title}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

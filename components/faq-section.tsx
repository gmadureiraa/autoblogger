"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const

const FAQ_ITEMS = [
  {
    q: "Preciso saber programar para usar?",
    a: "Nao. O AutoBlogger e 100% plug-and-play. Voce configura seu blog em 3 passos simples, cola sua API key do Gemini e comeca a gerar artigos imediatamente. Sem codigo, sem terminal, sem complicacao.",
  },
  {
    q: "Quanto custa a API do Gemini?",
    a: "A API do Gemini 2.0 Flash e extremamente barata. Para 1 artigo/dia, o custo fica em torno de $3/mes. Para 10 artigos/dia, cerca de $30/mes. Voce usa sua propria conta Google, sem intermediarios — transparencia total.",
  },
  {
    q: "Os artigos passam em detectores de IA?",
    a: "O Gemini 2.0 Flash gera conteudo de alta qualidade com tom natural. Nosso sistema usa prompts avancados que produzem textos com variacao de estrutura, tom e vocabulario. O resultado e conteudo que performa bem em SEO e leitura humana.",
  },
  {
    q: "Posso usar em qualquer nicho?",
    a: "Sim. O AutoBlogger funciona para qualquer nicho — tecnologia, saude, financas, viagem, culinaria, esportes, educacao, e-commerce, e mais. Voce define o tema e o tom, e a IA se adapta.",
  },
  {
    q: "Como funciona o SEO automatico?",
    a: "Cada artigo e gerado com titulo otimizado (ate 60 caracteres), meta description persuasiva, estrutura de headings H2 semantica, internal links sugeridos, e um SEO score. O sistema segue as melhores praticas de on-page SEO automaticamente.",
  },
  {
    q: "Posso gerar artigos em outros idiomas?",
    a: "O plano Enterprise suporta multi-idioma. Nos planos Starter e Growth, os artigos sao gerados em portugues. O Gemini suporta dezenas de idiomas, entao a expansao e simples para quem precisa.",
  },
  {
    q: "Meus dados ficam seguros?",
    a: "Seus artigos ficam salvos localmente no seu navegador (localStorage). Sua API key do Gemini e armazenada apenas no seu dispositivo — nunca enviamos ela para nossos servidores. Voce tem controle total.",
  },
  {
    q: "Qual a diferenca entre os planos?",
    a: "O Starter ($99) suporta ate 5 artigos/dia com design padrao e 30 dias de suporte. O Growth ($199) sobe para 15 artigos/dia, inclui design premium, newsletter, analytics e schema markup, com 90 dias de suporte. O Enterprise e sob medida para multiplos blogs, idiomas e volume ilimitado.",
  },
]

function FaqItem({ item, index }: { item: typeof FAQ_ITEMS[0]; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.4, ease }}
      className="border-b-2 border-foreground last:border-b-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left group"
      >
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-[#10b981] shrink-0">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-xs lg:text-sm font-mono font-bold uppercase tracking-wide text-foreground">
            {item.q}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`shrink-0 text-muted-foreground transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 pl-12 text-xs font-mono text-muted-foreground leading-relaxed">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function BlinkDot() {
  return <span className="inline-block h-2 w-2 bg-[#10b981] animate-blink" />
}

export function FaqSection() {
  return (
    <section id="faq" className="w-full px-6 py-20 lg:px-12">
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center gap-4 mb-8"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          {"// SECTION: FAQ"}
        </span>
        <div className="flex-1 border-t border-border" />
        <BlinkDot />
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          006
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
          Perguntas frequentes
        </h2>
        <p className="text-xs lg:text-sm font-mono text-muted-foreground leading-relaxed max-w-md">
          Tudo que voce precisa saber antes de comecar.
        </p>
      </motion.div>

      {/* FAQ list */}
      <div className="border-2 border-foreground max-w-3xl">
        {FAQ_ITEMS.map((item, i) => (
          <FaqItem key={i} item={item} index={i} />
        ))}
      </div>
    </section>
  )
}

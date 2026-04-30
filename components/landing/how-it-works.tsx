"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
import { Link2, Sparkles, Search, Send } from "lucide-react"

const ease = [0.22, 1, 0.36, 1] as const

const STEPS = [
  {
    n: "01",
    label: "INPUT",
    icon: Link2,
    title: "Cole o link",
    description: "URL de artigo, video do YouTube ou um topico. A maquina aceita tudo.",
  },
  {
    n: "02",
    label: "GERACAO IA",
    icon: Sparkles,
    title: "Gemini reescreve",
    description: "Extracao + reescrita com voz propria. Headings, bullets, tom configuravel.",
  },
  {
    n: "03",
    label: "SEO CHECK",
    icon: Search,
    title: "On-page automatico",
    description: "Title, meta description, slug, JSON-LD Article. Score em tempo real.",
  },
  {
    n: "04",
    label: "PUBLISH",
    icon: Send,
    title: "Publica direto",
    description: "WordPress via API ou blog publico em /blog/seu-handle. ISR + sitemap.",
  },
]

const MINI_PATTERNS = [
  "..::",
  ":==-",
  "+*o.",
  "010 ",
  "##::",
  "X+=.",
  "ok.",
  "...!",
  "#%@*",
  "..oo",
]

export function HowItWorks() {
  const reduce = useReducedMotion()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => setTick((t) => t + 1), 1400)
    return () => clearInterval(id)
  }, [reduce])

  return (
    <section id="how-it-works" className="relative w-full px-6 lg:px-12 py-24">
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center gap-4 mb-8 max-w-6xl mx-auto"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          {"// HOW IT WORKS"}
        </span>
        <div className="flex-1 border-t border-border" />
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          4 passos
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease }}
        className="max-w-6xl mx-auto mb-12"
      >
        <h2 className="font-pixel text-3xl md:text-4xl lg:text-5xl tracking-tight uppercase leading-[1.05] max-w-3xl">
          DO LINK AO POST PUBLICADO
          <br />
          <span className="text-[#10b981]">EM MINUTOS</span>.
        </h2>
        <p className="mt-4 text-xs md:text-sm font-mono text-muted-foreground max-w-xl">
          Pipeline curto, sem etapa manual no meio. Voce cola o link, ele gera, voce revisa
          e publica.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 max-w-6xl mx-auto border-2 border-foreground">
        {STEPS.map((s, i) => {
          const isLast = i === STEPS.length - 1
          const miniPattern = MINI_PATTERNS[(i + tick) % MINI_PATTERNS.length]
          return (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease }}
              className={[
                "group relative flex flex-col p-6 md:p-7 min-h-[260px] hover:bg-foreground/5 transition-colors overflow-hidden",
                // 1col mobile: borda inferior excepto ultimo
                !isLast ? "max-md:border-b-2 max-md:border-foreground" : "",
                // 2col tablet
                i < 2 ? "md:max-lg:border-b-2 md:max-lg:border-foreground" : "",
                i % 2 === 0 ? "md:max-lg:border-r-2 md:max-lg:border-foreground" : "",
                // 4col desktop
                !isLast ? "lg:border-r-2 lg:border-foreground" : "",
              ].join(" ")}
            >
              {/* Numero grande no topo — pulso verde no hover */}
              <div className="flex items-start justify-between mb-6">
                <motion.span
                  className="font-mono font-bold text-4xl md:text-5xl text-muted-foreground/30 leading-none tabular-nums group-hover:text-[#10b981] transition-colors"
                  animate={
                    reduce
                      ? undefined
                      : {
                          textShadow: [
                            "0 0 0px rgba(16,185,129,0)",
                            "0 0 0px rgba(16,185,129,0)",
                          ],
                        }
                  }
                  whileHover={
                    reduce
                      ? undefined
                      : {
                          textShadow: [
                            "0 0 0px rgba(16,185,129,0)",
                            "0 0 16px rgba(16,185,129,0.7)",
                            "0 0 4px rgba(16,185,129,0.4)",
                            "0 0 16px rgba(16,185,129,0.7)",
                          ],
                          transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
                        }
                  }
                >
                  {s.n}
                </motion.span>
                <div className="w-10 h-10 border-2 border-foreground flex items-center justify-center group-hover:bg-[#10b981] group-hover:border-[#10b981] transition-colors">
                  <s.icon size={16} strokeWidth={2} className="text-foreground group-hover:text-background transition-colors" />
                </div>
              </div>

              <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-[#10b981] mb-2">
                {s.label}
              </span>
              <h3 className="text-base md:text-lg font-mono font-bold uppercase tracking-tight mb-3 leading-tight">
                {s.title}
              </h3>
              <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                {s.description}
              </p>

              {/* Mini-ASCII drift no canto inferior direito */}
              <motion.span
                aria-hidden="true"
                className="absolute bottom-3 right-3 font-mono text-[10px] tracking-[0.18em] select-none pointer-events-none"
                style={{ color: "rgba(16,185,129,0.32)" }}
                initial={{ opacity: 0 }}
                animate={reduce ? { opacity: 0.3 } : { opacity: [0, 0.5, 0.5, 0] }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : {
                        duration: 2.6,
                        delay: i * 0.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        times: [0, 0.2, 0.8, 1],
                      }
                }
              >
                {miniPattern}
              </motion.span>

              {/* Connector arrow nos primeiros 3 (desktop apenas) */}
              {!isLast && (
                <span className="hidden lg:block absolute -right-[7px] top-1/2 -translate-y-1/2 h-3 w-3 border-2 border-foreground bg-background z-10" />
              )}
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

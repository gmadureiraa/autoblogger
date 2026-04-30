"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useRef, useState } from "react"

const ease = [0.22, 1, 0.36, 1] as const

const STATS = [
  { value: "10K+", label: "ARTIGOS GERADOS" },
  { value: "5MIN", label: "TEMPO MEDIO" },
  { value: "92", label: "SEO SCORE" },
  { value: "24/7", label: "AUTOPILOT" },
]

const FLICKER_CHARS = "0123456789#X+%@*"

interface FlickerNumberProps {
  finalValue: string
  delay?: number
}

function FlickerNumber({ finalValue, delay = 0 }: FlickerNumberProps) {
  const reduce = useReducedMotion()
  const [displayed, setDisplayed] = useState(finalValue)
  const [hasRun, setHasRun] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (reduce || hasRun) return

    const node = ref.current
    if (!node) return

    let intervalId: ReturnType<typeof setInterval> | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHasRun(true)
            observer.disconnect()

            // Substitui cada char por um aleatorio (preserva nao-digitos posicionalmente)
            const tickRandom = () => {
              const out = finalValue
                .split("")
                .map((c) => {
                  if (/[0-9]/.test(c)) {
                    return FLICKER_CHARS[Math.floor(Math.random() * FLICKER_CHARS.length)]
                  }
                  return c
                })
                .join("")
              setDisplayed(out)
            }

            timeoutId = setTimeout(() => {
              intervalId = setInterval(tickRandom, 55)
              timeoutId = setTimeout(() => {
                if (intervalId) clearInterval(intervalId)
                setDisplayed(finalValue)
              }, 600)
            }, delay)
          }
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
      if (intervalId) clearInterval(intervalId)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [finalValue, delay, hasRun, reduce])

  return (
    <span
      ref={ref}
      className="font-mono font-bold text-4xl md:text-5xl lg:text-6xl text-foreground tracking-tight leading-none"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {displayed}
    </span>
  )
}

export function StatsStrip() {
  return (
    <section className="relative w-full px-6 lg:px-12 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease }}
        className="max-w-6xl mx-auto"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 border-2 border-foreground bg-background/40 backdrop-blur-sm">
          {STATS.map((s, i) => {
            // 2-col mobile: borda direita em coluna 1 e 3; borda baixo em itens 1 e 2
            // 4-col desktop: borda direita exceto ultimo
            const isLast = i === STATS.length - 1
            const isFirstRow = i < 2 // mobile only
            const isOddCol = i % 2 === 0 // mobile col 1
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease }}
                className={[
                  "group relative flex flex-col items-start gap-2 p-6 md:p-8 transition-colors hover:bg-foreground/5",
                  // mobile (2 col)
                  isOddCol ? "max-md:border-r-2 max-md:border-foreground" : "",
                  isFirstRow ? "max-md:border-b-2 max-md:border-foreground" : "",
                  // desktop (4 col)
                  !isLast ? "md:border-r-2 md:border-foreground" : "",
                ].join(" ")}
              >
                <FlickerNumber finalValue={s.value} delay={i * 90} />
                <span className="text-[10px] md:text-[11px] font-mono tracking-[0.18em] uppercase text-muted-foreground">
                  {s.label}
                </span>

                <span className="absolute top-3 right-3 inline-block h-1.5 w-1.5 bg-[#10b981] opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all" />
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </section>
  )
}

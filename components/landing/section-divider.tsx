"use client"

import { motion } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const

interface Props {
  label: string
  index?: string
  variant?: "default" | "centered"
}

/**
 * Divisor entre secoes: 2 linhas finas com label mono no meio + dot blink.
 * Variant "centered" centraliza o label, "default" alinha esquerda.
 */
export function SectionDivider({ label, index, variant = "centered" }: Props) {
  if (variant === "default") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center gap-4 px-6 lg:px-12 max-w-7xl mx-auto"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          {label}
        </span>
        <div className="flex-1 border-t border-border" />
        <span className="inline-block h-1.5 w-1.5 bg-[#10b981] animate-blink" />
        {index && (
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
            {index}
          </span>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease }}
      className="flex items-center gap-4 px-6 lg:px-12 max-w-7xl mx-auto py-2"
    >
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="flex items-center gap-2.5">
        <span className="inline-block h-1.5 w-1.5 bg-[#10b981] animate-blink" />
        <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground font-mono">
          {label}
        </span>
        {index && (
          <>
            <span className="h-3 w-px bg-border" />
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60 font-mono">
              {index}
            </span>
          </>
        )}
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </motion.div>
  )
}

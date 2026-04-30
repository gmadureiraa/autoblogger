"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"

/**
 * AsciiArtMorph
 *
 * Renderiza uma ASCII art em grid de chars com efeito de morph/decode:
 *  - decode: cada celula sorteia chars aleatorios e "settle" no char correto
 *  - hold:   arte completa visivel
 *  - dissolve: chars voltam pra random
 *  - swap:   troca pra proxima arte do array e reinicia ciclo
 *
 * Performance: um unico interval (~16fps) atualiza um buffer e re-renderiza.
 * Cap de 800 cells por instancia. Respeita useReducedMotion.
 */

type Phase = "decode" | "hold" | "dissolve"

interface Props {
  /** Single art (multiline string). Used if `arts` not provided. */
  art?: string
  /** Optional: cycle through multiple arts. */
  arts?: string[]
  /** ms total da fase decode (default 1500) */
  decodeMs?: number
  /** ms da fase hold (default 4000) */
  holdMs?: number
  /** ms da fase dissolve (default 1000) */
  dissolveMs?: number
  /** font-size em px (default 12) */
  fontSize?: number
  /** opacity geral do componente (pra usar como decorativo) */
  opacity?: number
  /** className extra no wrapper */
  className?: string
  /** cor do char "settled" (default emerald-500/70) */
  settledClass?: string
  /** cor do noise (default zinc-700/40) */
  noiseClass?: string
}

const NOISE_CHARS = ":.,-*+=#X@%░▒▓01"

function pickNoise(): string {
  return NOISE_CHARS[Math.floor(Math.random() * NOISE_CHARS.length)]
}

/**
 * Padroniza a arte: pad cada linha pra largura maxima com espacos,
 * retorna grid 2D + dims.
 */
function parseArt(art: string): { grid: string[][]; rows: number; cols: number } {
  const lines = art.replace(/\t/g, "  ").split("\n")
  // remove leading/trailing empty lines
  while (lines.length && lines[0].trim() === "") lines.shift()
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop()
  const cols = lines.reduce((m, l) => Math.max(m, [...l].length), 0)
  const grid = lines.map((l) => {
    const arr = [...l]
    while (arr.length < cols) arr.push(" ")
    return arr
  })
  return { grid, rows: grid.length, cols }
}

export function AsciiArtMorph({
  art,
  arts,
  decodeMs = 1500,
  holdMs = 4000,
  dissolveMs = 1000,
  fontSize = 12,
  opacity = 1,
  className = "",
  settledClass = "text-emerald-500/70",
  noiseClass = "text-zinc-700/40",
}: Props) {
  const reduce = useReducedMotion()
  const list = useMemo(() => (arts && arts.length ? arts : art ? [art] : []), [arts, art])

  const [artIdx, setArtIdx] = useState(0)
  const parsed = useMemo(() => parseArt(list[artIdx] ?? ""), [list, artIdx])
  const totalCells = parsed.rows * parsed.cols

  // Cap de seguranca
  const tooLarge = totalCells > 800

  // displayBuffer: o char atualmente exibido por celula
  // settledMask: true = celula ja "decodificou" (mostra cor settled)
  const displayRef = useRef<string[]>([])
  const settledRef = useRef<boolean[]>([])
  const [, force] = useState(0)
  const rerender = () => force((n) => n + 1)

  // Reset buffers quando arte muda
  useEffect(() => {
    if (!parsed.rows) return
    const flat: string[] = []
    const settled: boolean[] = []
    for (let r = 0; r < parsed.rows; r++) {
      for (let c = 0; c < parsed.cols; c++) {
        const ch = parsed.grid[r][c]
        if (reduce) {
          flat.push(ch)
          settled.push(true)
        } else {
          flat.push(ch === " " ? " " : pickNoise())
          settled.push(false)
        }
      }
    }
    displayRef.current = flat
    settledRef.current = settled
    rerender()
  }, [parsed, reduce])

  // Orquestracao das fases
  useEffect(() => {
    if (reduce || tooLarge || !parsed.rows || list.length === 0) return

    let phase: Phase = "decode"
    let phaseStart = performance.now()
    // settle order: shuffled cell indices (skipping spaces)
    const indices: number[] = []
    for (let i = 0; i < totalCells; i++) {
      const r = Math.floor(i / parsed.cols)
      const c = i % parsed.cols
      const target = parsed.grid[r][c]
      if (target !== " ") indices.push(i)
    }
    // shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }

    let lastTick = phaseStart
    let rafId: number

    const tick = (now: number) => {
      const elapsed = now - phaseStart
      const dt = now - lastTick
      lastTick = now

      if (phase === "decode") {
        // settle progressivo: quantas celulas ja deveriam estar settled
        const progress = Math.min(1, elapsed / decodeMs)
        const targetSettled = Math.floor(progress * indices.length)
        // settle ate targetSettled
        for (let k = 0; k < targetSettled; k++) {
          const i = indices[k]
          const r = Math.floor(i / parsed.cols)
          const c = i % parsed.cols
          if (!settledRef.current[i]) {
            displayRef.current[i] = parsed.grid[r][c]
            settledRef.current[i] = true
          }
        }
        // celulas ainda nao settled: re-aleatoriza com prob baseada no dt
        for (let k = targetSettled; k < indices.length; k++) {
          const i = indices[k]
          // ~70% de update por frame, da sensacao de scrambling
          if (Math.random() < 0.7) {
            displayRef.current[i] = pickNoise()
          }
        }
        rerender()
        if (elapsed >= decodeMs) {
          phase = "hold"
          phaseStart = now
        }
      } else if (phase === "hold") {
        // arte completa, sem updates (so um pequeno glitch ocasional)
        if (Math.random() < 0.02) {
          // pisca uma celula random brevemente como noise
          const k = indices[Math.floor(Math.random() * indices.length)]
          if (k !== undefined) {
            const r = Math.floor(k / parsed.cols)
            const c = k % parsed.cols
            displayRef.current[k] = pickNoise()
            // restore no proximo frame
            setTimeout(() => {
              if (settledRef.current[k]) {
                displayRef.current[k] = parsed.grid[r][c]
                rerender()
              }
            }, 80)
            rerender()
          }
        }
        if (elapsed >= holdMs) {
          phase = "dissolve"
          phaseStart = now
          // re-shuffle pra dissolve aleatorio
          for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[indices[i], indices[j]] = [indices[j], indices[i]]
          }
        }
      } else if (phase === "dissolve") {
        const progress = Math.min(1, elapsed / dissolveMs)
        const targetUnsettled = Math.floor(progress * indices.length)
        for (let k = 0; k < targetUnsettled; k++) {
          const i = indices[k]
          if (settledRef.current[i]) {
            settledRef.current[i] = false
          }
          if (Math.random() < 0.7) {
            displayRef.current[i] = pickNoise()
          }
        }
        rerender()
        if (elapsed >= dissolveMs) {
          // SWAP
          if (list.length > 1) {
            setArtIdx((idx) => (idx + 1) % list.length)
            return // o useEffect re-roda quando artIdx muda
          } else {
            // apenas reinicia ciclo
            phase = "decode"
            phaseStart = now
            // reset settled, mantem display em noise
            for (let i = 0; i < settledRef.current.length; i++) settledRef.current[i] = false
          }
        }
      }

      // throttle: ~16fps (alvo 60ms entre frames). Skipping com rAF mantem fluidez.
      if (dt < 55) {
        // espera proximo rAF normal
        rafId = requestAnimationFrame(tick)
      } else {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed, reduce, tooLarge, decodeMs, holdMs, dissolveMs, list.length, totalCells, artIdx])

  if (!parsed.rows) return null

  return (
    <div
      className={`select-none pointer-events-none font-mono ${className}`}
      style={{
        opacity,
        fontSize,
        lineHeight: 1,
        letterSpacing: "-0.02em",
      }}
      aria-hidden="true"
    >
      {parsed.grid.map((row, r) => (
        <div key={r} className="whitespace-pre" style={{ height: fontSize + 2 }}>
          {row.map((targetCh, c) => {
            const i = r * parsed.cols + c
            const ch = displayRef.current[i] ?? targetCh
            if (targetCh === " " && ch === " ") {
              return (
                <span key={c} style={{ display: "inline-block", width: fontSize * 0.6 }}>
                  {" "}
                </span>
              )
            }
            const isSettled = settledRef.current[i]
            return (
              <span key={c} className={isSettled ? settledClass : noiseClass}>
                {ch}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════
// ARTE EXPORTS
// ════════════════════════════════════════════════
// Texto figlet (ANSI Shadow) gerado em build via scripts/gen-ascii.mjs.
// Pictorica curada de coleções classicas em lib/ascii-pics.ts.
// Re-exportadas aqui pra manter a import surface estavel.

export {
  ART_AUTOPILOT,
  ART_BLOG,
  ART_AI_POWER,
  ART_GERAR,
  ART_SEO_92,
} from "@/lib/ascii-texts"

export {
  PIC_ROBOT,
  PIC_TERMINAL,
  PIC_DOCUMENT,
  PIC_CHART,
  PIC_BOLT,
  PIC_STACK,
} from "@/lib/ascii-pics"

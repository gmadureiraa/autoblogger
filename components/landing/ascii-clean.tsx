"use client"

/**
 * AsciiClean — drift sutil de poucos chars (`· . : ¸`) propagando como
 * sine wave horizontal lenta. Hipnótico, baixa densidade, peso visual
 * mínimo. Pra usar como background atrás de CTAs.
 */

import { useEffect, useRef, useState } from "react"

const CHARS = [" ", " ", " ", "·", ".", " ", " ", ":", " ", " ", " ", "¸", " "] as const
const PHASE_SPEED = 0.012 // radianos por frame
const WAVELENGTH_X = 14 // chars por ciclo em x
const WAVELENGTH_Y = 6 // chars por ciclo em y

interface Props {
  width?: number
  height?: number
  fontSize?: number
  color?: string
  opacity?: number
  className?: string
  fps?: number
}

export function AsciiClean({
  width = 80,
  height = 10,
  fontSize = 9,
  color = "#10b981",
  opacity = 0.22,
  className,
  fps = 24,
}: Props) {
  const [frame, setFrame] = useState(0)
  const phaseRef = useRef(0)
  const reduceRef = useRef(false)

  useEffect(() => {
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduceRef.current) {
      setFrame(1)
      return
    }
    let raf = 0
    let last = performance.now()
    const targetMs = 1000 / fps
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = now - last
      if (dt < targetMs) return
      last = now
      phaseRef.current += PHASE_SPEED
      setFrame((f) => f + 1)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [fps])

  // build text — sample sin(2π(x/λx + y/λy) + phase)
  const phase = phaseRef.current
  const TWO_PI = Math.PI * 2
  const lines: string[] = []
  const charsLen = CHARS.length
  for (let y = 0; y < height; y++) {
    let row = ""
    for (let x = 0; x < width; x++) {
      const v =
        Math.sin(TWO_PI * (x / WAVELENGTH_X + y / WAVELENGTH_Y) + phase) * 0.5 +
        0.5
      const idx = Math.floor(v * (charsLen - 0.0001))
      row += CHARS[idx]
    }
    lines.push(row)
  }
  void frame

  return (
    <pre
      aria-hidden="true"
      data-frame={frame}
      className={className}
      style={{
        fontFamily: "ui-monospace, Menlo, monospace",
        fontSize: `${fontSize}px`,
        lineHeight: 1,
        letterSpacing: 0,
        color,
        opacity,
        margin: 0,
        padding: 0,
        background: "transparent",
        whiteSpace: "pre",
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      {lines.join("\n")}
    </pre>
  )
}

"use client"

/**
 * AsciiWave — malha de chars onde cada célula cicla por um array de chars
 * com offset definido por um campo random+blur (gera ondas suaves).
 *
 * Inspirado no padrão do gibbonjoyeux: setup() gera wave_map random,
 * faz N passes de box-blur (5-tap), remapeia pra [0..FRAMES] e cada cell
 * vira um FrameLoop pingpong com ease_quad_in_out. draw() re-renderiza
 * a string toda do <pre> a cada frame (single setState — barato).
 */

import { useEffect, useRef, useState } from "react"

const CHAR =
  "    `~._^|',-!:}+{=\\/*;[]7oc><i?)(rlt1jsIz3vCuJ%5aYn\"298e0f&L6OS$VGZxTyUhP4wkDFdgqbRpmX@QAEHK#BNWM"
const FRAMES = 300
const BLUR_STEPS = 40

/* ease_quad_in_out — t ∈ [0,1] → [0,1] */
function easeQuadInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

interface CellState {
  /** valor atual no espaço [0..FRAMES] (pra direção forward) ou seu reverso */
  t: number
  /** direção: 1 forward, -1 backward (pingpong) */
  dir: 1 | -1
}

interface Props {
  /** colunas */
  width?: number
  /** linhas */
  height?: number
  /** font-size em px (8-10 pra ficar Firecrawl-style) */
  fontSize?: number
  /** cor do texto */
  color?: string
  /** opacity geral */
  opacity?: number
  /** classes externas */
  className?: string
  /** fps alvo (default 30) */
  fps?: number
}

export function AsciiWave({
  width = 60,
  height = 12,
  fontSize = 8,
  color = "#10b981",
  opacity = 0.5,
  className,
  fps = 30,
}: Props) {
  const [frame, setFrame] = useState(0)
  /** offset por cell (mapa estático pós-blur, em [0..FRAMES]) */
  const offsetMap = useRef<number[]>([])
  /** estado de cada cell (valor t e direção do pingpong) */
  const cells = useRef<CellState[]>([])
  /** lista de chars como string fixa pra indexar rápido */
  const charsLen = useRef(CHAR.length)
  /** se reduced motion, congela tudo */
  const reduceRef = useRef(false)

  // setup
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    reduceRef.current = reduce

    const N = width * height
    // 1. random initial values em [0..FRAMES]
    let map = new Float32Array(N)
    for (let i = 0; i < N; i++) map[i] = Math.random() * FRAMES

    // 2. box blur 5-tap (self + 4 vizinhos), wrap-around nas bordas
    const tmp = new Float32Array(N)
    for (let step = 0; step < BLUR_STEPS; step++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = y * width + x
          const left = y * width + ((x - 1 + width) % width)
          const right = y * width + ((x + 1) % width)
          const up = ((y - 1 + height) % height) * width + x
          const down = ((y + 1) % height) * width + x
          tmp[i] = (map[i] + map[left] + map[right] + map[up] + map[down]) / 5
        }
      }
      // swap
      const tmp2 = map
      map = tmp
      // reusa o array antigo como buffer pro próximo step
      for (let i = 0; i < N; i++) tmp2[i] = 0
      // (não precisa zerar — só evita confusão)
      // na próxima iter, `tmp` vira o destino — então redefine ref
      // simpler: copiar tmp -> map e usar tmp como buffer continua ok
      // (alternância): aqui re-aliasing — pra evitar bug, copia explícito
      const newDest = new Float32Array(N)
      // mas pra performance, simplesmente continue alternando os 2 buffers
      // (lógica acima já alternou). Vamos ignorar newDest.
      // Mantém map = tmp (já feito). E o próximo loop usará map atual.
      // 'tmp' vai ser sobrescrito no próximo passe, não há problema.
      void tmp2
      void newDest
    }

    // 3. remap min/max pra [0..FRAMES]
    let min = Infinity
    let max = -Infinity
    for (let i = 0; i < N; i++) {
      if (map[i] < min) min = map[i]
      if (map[i] > max) max = map[i]
    }
    const range = max - min || 1
    const offsets = new Array<number>(N)
    for (let i = 0; i < N; i++) {
      offsets[i] = ((map[i] - min) / range) * FRAMES
    }
    offsetMap.current = offsets

    // 4. inicializa cell state — t começa no offset, dir random
    const states = new Array<CellState>(N)
    for (let i = 0; i < N; i++) {
      states[i] = { t: offsets[i], dir: Math.random() < 0.5 ? 1 : -1 }
    }
    cells.current = states
    charsLen.current = CHAR.length
  }, [width, height])

  // animation loop
  useEffect(() => {
    if (reduceRef.current) return
    let raf = 0
    let last = performance.now()
    const targetMs = 1000 / fps
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = now - last
      if (dt < targetMs) return
      last = now
      // avança cada cell
      const states = cells.current
      const N = states.length
      for (let i = 0; i < N; i++) {
        const s = states[i]
        s.t += s.dir * 1.0
        if (s.t >= FRAMES) {
          s.t = FRAMES
          s.dir = -1
        } else if (s.t <= 0) {
          s.t = 0
          s.dir = 1
        }
      }
      setFrame((f) => f + 1)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [fps])

  // build string
  const lines: string[] = []
  const states = cells.current
  const cl = charsLen.current
  if (states.length === width * height) {
    for (let y = 0; y < height; y++) {
      let row = ""
      for (let x = 0; x < width; x++) {
        const s = states[y * width + x]
        // ease_quad_in_out aplica curva — domínio normalizado
        const norm = s.t / FRAMES
        const eased = easeQuadInOut(norm)
        const idx = Math.round(eased * (cl - 1))
        row += CHAR[idx] || " "
      }
      lines.push(row)
    }
  } else {
    // fallback estático antes do setup completar
    for (let y = 0; y < height; y++) lines.push(" ".repeat(width))
  }

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

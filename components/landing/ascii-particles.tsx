"use client"

/**
 * AsciiParticles — partículas físicas em grid de chars.
 * Spawn no topo, gravidade puxa pra baixo, colisão com chão e entre
 * partículas (push lateral). Render via <pre> rebuild por frame.
 *
 * Inspirado no segundo demo do gibbonjoyeux: malha 2D mas as partículas
 * vivem em coords contínuas e só projetam pra grid no draw.
 */

import { useEffect, useRef, useState } from "react"

const GRAVITY = 0.08
const FRICTION_GROUND = 0.86
const FRICTION_AIR = 0.97
const PUSH_RATIO = 0.45
const COLLISION_RADIUS = 1.0
const PARTICLE_CHARS = ["o", ".", "*", "·", ":"] as const

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  char: string
  age: number
}

interface Props {
  width?: number
  height?: number
  fontSize?: number
  color?: string
  opacity?: number
  className?: string
  /** partículas spawnadas por segundo */
  spawnRate?: number
  maxParticles?: number
  fps?: number
}

export function AsciiParticles({
  width = 60,
  height = 14,
  fontSize = 9,
  color = "#10b981",
  opacity = 0.55,
  className,
  spawnRate = 4,
  maxParticles = 180,
  fps = 30,
}: Props) {
  const [frame, setFrame] = useState(0)
  const particles = useRef<Particle[]>([])
  const reduceRef = useRef(false)
  const spawnAccumRef = useRef(0)

  // setup — reduced motion fallback: drop 30 particles paradas no chão
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    reduceRef.current = reduce
    if (reduce) {
      const arr: Particle[] = []
      for (let i = 0; i < 30; i++) {
        arr.push({
          x: Math.random() * width,
          y: height - 1 - Math.random() * 0.5,
          vx: 0,
          vy: 0,
          char: PARTICLE_CHARS[Math.floor(Math.random() * PARTICLE_CHARS.length)],
          age: 0,
        })
      }
      particles.current = arr
      setFrame(1)
    }
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
      const dtSec = dt / 1000
      last = now

      // spawn
      spawnAccumRef.current += dtSec * spawnRate
      while (spawnAccumRef.current >= 1) {
        spawnAccumRef.current -= 1
        if (particles.current.length < maxParticles) {
          particles.current.push({
            x: Math.random() * width,
            y: 0,
            vx: (Math.random() - 0.5) * 0.4,
            vy: 0,
            char: PARTICLE_CHARS[Math.floor(Math.random() * PARTICLE_CHARS.length)],
            age: 0,
          })
        } else {
          // pop o mais velho — reciclar slot
          particles.current.shift()
        }
      }

      // physics
      const arr = particles.current
      const N = arr.length
      for (let i = 0; i < N; i++) {
        const p = arr[i]
        p.vy += GRAVITY
        p.vx *= FRICTION_AIR
        p.vy *= FRICTION_AIR
        p.x += p.vx
        p.y += p.vy
        p.age += 1

        // walls laterais (wrap)
        if (p.x < 0) p.x += width
        else if (p.x >= width) p.x -= width

        // ground
        if (p.y >= height - 1) {
          p.y = height - 1
          p.vy *= -0.2 // bounce baixo
          p.vx *= FRICTION_GROUND
          if (Math.abs(p.vy) < 0.05) p.vy = 0
        }
      }

      // collisions (pair-wise — N²/2, mas N max ~180)
      for (let i = 0; i < N; i++) {
        const a = arr[i]
        for (let j = i + 1; j < N; j++) {
          const b = arr[j]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const d2 = dx * dx + dy * dy
          if (d2 < COLLISION_RADIUS * COLLISION_RADIUS && d2 > 0.0001) {
            const d = Math.sqrt(d2)
            const overlap = COLLISION_RADIUS - d
            const nx = dx / d
            const ny = dy / d
            const push = overlap * PUSH_RATIO
            a.x -= nx * push
            a.y -= ny * push
            b.x += nx * push
            b.y += ny * push
          }
        }
      }

      setFrame((f) => f + 1)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [fps, spawnRate, maxParticles, width, height])

  // build string — projeta particles pro grid
  const grid: string[][] = []
  for (let y = 0; y < height; y++) {
    const row: string[] = []
    for (let x = 0; x < width; x++) row.push(" ")
    grid.push(row)
  }
  const arr = particles.current
  for (let i = 0; i < arr.length; i++) {
    const p = arr[i]
    const gx = Math.round(p.x)
    const gy = Math.round(p.y)
    if (gx >= 0 && gx < width && gy >= 0 && gy < height) {
      grid[gy][gx] = p.char
    }
  }
  const text = grid.map((r) => r.join("")).join("\n")

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
      {text}
    </pre>
  )
}

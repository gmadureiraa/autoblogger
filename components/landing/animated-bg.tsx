"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"

/**
 * Background estilo firecrawl.dev: grid sutil de células + ASCII/pixel patterns
 * drifting em posições aleatórias + corner labels mono + sparkles 4-pontas +
 * scanning beam vertical (sensação de "scraping").
 *
 * pointer-events-none, fixed inset-0, z-0. Respeita useReducedMotion.
 */

// ASCII patterns que parecem código sendo processado / scraping noise
const ASCII_PATTERNS = [
  ":..::.",
  ".::-=+",
  "X+=...",
  "..oo..",
  "#%%%%#",
  "+=-:.",
  "..*..*",
  "@@..@@",
  ":.:.-=",
  "...##.",
  "=+*o:.",
  ".-:::.",
  "o..o..",
  "::==--",
  "**:..*",
  "//\\\\//",
  "[]{}[]",
  "..+++.",
  "0101 1010 0011",
  "X+++===---...",
  "#%@*+=:.",
  "|//\\|/\\",
  "◇◆◇◆",
  "░▒▓█",
  "##::==--..",
  "+++X+++X",
  "101001 110010",
  "AI:READY",
  "SCRAPE OK",
  "PARSING...",
  "..ooOOoo..",
  "/-\\|/-\\|",
  "<<<<<<>>>>>>",
]

// Labels que rotam nos cantos / pontos da grid
const LABELS = [
  "[ 200 OK ]",
  "[ .JSON ]",
  "[ .MD ]",
  "[ SCRAPE ]",
  "[ AI ]",
  "[ READY ]",
  "[ FETCH ]",
  "[ PARSE ]",
  "[ INDEX ]",
  "[ DRAFT ]",
  "[ GENERATING ]",
  "[ SEO 92 ]",
  "[ CACHED ]",
  "[ INDEXED ]",
  "[ STATUS 200 ]",
  "[ AUTOPILOT ]",
]

// Spots fixos de ASCII (estabilizado no mount). Em mobile, reduzimos.
type Spot = {
  id: number
  top: string
  left: string
  delay: number
  duration: number
}

function makeSpots(count: number, seed: number): Spot[] {
  // Mulberry32 PRNG pra ter posições estáveis e diferentes por seed
  let s = seed >>> 0
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    top: `${Math.floor(rand() * 92) + 4}%`,
    left: `${Math.floor(rand() * 92) + 4}%`,
    delay: rand() * 6,
    duration: 4 + rand() * 4,
  }))
}

// Sparkle 4-pontas SVG inline
function Sparkle({ size = 12, color = "#10b981" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
    >
      <path
        d="M12 0 L13.5 10.5 L24 12 L13.5 13.5 L12 24 L10.5 13.5 L0 12 L10.5 10.5 Z"
        fill={color}
      />
    </svg>
  )
}

export function AnimatedBg() {
  const reduce = useReducedMotion()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)")
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  // Quantidades responsivas. Total animado: max ~30 simultâneos no desktop.
  const asciiCount = isMobile ? 12 : 20
  const sparkleCount = isMobile ? 4 : 10
  const labelCount = isMobile ? 4 : 6
  const beamCount = isMobile ? 1 : 2

  const asciiSpots = useMemo(() => makeSpots(asciiCount, 42), [asciiCount])
  const sparkleSpots = useMemo(() => makeSpots(sparkleCount, 137), [sparkleCount])
  const labelSpots = useMemo(() => makeSpots(labelCount, 91), [labelCount])

  // Cycling state pro conteudo do ASCII e dos labels
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => setTick((t) => t + 1), 1600)
    return () => clearInterval(id)
  }, [reduce])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden max-w-[100vw]"
    >
      {/* Grid de celulas — linhas cruzadas via background-image em dark e light */}
      <div
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border) / 0.35) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.35) 1px, transparent 1px)
          `,
          backgroundSize: isMobile ? "80px 80px" : "112px 112px",
        }}
      />

      {/* Pontinhos centrais em algumas celulas — usa segundo grid offset */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--muted-foreground) / 0.18) 1px, transparent 1.5px)",
          backgroundSize: isMobile ? "80px 80px" : "112px 112px",
          backgroundPosition: isMobile ? "40px 40px" : "56px 56px",
        }}
      />

      {/* Vignette sutil pra dar foco no centro */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent 55%, hsl(var(--background) / 0.55) 100%)",
        }}
      />

      {/* Scanning beams verticais — sensação de scraping. 1 mobile, 2 desktop. */}
      {!reduce &&
        Array.from({ length: beamCount }).map((_, i) => (
          <motion.div
            key={`beam-${i}`}
            className="absolute top-0 h-[35%] w-px"
            style={{
              left: i === 0 ? "32%" : "68%",
              background:
                "linear-gradient(180deg, transparent 0%, rgba(16,185,129,0.0) 10%, rgba(16,185,129,0.55) 50%, rgba(16,185,129,0.0) 90%, transparent 100%)",
              willChange: "transform, opacity",
              boxShadow: "0 0 12px rgba(16,185,129,0.35)",
            }}
            initial={{ y: "-40%", opacity: 0 }}
            animate={{
              y: ["-40%", "260%"],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: i === 0 ? 16 : 19,
              delay: i * 7,
              repeat: Infinity,
              ease: "linear",
              times: [0, 0.05, 0.95, 1],
            }}
          />
        ))}

      {/* ASCII drift spots */}
      {asciiSpots.map((spot, idx) => {
        const pattern = ASCII_PATTERNS[(idx + tick) % ASCII_PATTERNS.length]
        return (
          <motion.span
            key={spot.id}
            className="absolute font-mono select-none"
            style={{
              top: spot.top,
              left: spot.left,
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "rgba(16, 185, 129, 0.32)",
              willChange: reduce ? undefined : "opacity",
            }}
            initial={{ opacity: 0 }}
            animate={
              reduce
                ? { opacity: 0.25 }
                : {
                    opacity: [0, 0.35, 0.35, 0],
                  }
            }
            transition={
              reduce
                ? { duration: 0 }
                : {
                    duration: spot.duration,
                    delay: spot.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.2, 0.8, 1],
                  }
            }
          >
            {pattern}
          </motion.span>
        )
      })}

      {/* Corner labels mono — rotam entre LABELS, ciclo mais rapido */}
      {labelSpots.map((spot, idx) => {
        const text = LABELS[(idx + Math.floor(tick / 1)) % LABELS.length]
        return (
          <motion.span
            key={spot.id}
            className="absolute font-mono uppercase"
            style={{
              top: spot.top,
              left: spot.left,
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "hsl(var(--muted-foreground) / 0.55)",
            }}
            initial={{ opacity: 0 }}
            animate={
              reduce
                ? { opacity: 0.5 }
                : { opacity: [0, 0.55, 0.55, 0] }
            }
            transition={
              reduce
                ? { duration: 0 }
                : {
                    duration: 3 + (idx % 2),
                    delay: spot.delay * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.15, 0.85, 1],
                  }
            }
          >
            {text}
          </motion.span>
        )
      })}

      {/* Sparkles 4-pontas com twinkle */}
      {!reduce &&
        sparkleSpots.map((spot) => (
          <motion.span
            key={spot.id}
            className="absolute"
            style={{
              top: spot.top,
              left: spot.left,
              willChange: "opacity, transform",
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: [0, 0.7, 0],
              scale: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 3 + spot.duration * 0.4,
              delay: spot.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkle size={12} color="#10b981" />
          </motion.span>
        ))}

      {/* Reduced motion: sparkles estaticos com opacity baixa */}
      {reduce &&
        sparkleSpots.map((spot) => (
          <span
            key={spot.id}
            className="absolute"
            style={{ top: spot.top, left: spot.left, opacity: 0.4 }}
          >
            <Sparkle size={12} color="#10b981" />
          </span>
        ))}
    </div>
  )
}

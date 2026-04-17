"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

const STEPS = ["Defina o nicho", "Plugue API Gemini", "Configure frequencia", "Blog no ar em 48h"]

function PillLabel({
  label,
  x,
  y,
  delay,
  isLast,
}: {
  label: string
  x: number
  y: number
  delay: number
  isLast?: boolean
}) {
  return (
    <motion.g
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <rect
        x={x}
        y={y}
        width={150}
        height={36}
        rx={0}
        fill={isLast ? "#10b981" : "none"}
        stroke={isLast ? "#10b981" : "hsl(var(--foreground))"}
        strokeWidth={1.5}
      />
      <text
        x={x + 75}
        y={y + 22}
        textAnchor="middle"
        fill={isLast ? "hsl(var(--background))" : "hsl(var(--foreground))"}
        fontSize={10}
        fontFamily="var(--font-mono), monospace"
        fontWeight={600}
        letterSpacing="0.03em"
      >
        {label}
      </text>
    </motion.g>
  )
}

export function WorkflowDiagram() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-[80px] w-full" />
  }

  const startX = 40
  const gap = 180
  const y = 22

  return (
    <div className="relative w-full max-w-[800px] mx-auto">
      <svg
        viewBox="0 0 800 80"
        className="w-full h-auto"
        role="img"
        aria-label="Workflow: Defina o nicho, Plugue API Gemini, Configure frequencia, Blog no ar em 48h"
      >
        {/* Connection arrows between steps */}
        {STEPS.slice(0, -1).map((_, i) => {
          const fromX = startX + i * gap + 150
          const toX = startX + (i + 1) * gap
          const midY = y + 18
          return (
            <g key={`arrow-${i}`}>
              <motion.line
                x1={fromX}
                y1={midY}
                x2={toX}
                y2={midY}
                stroke="hsl(var(--border))"
                strokeWidth={1}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.15 }}
              />
              {/* Arrow head */}
              <motion.polygon
                points={`${toX - 5},${midY - 4} ${toX},${midY} ${toX - 5},${midY + 4}`}
                fill="hsl(var(--border))"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.15 }}
              />
              {/* Data packet */}
              <motion.circle
                r={3}
                fill="#10b981"
                initial={{ cx: fromX, cy: midY }}
                animate={{
                  cx: [fromX, toX],
                  cy: [midY, midY],
                }}
                transition={{
                  duration: 1,
                  delay: 0.8 + i * 0.5,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "linear",
                }}
              />
            </g>
          )
        })}

        {/* Step pills */}
        {STEPS.map((label, i) => (
          <PillLabel
            key={label}
            label={label}
            x={startX + i * gap}
            y={y}
            delay={0.1 + i * 0.12}
            isLast={i === STEPS.length - 1}
          />
        ))}
      </svg>
    </div>
  )
}

"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

export function DitherCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const w = 320
    const h = 240
    canvas.width = w
    canvas.height = h

    const isDark = resolvedTheme === "dark"
    const darkVal = isDark ? 230 : 10
    const lightVal = isDark ? 15 : 230

    const imageData = ctx.createImageData(w, h)
    const data = imageData.data

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4

        const cx = w / 2
        const cy = h / 2
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
        const maxDist = Math.sqrt(cx ** 2 + cy ** 2)
        const gradient = 1 - dist / maxDist

        const wave = Math.sin(x * 0.05) * Math.cos(y * 0.03) * 0.3

        const bayerMatrix = [
          [0, 2],
          [3, 1],
        ]
        const bayerValue = bayerMatrix[y % 2][x % 2] / 4

        const value = gradient + wave
        const dithered = value > bayerValue ? darkVal : lightVal

        // Add emerald tint
        const emeraldInfluence = gradient * 0.3
        data[idx] = Math.round(dithered * (1 - emeraldInfluence))
        data[idx + 1] = Math.round(dithered * (1 - emeraldInfluence * 0.3))
        data[idx + 2] = Math.round(dithered * (1 - emeraldInfluence * 0.6))
        data[idx + 3] = 255
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }, [resolvedTheme])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-2">
        <span className="text-[10px] tracking-widest text-muted-foreground uppercase">
          auto_alimentacao.continua
        </span>
        <span className="text-[10px] tracking-widest text-muted-foreground">1-10/DIA</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-background overflow-hidden gap-3">
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
          style={{ imageRendering: "pixelated" }}
          aria-label="Visualizacao de conteudo sendo gerado continuamente"
          role="img"
        />
        <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
          1 a 10 artigos/dia no piloto automatico
        </p>
      </div>
    </div>
  )
}

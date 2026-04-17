"use client"

import { useEffect, useState } from "react"

const FEATURES = [
  { name: "Meta Tags", status: "AUTO", detail: "Title + Description" },
  { name: "Headings H2", status: "AUTO", detail: "Estrutura semantica" },
  { name: "Schema.org", status: "AUTO", detail: "ArticlePosting" },
  { name: "Internal Links", status: "AUTO", detail: "Cross-linking" },
]

export function StatusCard() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-2">
        <span className="text-[10px] tracking-widest text-muted-foreground uppercase">
          design_premium.incluido
        </span>
        <span className="text-[10px] tracking-widest text-muted-foreground">
          {`BUILD:${String(tick).padStart(4, "0")}`}
        </span>
      </div>
      <div className="flex-1 flex flex-col p-4 gap-0">
        {/* Table header */}
        <div className="grid grid-cols-3 gap-2 border-b border-border pb-2 mb-2">
          <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">Feature</span>
          <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">Status</span>
          <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground text-right">Detalhe</span>
        </div>
        {FEATURES.map((feature) => (
          <div
            key={feature.name}
            className="grid grid-cols-3 gap-2 py-2 border-b border-border last:border-none"
          >
            <span className="text-xs font-mono text-foreground">{feature.name}</span>
            <div className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 bg-[#10b981]"
              />
              <span className="text-xs font-mono text-muted-foreground">{feature.status}</span>
            </div>
            <span className="text-xs font-mono text-foreground text-right">{feature.detail}</span>
          </div>
        ))}
        {/* Quality bar */}
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
              Design Quality
            </span>
            <span className="text-[9px] font-mono text-foreground">Premium</span>
          </div>
          <div className="h-2 w-full border border-foreground">
            <div className="h-full bg-[#10b981]" style={{ width: "95%" }} />
          </div>
        </div>
      </div>
    </div>
  )
}

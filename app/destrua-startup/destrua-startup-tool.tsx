"use client"

import { useState } from "react"
import { AlertTriangle, ArrowRight, Flame, Loader2, Skull, Zap, RefreshCw } from "lucide-react"

type Dimension = { name: string; score: number; verdict: string }
type Report = {
  name: string
  verdictOneLiner: string
  overallScore: number
  dimensions: Dimension[]
  killers: string[]
  saviors: string[]
  finalVerdict: string
  sarcasticTagline: string
}

const EXAMPLE = {
  name: "Juicero Reborn",
  pitch:
    "Plataforma de assinatura mensal que entrega saquinhos pre-prensados de suco organico e uma maquina conectada via wifi que espreme o saquinho. R$ 399/mes + R$ 1.800 pela maquina. Publico: executivos urbanos 30-45 anos que querem saude sem esforco.",
}

function scoreColor(score: number) {
  if (score >= 7) return "text-[#10b981]"
  if (score >= 4) return "text-[#f59e0b]"
  return "text-[#ef4444]"
}

function scoreBg(score: number) {
  if (score >= 7) return "bg-[#10b981]"
  if (score >= 4) return "bg-[#f59e0b]"
  return "bg-[#ef4444]"
}

function scoreLabel(score: number) {
  if (score >= 8) return "VIVA"
  if (score >= 6) return "SOBREVIVE"
  if (score >= 4) return "UTI"
  if (score >= 2) return "TERMINAL"
  return "MORTA"
}

export function DestruaStartupTool() {
  const [name, setName] = useState("")
  const [pitch, setPitch] = useState("")
  const [url, setUrl] = useState("")
  const [targetMarket, setTargetMarket] = useState("")
  const [businessModel, setBusinessModel] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<Report | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError(null)
    setReport(null)

    if (!name.trim() || pitch.trim().length < 30) {
      setError("Preenche o nome e um pitch com pelo menos 30 caracteres.")
      return
    }

    setLoading(true)
    try {
      const resp = await fetch("/api/destrua-startup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pitch, url, targetMarket, businessModel }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`)
      setReport(data as Report)
      // Scroll leve ate o relatorio
      requestAnimationFrame(() => {
        document.getElementById("autopsy-report")?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar autopsia.")
    } finally {
      setLoading(false)
    }
  }

  function loadExample() {
    setName(EXAMPLE.name)
    setPitch(EXAMPLE.pitch)
    setUrl("")
    setTargetMarket("Executivos urbanos 30-45 anos")
    setBusinessModel("Assinatura mensal R$ 399 + hardware")
  }

  function reset() {
    setReport(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      {/* FORM */}
      <form
        onSubmit={submit}
        className="border-2 border-foreground bg-background p-5 lg:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#ef4444] flex items-center justify-center">
              <Skull size={14} strokeWidth={2} className="text-background" />
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              Ficha da Vitima
            </span>
          </div>
          <button
            type="button"
            onClick={loadExample}
            className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            Carregar exemplo
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-mono uppercase tracking-widest mb-1 text-muted-foreground">
              Nome da startup *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              placeholder="Ex: Juicero Reborn"
              maxLength={120}
              className="w-full bg-transparent border-2 border-foreground px-3 py-2.5 text-sm font-mono focus:outline-none focus:bg-foreground/5 disabled:opacity-50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-mono uppercase tracking-widest mb-1 text-muted-foreground">
              Pitch / o que faz * <span className="text-muted-foreground">(min 30 chars)</span>
            </label>
            <textarea
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              disabled={loading}
              rows={4}
              maxLength={1200}
              placeholder="Ex: Plataforma SaaS para X que resolve Y cobrando Z. Publico e bla bla."
              className="w-full bg-transparent border-2 border-foreground px-3 py-2.5 text-sm font-mono leading-relaxed focus:outline-none focus:bg-foreground/5 disabled:opacity-50 resize-none"
            />
            <div className="text-[10px] font-mono text-muted-foreground mt-1 text-right">
              {pitch.length}/1200
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest mb-1 text-muted-foreground">
              URL (opcional)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              placeholder="https://..."
              className="w-full bg-transparent border-2 border-foreground px-3 py-2.5 text-sm font-mono focus:outline-none focus:bg-foreground/5 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest mb-1 text-muted-foreground">
              Publico-alvo (opcional)
            </label>
            <input
              type="text"
              value={targetMarket}
              onChange={(e) => setTargetMarket(e.target.value)}
              disabled={loading}
              placeholder="Ex: PMEs 10-50 funcionarios"
              className="w-full bg-transparent border-2 border-foreground px-3 py-2.5 text-sm font-mono focus:outline-none focus:bg-foreground/5 disabled:opacity-50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-mono uppercase tracking-widest mb-1 text-muted-foreground">
              Modelo de negocio (opcional)
            </label>
            <input
              type="text"
              value={businessModel}
              onChange={(e) => setBusinessModel(e.target.value)}
              disabled={loading}
              placeholder="Ex: SaaS R$ 99/mes, freemium com 100 trials gratis"
              className="w-full bg-transparent border-2 border-foreground px-3 py-2.5 text-sm font-mono focus:outline-none focus:bg-foreground/5 disabled:opacity-50"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 border-2 border-destructive bg-destructive/10 px-3 py-2 text-xs font-mono text-destructive">
            {error}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="group flex items-center gap-0 bg-foreground text-background text-sm font-mono tracking-wider uppercase cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center w-11 h-11 bg-[#ef4444]">
              {loading ? (
                <Loader2 size={16} className="text-background animate-spin" />
              ) : (
                <Flame
                  size={16}
                  strokeWidth={2}
                  className="text-background group-hover:scale-110 transition-transform"
                />
              )}
            </span>
            <span className="px-5 py-[13px]">
              {loading ? "Fazendo autopsia..." : "Destrua Minha Startup"}
            </span>
          </button>
          {report && (
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw size={12} /> Nova analise
            </button>
          )}
        </div>
      </form>

      {/* LOADING SKELETON */}
      {loading && (
        <div className="border-2 border-foreground p-6 animate-pulse">
          <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <Loader2 size={14} className="animate-spin" />
            Coveiro escrevendo o laudo. Aguarda 8-15s...
          </div>
        </div>
      )}

      {/* REPORT */}
      {report && <AutopsyReport report={report} />}
    </div>
  )
}

function AutopsyReport({ report }: { report: Report }) {
  const overall = Math.max(0, Math.min(10, report.overallScore))
  return (
    <div id="autopsy-report" className="space-y-5">
      {/* HEADER TOMBSTONE */}
      <div className="border-2 border-foreground bg-foreground text-background px-5 py-5 lg:px-8 lg:py-7">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-[#ef4444] mb-3">
          <Skull size={12} />
          Laudo de autopsia preventiva
        </div>
        <h2 className="font-pixel text-2xl sm:text-3xl lg:text-4xl leading-[1] mb-3 break-words">
          {report.name}
        </h2>
        <p className="text-sm font-mono leading-relaxed opacity-90 mb-4">
          {report.verdictOneLiner}
        </p>

        <div className="flex flex-wrap items-end gap-6 pt-4 border-t border-background/20">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest opacity-70 mb-1">
              Nota final
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`font-pixel text-5xl lg:text-6xl ${scoreColor(overall)}`}>
                {overall.toFixed(1)}
              </span>
              <span className="text-sm font-mono opacity-80">/ 10</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest opacity-70 mb-1">
              Prognostico
            </div>
            <div
              className={`inline-flex items-center px-3 py-1.5 font-mono text-sm font-bold uppercase tracking-widest ${scoreBg(overall)} text-background`}
            >
              {scoreLabel(overall)}
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="text-[10px] font-mono uppercase tracking-widest opacity-70 mb-1">
              Epitafio
            </div>
            <div className="italic text-sm font-mono opacity-90">
              {report.sarcasticTagline ? `"${report.sarcasticTagline}"` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* DIMENSOES */}
      <div className="border-2 border-foreground">
        <div className="flex items-center gap-2 px-5 py-3 border-b-2 border-foreground bg-foreground/5">
          <Zap size={14} strokeWidth={2} />
          <span className="text-xs font-mono font-bold uppercase tracking-wider">
            5 dimensoes avaliadas
          </span>
        </div>
        <div className="grid md:grid-cols-2">
          {report.dimensions.map((d, i) => (
            <div
              key={i}
              className={`p-5 ${i < report.dimensions.length - 1 ? "border-b-2 border-foreground" : ""} ${
                i % 2 === 0 && i < report.dimensions.length - 1
                  ? "md:border-r-2 md:border-foreground"
                  : ""
              } md:max-h-none`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
                  {d.name}
                </span>
                <span
                  className={`font-pixel text-2xl ${scoreColor(d.score)}`}
                  aria-label={`Nota ${d.score}`}
                >
                  {d.score}
                </span>
              </div>
              <div className="w-full h-1.5 bg-muted mb-3">
                <div
                  className={`h-full ${scoreBg(d.score)}`}
                  style={{ width: `${(Math.max(0, Math.min(10, d.score)) / 10) * 100}%` }}
                />
              </div>
              <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                {d.verdict}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* KILLERS + SAVIORS */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="border-2 border-foreground">
          <div className="flex items-center gap-2 px-5 py-3 border-b-2 border-foreground bg-[#ef4444]/10">
            <AlertTriangle size={14} strokeWidth={2} className="text-[#ef4444]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              Killers
            </span>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground">
              {report.killers.length}
            </span>
          </div>
          <ul className="p-5 space-y-3">
            {report.killers.map((k, i) => (
              <li key={i} className="flex gap-3 text-xs font-mono leading-relaxed">
                <span className="text-[#ef4444] font-bold shrink-0 w-5">{String(i + 1).padStart(2, "0")}</span>
                <span>{k}</span>
              </li>
            ))}
            {report.killers.length === 0 && (
              <li className="text-xs font-mono text-muted-foreground">
                Nenhum killer detectado. Ou voce tem diamante, ou o coveiro estava distraido.
              </li>
            )}
          </ul>
        </div>

        <div className="border-2 border-foreground">
          <div className="flex items-center gap-2 px-5 py-3 border-b-2 border-foreground bg-[#10b981]/10">
            <Zap size={14} strokeWidth={2} className="text-[#10b981]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              Saviors
            </span>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground">
              {report.saviors.length}
            </span>
          </div>
          <ul className="p-5 space-y-3">
            {report.saviors.map((s, i) => (
              <li key={i} className="flex gap-3 text-xs font-mono leading-relaxed">
                <span className="text-[#10b981] font-bold shrink-0 w-5">
                  <ArrowRight size={14} />
                </span>
                <span>{s}</span>
              </li>
            ))}
            {report.saviors.length === 0 && (
              <li className="text-xs font-mono text-muted-foreground">
                Nao ha o que salvar.
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* VEREDICTO FINAL */}
      <div className="border-2 border-foreground p-5 lg:p-6 bg-foreground/5">
        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">
          // Veredicto final
        </div>
        <p className="text-sm font-mono leading-relaxed">{report.finalVerdict}</p>
      </div>
    </div>
  )
}

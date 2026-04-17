"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ArrowLeft, Check, Key, Settings, Zap, Rocket, ExternalLink } from "lucide-react"

const ease = [0.22, 1, 0.36, 1] as const

const FREQUENCIES = [
  { value: 1, label: "1/dia", description: "Blog pessoal" },
  { value: 3, label: "3/dia", description: "Blog de nicho" },
  { value: 5, label: "5/dia", description: "Portal medio" },
  { value: 10, label: "10/dia", description: "Portal grande" },
  { value: 15, label: "15/dia", description: "Alta escala" },
]

const TONES = [
  { id: "informativo", label: "Informativo" },
  { id: "opinativo", label: "Opinativo" },
  { id: "educacional", label: "Educacional" },
  { id: "analitico", label: "Analitico" },
]

interface Config {
  blogName: string
  niche: string
  tone: string
  apiKey: string
  frequency: number
}

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState<Config>({
    blogName: "",
    niche: "",
    tone: "informativo",
    apiKey: "",
    frequency: 3,
  })

  const canProceed = () => {
    switch (step) {
      case 1: return config.blogName.trim() !== "" && config.niche.trim() !== ""
      case 2: return config.apiKey.trim() !== ""
      case 3: return true
      default: return false
    }
  }

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1)
    }
    if (step === 3) {
      // Save to localStorage
      localStorage.setItem("autoblogger_config", JSON.stringify(config))
      setStep(4)
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const STEPS_META = [
    { icon: Settings, label: "SEU BLOG" },
    { icon: Key, label: "API KEY" },
    { icon: Zap, label: "FREQUENCIA" },
    { icon: Rocket, label: "PRONTO!" },
  ]

  return (
    <div className="min-h-screen dot-grid-bg">
      {/* Navbar mini */}
      <div className="w-full px-4 pt-4 lg:px-6 lg:pt-6">
        <nav className="w-full border border-foreground/20 bg-background/80 backdrop-blur-sm px-6 py-3 lg:px-8">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={14} />
              <div className="w-6 h-6 bg-[#10b981] flex items-center justify-center">
                <span className="text-background font-mono font-bold text-xs">A</span>
              </div>
              <span className="text-xs font-mono tracking-[0.15em] uppercase font-bold">
                AutoBlogger
              </span>
            </a>
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
              Setup
            </span>
          </div>
        </nav>
      </div>

      <main className="w-full px-6 py-12 lg:px-12 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
              {"// AUTOBLOGGER: SETUP"}
            </span>
            <div className="flex-1 border-t border-border" />
            <span className="inline-block h-2 w-2 bg-[#10b981] animate-blink" />
          </div>

          <h1 className="font-pixel text-2xl sm:text-4xl tracking-tight text-foreground mb-3">
            CONFIGURE SEU BLOG
          </h1>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10 border-2 border-foreground">
          {STEPS_META.map((s, i) => (
            <div
              key={s.label}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-mono tracking-widest uppercase transition-colors ${
                i + 1 === step
                  ? "bg-foreground text-background"
                  : i + 1 < step
                  ? "bg-[#10b981] text-background"
                  : "text-muted-foreground"
              } ${i < STEPS_META.length - 1 ? "border-r-2 border-foreground" : ""}`}
            >
              {i + 1 < step ? <Check size={10} /> : <s.icon size={10} />}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{String(i + 1).padStart(2, "0")}</span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease }}
              className="border-2 border-foreground"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground text-background">
                <span className="text-[10px] tracking-[0.2em] uppercase font-mono">
                  PASSO 01 — SEU BLOG
                </span>
              </div>
              <div className="p-5 flex flex-col gap-5">
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                    NOME DO BLOG
                  </label>
                  <input
                    type="text"
                    value={config.blogName}
                    onChange={(e) => setConfig({ ...config, blogName: e.target.value })}
                    placeholder="Ex: Tech Insider Brasil"
                    className="w-full bg-transparent border-2 border-foreground px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#10b981] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                    NICHO / TOPICO PRINCIPAL
                  </label>
                  <input
                    type="text"
                    value={config.niche}
                    onChange={(e) => setConfig({ ...config, niche: e.target.value })}
                    placeholder="Ex: Tecnologia, IA e startups"
                    className="w-full bg-transparent border-2 border-foreground px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#10b981] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                    TOM PREFERIDO
                  </label>
                  <div className="flex gap-0">
                    {TONES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setConfig({ ...config, tone: t.id })}
                        className={`px-4 py-2 text-xs font-mono tracking-widest uppercase border-2 border-foreground -ml-[2px] first:ml-0 transition-colors ${
                          config.tone === t.id
                            ? "bg-[#10b981] text-background border-[#10b981]"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease }}
              className="border-2 border-foreground"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground text-background">
                <span className="text-[10px] tracking-[0.2em] uppercase font-mono">
                  PASSO 02 — API KEY
                </span>
              </div>
              <div className="p-5 flex flex-col gap-5">
                <div className="border-2 border-[#10b981]/30 bg-[#10b981]/5 px-4 py-3">
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                    O AutoBlogger usa a API do Google Gemini para gerar artigos. Voce precisa de uma API key gratuita.
                  </p>
                  <a
                    href="https://ai.google.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs font-mono text-[#10b981] hover:underline"
                  >
                    <ExternalLink size={10} />
                    Obter API key gratuita em ai.google.dev
                  </a>
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                    SUA API KEY DO GEMINI
                  </label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="AIza..."
                    className="w-full bg-transparent border-2 border-foreground px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#10b981] transition-colors"
                  />
                  <p className="text-[10px] font-mono text-muted-foreground mt-2">
                    Sua key e armazenada apenas no seu navegador. Nunca enviamos para nossos servidores.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease }}
              className="border-2 border-foreground"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground text-background">
                <span className="text-[10px] tracking-[0.2em] uppercase font-mono">
                  PASSO 03 — FREQUENCIA
                </span>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-1 block">
                  QUANTOS ARTIGOS POR DIA?
                </label>
                <div className="flex flex-col gap-0">
                  {FREQUENCIES.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setConfig({ ...config, frequency: f.value })}
                      className={`flex items-center justify-between px-4 py-3 border-2 border-foreground -mt-[2px] first:mt-0 text-left transition-colors ${
                        config.frequency === f.value
                          ? "bg-[#10b981] text-background border-[#10b981]"
                          : "text-foreground hover:bg-foreground/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-bold">{f.label}</span>
                        <span className={`text-xs font-mono ${
                          config.frequency === f.value ? "text-background/70" : "text-muted-foreground"
                        }`}>
                          {f.description}
                        </span>
                      </div>
                      {config.frequency === f.value && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease }}
              className="border-2 border-[#10b981]"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b-2 border-[#10b981] bg-[#10b981] text-background">
                <span className="text-[10px] tracking-[0.2em] uppercase font-mono">
                  SETUP COMPLETO
                </span>
                <Check size={14} />
              </div>
              <div className="p-6 flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 bg-[#10b981] flex items-center justify-center">
                  <Rocket size={28} className="text-background" />
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-mono font-bold tracking-tight uppercase mb-2">
                    Seu blog esta pronto!
                  </h2>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed max-w-sm">
                    <strong className="text-foreground">{config.blogName}</strong> configurado para gerar{" "}
                    <strong className="text-[#10b981]">{config.frequency} artigos/dia</strong> sobre{" "}
                    <strong className="text-foreground">{config.niche}</strong>.
                  </p>
                </div>

                {/* Config summary */}
                <div className="w-full border-2 border-foreground text-left">
                  {[
                    { label: "Blog", value: config.blogName },
                    { label: "Nicho", value: config.niche },
                    { label: "Tom", value: config.tone },
                    { label: "Frequencia", value: `${config.frequency} artigos/dia` },
                    { label: "API Key", value: "***" + config.apiKey.slice(-4) },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-2 border-b border-foreground/20 last:border-b-0">
                      <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">{row.label}</span>
                      <span className="text-xs font-mono font-bold">{row.value}</span>
                    </div>
                  ))}
                </div>

                <motion.a
                  href="/gerar"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="group flex items-center gap-0 bg-foreground text-background text-sm font-mono tracking-wider uppercase cursor-pointer"
                >
                  <span className="flex items-center justify-center w-10 h-10 bg-[#10b981]">
                    <ArrowRight size={16} strokeWidth={2} className="text-background" />
                  </span>
                  <span className="px-5 py-2.5">Gerar meu primeiro artigo</span>
                </motion.a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        {step < 4 && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className={`flex items-center gap-2 text-xs font-mono tracking-widest uppercase transition-colors ${
                step === 1 ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowLeft size={12} />
              Voltar
            </button>
            <motion.button
              onClick={handleNext}
              disabled={!canProceed()}
              whileHover={canProceed() ? { scale: 1.02 } : {}}
              whileTap={canProceed() ? { scale: 0.97 } : {}}
              className={`flex items-center gap-0 text-xs font-mono tracking-wider uppercase ${
                canProceed()
                  ? "bg-foreground text-background cursor-pointer"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <span className="px-4 py-2.5">Proximo</span>
              <span className="flex items-center justify-center w-9 h-9 bg-[#10b981]">
                <ArrowRight size={14} strokeWidth={2} className="text-background" />
              </span>
            </motion.button>
          </div>
        )}
      </main>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
  Globe,
  Mic,
  Tag,
  Link2,
  Youtube,
  ExternalLink,
  AlertCircle,
} from "lucide-react"
import { useAuth, useUser } from "@clerk/nextjs"

const ease = [0.22, 1, 0.36, 1] as const

const NICHES = [
  "Cripto & Web3",
  "Marketing Digital",
  "Finanças pessoais",
  "Saúde & bem-estar",
  "Fitness",
  "Tecnologia",
  "Programação",
  "IA & automação",
  "Gestão & produtividade",
  "Ecommerce",
  "Empreendedorismo",
  "Viagens",
  "Moda",
  "Beleza",
  "Gastronomia",
  "Educação",
]

const TONES = [
  { id: "casual", label: "Casual", description: "Informal, próximo, como conversa de bar." },
  { id: "educacional", label: "Educacional", description: "Didático, passo a passo, com exemplos." },
  { id: "profissional", label: "Profissional", description: "Direto, analítico, foco em dados." },
  { id: "provocativo", label: "Provocativo", description: "Opinativo, contrarian, hooks fortes." },
]

const HANDLE_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || ""

type SourceMode = "url" | "youtube"

export function OnboardingFlow() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const searchParams = useSearchParams()

  const [step, setStep] = useState(1)

  const [niches, setNiches] = useState<string[]>([])
  const [customNiche, setCustomNiche] = useState("")
  const [tone, setTone] = useState<string>("casual")
  const [handle, setHandle] = useState("")
  const [handleStatus, setHandleStatus] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">("idle")
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState("")

  // Pre-fill da hero-demo (se vier da landing sem login)
  const initialSource = (searchParams.get("source") as SourceMode | null) ?? null
  const initialInput = searchParams.get("input") ?? ""
  const [sourceMode, setSourceMode] = useState<SourceMode>(initialSource === "youtube" ? "youtube" : "url")
  const [sourceInput, setSourceInput] = useState(initialInput)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState("")
  const [firstArticle, setFirstArticle] = useState<{ id: string; title: string; slug: string | null } | null>(null)

  // Redirect pra sign-in se user caiu aqui sem login
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const query = new URLSearchParams({
        redirect_url: `/onboarding?${searchParams.toString()}`,
      })
      router.replace(`/sign-up?${query.toString()}`)
    }
  }, [isLoaded, isSignedIn, router, searchParams])

  // Carrega niches/tone/handle ja salvos se o user voltar
  useEffect(() => {
    if (!isSignedIn) return
    fetch("/api/profile", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          if (Array.isArray(data.profile.niche) && data.profile.niche.length > 0) {
            setNiches(data.profile.niche)
          }
          if (data.profile.default_tone && data.profile.default_tone !== "informativo") {
            setTone(data.profile.default_tone)
          }
          if (data.profile.blog_handle) setHandle(data.profile.blog_handle)
        }
      })
      .catch(() => {})
  }, [isSignedIn])

  // Handle validation debounce
  useEffect(() => {
    if (!handle) {
      setHandleStatus("idle")
      return
    }
    if (!HANDLE_REGEX.test(handle)) {
      setHandleStatus("invalid")
      return
    }
    setHandleStatus("checking")
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profile/handle-check?handle=${encodeURIComponent(handle)}`, {
          cache: "no-store",
        })
        const data = await res.json()
        if (data.ok) setHandleStatus("ok")
        else setHandleStatus("taken")
      } catch {
        // em dev, se o endpoint falhar, deixa tentar salvar
        setHandleStatus("ok")
      }
    }, 400)
    return () => clearTimeout(t)
  }, [handle])

  const totalSteps = 5
  const canNext = useMemo(() => {
    if (step === 1) return niches.length > 0 || customNiche.trim().length > 0
    if (step === 2) return !!tone
    if (step === 3) return handle && handleStatus === "ok"
    if (step === 4) return !!firstArticle
    return true
  }, [step, niches, customNiche, tone, handle, handleStatus, firstArticle])

  const toggleNiche = (n: string) => {
    setNiches((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]))
  }

  const saveProfile = async (fields: Record<string, unknown>) => {
    setProfileSaving(true)
    setProfileError("")
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      })
      const data = await res.json()
      if (!res.ok) {
        setProfileError(data.error ?? "Falha ao salvar")
        return false
      }
      return true
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Erro de rede")
      return false
    } finally {
      setProfileSaving(false)
    }
  }

  const handleNextFrom1 = async () => {
    const allNiches = [...niches]
    const c = customNiche.trim()
    if (c) allNiches.push(c)
    const ok = await saveProfile({ niche: allNiches })
    if (ok) setStep(2)
  }

  const handleNextFrom2 = async () => {
    const ok = await saveProfile({ default_tone: tone })
    if (ok) setStep(3)
  }

  const handleNextFrom3 = async () => {
    if (handleStatus !== "ok") return
    const ok = await saveProfile({ blog_handle: handle.toLowerCase() })
    if (ok) setStep(4)
  }

  const handleGenerateFirst = async () => {
    if (!sourceInput.trim()) return
    setGenError("")
    setGenerating(true)
    try {
      const res = await fetch("/api/generate/from-source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: sourceMode,
          input: sourceInput.trim(),
          tone,
          length: "medium",
          niche: niches[0] ?? customNiche ?? null,
          withCover: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setGenError(data.error ?? "Falha ao gerar")
      } else {
        setFirstArticle({
          id: data.id,
          title: data.article?.title ?? "Artigo gerado",
          slug: data.post?.slug ?? null,
        })
        setStep(5)
      }
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Erro de rede")
    } finally {
      setGenerating(false)
    }
  }

  const handleFinish = () => {
    router.push("/artigos")
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={18} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <main className="w-full px-6 py-10 lg:py-14 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-5">
          <Link
            href="/"
            className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            AutoBlogger
          </Link>
          <span className="text-muted-foreground/30">/</span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#10b981]">
            onboarding
          </span>
          <div className="flex-1" />
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            {step}/{totalSteps}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex gap-0 border-2 border-foreground h-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 transition-colors ${
                i < step ? "bg-[#10b981]" : "bg-transparent"
              } ${i < totalSteps - 1 ? "border-r border-foreground" : ""}`}
            />
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* STEP 1: NICHO */}
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Tag size={14} className="text-[#10b981]" />
              <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                Passo 1 · Nicho
              </span>
            </div>
            <h1 className="font-pixel text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3">
              QUAL É O NICHO<br />DO SEU BLOG?
            </h1>
            <p className="text-xs lg:text-sm font-mono text-muted-foreground mb-8 max-w-xl">
              Escolha um ou mais. A gente usa pra calibrar tom, keywords e referencias da IA.
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {NICHES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggleNiche(n)}
                  className={`px-4 py-2 text-xs font-mono tracking-wide uppercase border-2 transition-colors ${
                    niches.includes(n)
                      ? "bg-[#10b981] text-background border-[#10b981]"
                      : "border-foreground text-foreground hover:bg-foreground hover:text-background"
                  }`}
                >
                  {niches.includes(n) ? "✓ " : "+ "}
                  {n}
                </button>
              ))}
            </div>

            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                Outro nicho (opcional)
              </label>
              <input
                type="text"
                value={customNiche}
                onChange={(e) => setCustomNiche(e.target.value)}
                placeholder="Ex: Barbearia & grooming masculino"
                className="w-full bg-transparent border-2 border-foreground px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#10b981]"
              />
            </div>
          </motion.div>
        )}

        {/* STEP 2: TOM */}
        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Mic size={14} className="text-[#10b981]" />
              <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                Passo 2 · Tom de voz
              </span>
            </div>
            <h1 className="font-pixel text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3">
              COMO SEU BLOG<br />DEVE SOAR?
            </h1>
            <p className="text-xs lg:text-sm font-mono text-muted-foreground mb-8 max-w-xl">
              Voce pode ajustar isso depois em qualquer artigo. Isso vira o default.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-2 border-foreground">
              {TONES.map((t, i) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`text-left p-5 transition-colors ${
                    tone === t.id ? "bg-[#10b981]/10" : "hover:bg-foreground/5"
                  } ${
                    i % 2 === 0 ? "sm:border-r-2 border-foreground" : ""
                  } ${i < TONES.length - 2 ? "border-b-2 border-foreground" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-mono font-bold uppercase tracking-wide">
                      {t.label}
                    </span>
                    {tone === t.id && <Check size={14} className="text-[#10b981]" />}
                  </div>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                    {t.description}
                  </p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 3: HANDLE */}
        {step === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Globe size={14} className="text-[#10b981]" />
              <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                Passo 3 · Seu blog publico
              </span>
            </div>
            <h1 className="font-pixel text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3">
              QUE URL<br />VOCÊ QUER?
            </h1>
            <p className="text-xs lg:text-sm font-mono text-muted-foreground mb-8 max-w-xl">
              Seu handle vira a URL publica do seu blog. Voce pode trocar depois.
            </p>

            <div className="border-2 border-foreground p-5">
              <div className="flex items-stretch gap-0 border-2 border-foreground">
                <span className="flex items-center bg-foreground/10 px-4 text-xs font-mono text-muted-foreground">
                  autoblogger.com/blog/
                </span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  placeholder="seu-handle"
                  maxLength={30}
                  className="flex-1 bg-transparent px-4 py-2.5 text-sm font-mono focus:outline-none"
                />
              </div>
              <div className="mt-3 text-[11px] font-mono">
                {handle && (
                  <>
                    {handleStatus === "invalid" && (
                      <span className="text-destructive">
                        ✗ handle invalido — use 3-30 chars [a-z0-9-], sem começar/terminar em hifen.
                      </span>
                    )}
                    {handleStatus === "checking" && (
                      <span className="text-muted-foreground">checando disponibilidade...</span>
                    )}
                    {handleStatus === "ok" && (
                      <span className="text-[#10b981]">
                        ✓ disponivel — seu blog vai ficar em {SITE_URL}/blog/{handle}
                      </span>
                    )}
                    {handleStatus === "taken" && (
                      <span className="text-destructive">✗ handle ja em uso. tenta outro.</span>
                    )}
                  </>
                )}
                {!handle && (
                  <span className="text-muted-foreground">
                    Dica: usa o nome do seu blog ou seu @ de sempre.
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: FIRST ARTICLE */}
        {step === 4 && (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-[#10b981]" />
              <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                Passo 4 · Primeiro artigo
              </span>
            </div>
            <h1 className="font-pixel text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3">
              VAMO GERAR O<br />PRIMEIRO POST?
            </h1>
            <p className="text-xs lg:text-sm font-mono text-muted-foreground mb-8 max-w-xl">
              Cola uma URL ou link de video. A gente extrai, reescreve e gera a capa.
            </p>

            <div className="border-2 border-foreground mb-4">
              <div className="flex border-b-2 border-foreground">
                <button
                  type="button"
                  onClick={() => setSourceMode("url")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono tracking-widest uppercase transition-colors ${
                    sourceMode === "url"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Link2 size={12} />
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode("youtube")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono tracking-widest uppercase border-l-2 border-foreground transition-colors ${
                    sourceMode === "youtube"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Youtube size={12} />
                  YouTube
                </button>
              </div>
              <input
                type="url"
                value={sourceInput}
                onChange={(e) => setSourceInput(e.target.value)}
                placeholder={
                  sourceMode === "url"
                    ? "https://tecnoblog.net/post/..."
                    : "https://youtube.com/watch?v=..."
                }
                className="w-full bg-transparent px-4 py-3 text-sm font-mono focus:outline-none"
              />
            </div>

            {genError && (
              <div className="border-2 border-destructive bg-destructive/10 px-4 py-2.5 mb-4 flex items-center gap-2 text-destructive">
                <AlertCircle size={14} />
                <span className="text-xs font-mono">{genError}</span>
              </div>
            )}

            <button
              onClick={handleGenerateFirst}
              disabled={generating || !sourceInput.trim()}
              className="flex items-center gap-0 bg-foreground text-background text-sm font-mono tracking-wider uppercase disabled:opacity-50 disabled:cursor-wait"
            >
              <span className="flex items-center justify-center w-10 h-10 bg-[#10b981]">
                {generating ? (
                  <Loader2 size={16} className="animate-spin text-background" />
                ) : (
                  <Sparkles size={16} className="text-background" />
                )}
              </span>
              <span className="px-5 py-2.5">
                {generating ? "Gerando seu primeiro artigo..." : "Gerar artigo + capa"}
              </span>
            </button>

            <p className="text-[10px] font-mono text-muted-foreground mt-3">
              Pode levar ate 60s — a IA ta extraindo, reescrevendo e pintando a capa.
            </p>
          </motion.div>
        )}

        {/* STEP 5: DONE */}
        {step === 5 && (
          <motion.div
            key="step-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Check size={14} className="text-[#10b981]" />
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#10b981]">
                Passo 5 · Pronto
              </span>
            </div>
            <h1 className="font-pixel text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3">
              SEU BLOG<br />ESTÁ <span className="text-[#10b981]">AO VIVO</span>.
            </h1>
            <p className="text-xs lg:text-sm font-mono text-muted-foreground mb-8 max-w-xl">
              {firstArticle
                ? `Geramos "${firstArticle.title}" como rascunho. Publica quando quiser.`
                : "Setup concluido."}
            </p>

            <div className="flex flex-col gap-3 mb-6">
              <a
                href={`/blog/${handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-0 bg-[#10b981] text-background text-sm font-mono tracking-wider uppercase"
              >
                <span className="flex items-center justify-center w-10 h-10 bg-foreground text-background">
                  <ExternalLink size={16} />
                </span>
                <span className="px-5 py-2.5 flex-1">Ver seu blog ao vivo</span>
              </a>
              {firstArticle && (
                <Link
                  href={`/artigos/${firstArticle.id}`}
                  className="flex items-center gap-0 border-2 border-foreground text-foreground text-sm font-mono tracking-wider uppercase hover:bg-foreground hover:text-background transition-colors"
                >
                  <span className="flex items-center justify-center w-10 h-10">
                    <ArrowRight size={16} />
                  </span>
                  <span className="px-5 py-2.5 flex-1">Revisar/publicar primeiro artigo</span>
                </Link>
              )}
            </div>

            <button
              onClick={handleFinish}
              className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              Pular, ir para o painel →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer nav */}
      {step < 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between mt-10 pt-6 border-t border-border"
        >
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Voltar
          </button>

          {profileError && (
            <span className="text-[11px] font-mono text-destructive">{profileError}</span>
          )}

          {step < 4 && (
            <button
              onClick={() => {
                if (step === 1) handleNextFrom1()
                else if (step === 2) handleNextFrom2()
                else if (step === 3) handleNextFrom3()
              }}
              disabled={!canNext || profileSaving}
              className="flex items-center gap-0 bg-foreground text-background text-sm font-mono tracking-wider uppercase disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center w-10 h-10 bg-[#10b981]">
                {profileSaving ? (
                  <Loader2 size={16} className="animate-spin text-background" />
                ) : (
                  <ArrowRight size={16} className="text-background" />
                )}
              </span>
              <span className="px-4 py-2.5">
                {profileSaving ? "Salvando..." : "Próximo"}
              </span>
            </button>
          )}
        </motion.div>
      )}
    </main>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ChevronLeft,
  Save,
  Check,
  User,
  LogOut,
  AlertTriangle,
  ExternalLink,
  Globe,
  Plug,
} from "lucide-react"
import { useClerk, useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

const HANDLE_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/

type Profile = {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  niche: string[] | null
  default_tone: string
  plan: "free" | "pro" | "agency"
  posts_limit: number
  posts_count: number
  blog_handle: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

const ease = [0.22, 1, 0.36, 1] as const

const TONES = [
  { id: "informativo", label: "Informativo" },
  { id: "opinativo", label: "Opinativo" },
  { id: "educacional", label: "Educacional" },
  { id: "analitico", label: "Analitico" },
]

export default function SettingsPage() {
  const { user, isSignedIn, isLoaded } = useUser()
  const { signOut } = useClerk()
  const authed = Boolean(isSignedIn)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState("")
  const [niches, setNiches] = useState("")
  const [defaultTone, setDefaultTone] = useState("informativo")
  const [blogHandle, setBlogHandle] = useState("")
  const [bio, setBio] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const [integrationCount, setIntegrationCount] = useState<number | null>(null)

  const refreshProfile = async () => {
    if (!authed) return
    try {
      const res = await apiFetch("/api/profile")
      if (!res.ok) return
      const data = await res.json()
      if (data.profile) setProfile(data.profile as Profile)
    } catch {}
  }

  const refreshIntegrations = async () => {
    if (!authed) return
    try {
      const res = await fetch("/api/integrations", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      setIntegrationCount(Array.isArray(data.integrations) ? data.integrations.length : 0)
    } catch {}
  }

  useEffect(() => {
    if (!isLoaded) return
    if (authed) {
      void refreshProfile()
      void refreshIntegrations()
    } else if (typeof window !== "undefined") {
      // Fallback local: pega dados do config antigo (sem mais apiKey)
      try {
        const cfg = JSON.parse(localStorage.getItem("autoblogger_config") || "{}")
        if (cfg.blogName) setName(cfg.blogName)
        if (cfg.niche) setNiches(cfg.niche)
        if (cfg.tone) setDefaultTone(cfg.tone)
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, isLoaded])

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "")
      setNiches((profile.niche ?? []).join(", "))
      setDefaultTone(profile.default_tone ?? "informativo")
      setBlogHandle(profile.blog_handle ?? "")
      setBio(profile.bio ?? "")
    }
  }, [profile])

  const handleSave = async () => {
    // Valida handle antes de bater no servidor.
    const trimmedHandle = blogHandle.trim().toLowerCase()
    if (trimmedHandle && !HANDLE_REGEX.test(trimmedHandle)) {
      toast.error("Handle invalido", {
        description:
          "Use 3-30 caracteres minusculos, numeros e hifens. Sem comecar/terminar em hifen.",
      })
      return
    }

    setSaving(true)
    setError("")
    const nicheArray = niches.split(",").map((n) => n.trim()).filter(Boolean)

    if (authed) {
      try {
        // Gemini API key nao e mais editavel pelo usuario — o servidor sempre usa
        // a chave global do .env. Removida do payload.
        const payload: Record<string, unknown> = {
          name,
          niche: nicheArray,
          default_tone: defaultTone,
          blog_handle: blogHandle.trim() || null,
          bio: bio.trim() || null,
        }

        const res = await apiFetch("/api/profile", {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          const msg = data.error || "Erro ao salvar"
          setError(msg)
          toast.error("Falha ao salvar", { description: msg })
        } else {
          await refreshProfile()
          setSaved(true)
          toast.success("Settings salvos", {
            description: "Suas configuracoes foram sincronizadas na nuvem.",
          })
          setTimeout(() => setSaved(false), 2500)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro de conexao"
        setError(msg)
        toast.error("Erro de conexao", { description: msg })
      }
    } else {
      // Salva local
      try {
        const prev = JSON.parse(localStorage.getItem("autoblogger_config") || "{}")
        localStorage.setItem(
          "autoblogger_config",
          JSON.stringify({
            ...prev,
            blogName: name,
            niche: niches,
            tone: defaultTone,
          })
        )
        setSaved(true)
        toast.success("Settings salvos no navegador", {
          description: "Crie uma conta pra sincronizar entre devices.",
        })
        setTimeout(() => setSaved(false), 2500)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao salvar"
        setError(msg)
        toast.error("Falha ao salvar", { description: msg })
      }
    }
    setSaving(false)
  }

  const plan = profile?.plan ?? "free"
  const postsCount = profile?.posts_count ?? 0
  const postsLimit = profile?.posts_limit ?? 5

  const handleUpgrade = async (targetPlan: "pro" | "agency") => {
    setError("")
    try {
      const res = await apiFetch("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ plan: targetPlan }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
        return
      }
      setError(data.error ?? "Checkout indisponivel. Tenta novamente em instantes.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de conexao")
    }
  }

  return (
    <div className="min-h-screen dot-grid-bg">
      <div className="w-full px-4 pt-4 lg:px-6 lg:pt-6">
        <nav className="w-full border border-foreground/20 bg-background/80 backdrop-blur-sm px-6 py-3 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft size={14} />
              <div className="w-6 h-6 bg-[#10b981] flex items-center justify-center">
                <span className="text-background font-mono font-bold text-xs">A</span>
              </div>
              <span className="text-xs font-mono tracking-[0.15em] uppercase font-bold">
                AutoBlogger
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/artigos"
                className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase hover:text-foreground transition-colors"
              >
                Meus Artigos
              </Link>
              <Link
                href="/gerar"
                className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase hover:text-foreground transition-colors"
              >
                Gerar
              </Link>
            </div>
          </div>
        </nav>
      </div>

      <main className="w-full px-6 py-12 lg:px-12 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
              {"// AUTOBLOGGER: CONFIGURACOES"}
            </span>
            <div className="flex-1 border-t border-border" />
          </div>
          <h1 className="font-pixel text-2xl sm:text-4xl tracking-tight text-foreground mb-3">
            SETTINGS
          </h1>
          <p className="text-xs font-mono text-muted-foreground">
            {!isLoaded
              ? "Verificando sessao..."
              : authed
                ? `Logado como ${user?.primaryEmailAddress?.emailAddress ?? "conta"}`
                : "Modo local (sem autenticacao). Crie uma conta para sincronizar."}
          </p>
        </motion.div>

        {isLoaded && !authed && (
          <div className="border-2 border-[#eab308] bg-[#eab308]/10 px-5 py-4 mb-6 flex items-start gap-3">
            <AlertTriangle size={14} className="text-[#eab308] mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-mono text-foreground font-bold mb-1">
                Voce nao esta logado
              </p>
              <p className="text-[11px] font-mono text-muted-foreground">
                As configuracoes ficam salvas apenas no navegador.{" "}
                <a href="/sign-in" className="text-[#10b981] hover:underline">
                  Entre
                </a>{" "}
                ou{" "}
                <a href="/sign-up" className="text-[#10b981] hover:underline">
                  crie uma conta
                </a>{" "}
                para sincronizar na nuvem.
              </p>
            </div>
          </div>
        )}

        {/* Perfil */}
        <div className="border-2 border-foreground mb-4">
          <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-foreground bg-foreground text-background">
            <User size={12} />
            <span className="text-[10px] font-mono tracking-widest uppercase">Perfil</span>
          </div>
          <div className="p-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome ou do blog"
                className="w-full bg-transparent border-2 border-foreground px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#10b981] transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                Email
              </label>
              <input
                type="email"
                value={user?.primaryEmailAddress?.emailAddress ?? "—"}
                disabled
                className="w-full bg-transparent border-2 border-foreground/30 px-3 py-2 text-sm font-mono text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                Nichos (separados por virgula)
              </label>
              <input
                type="text"
                value={niches}
                onChange={(e) => setNiches(e.target.value)}
                placeholder="cripto, ia, produtividade"
                className="w-full bg-transparent border-2 border-foreground px-3 py-2 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#10b981] transition-colors"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                Tom padrao
              </label>
              <div className="flex gap-0 flex-wrap">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setDefaultTone(t.id)}
                    className={`px-4 py-2 text-xs font-mono tracking-widest uppercase border-2 border-foreground -ml-[2px] first:ml-0 transition-colors ${
                      defaultTone === t.id
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
        </div>

        {/* Blog publico */}
        {authed && (
          <div className="border-2 border-foreground mb-4">
            <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-foreground bg-foreground text-background">
              <Globe size={12} />
              <span className="text-[10px] font-mono tracking-widest uppercase">Blog publico</span>
            </div>
            <div className="p-4 grid gap-3">
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                  Handle (URL: /blog/&lt;handle&gt;)
                </label>
                <input
                  type="text"
                  value={blogHandle}
                  onChange={(e) =>
                    setBlogHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                  }
                  placeholder="gabriel"
                  className="w-full bg-transparent border-2 border-foreground px-3 py-2 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#10b981] transition-colors"
                />
                <p className="text-[10px] font-mono text-muted-foreground mt-1">
                  3-30 chars, minusculas, numeros e hifen. Deixe em branco pra desativar o blog publico.
                </p>
                {blogHandle && !HANDLE_REGEX.test(blogHandle) && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-destructive mt-2">
                    Formato invalido — sera rejeitado ao salvar.
                  </span>
                )}
                {blogHandle && HANDLE_REGEX.test(blogHandle) && profile?.blog_handle === blogHandle && (
                  <a
                    href={`/blog/${blogHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-[#10b981] hover:underline mt-2"
                  >
                    <ExternalLink size={10} />
                    Ver blog publico em /blog/{blogHandle}
                  </a>
                )}
                {blogHandle && HANDLE_REGEX.test(blogHandle) && profile?.blog_handle !== blogHandle && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground mt-2">
                    Preview: vai virar <span className="text-[#10b981] mx-1">/blog/{blogHandle}</span> apos salvar.
                  </span>
                )}
              </div>
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                  Bio (opcional)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  placeholder="Uma frase sobre voce, exibida no cabecalho do blog."
                  className="w-full bg-transparent border-2 border-foreground px-3 py-2 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#10b981] transition-colors resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Integrações */}
        {authed && (
          <div className="border-2 border-foreground mb-4">
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-foreground bg-foreground text-background">
              <div className="flex items-center gap-2">
                <Plug size={12} />
                <span className="text-[10px] font-mono tracking-widest uppercase">
                  Integrações de publicação
                </span>
              </div>
              {integrationCount !== null && (
                <span
                  className="text-[10px] font-mono tracking-widest uppercase"
                  style={{ color: integrationCount > 0 ? "#10b981" : undefined }}
                >
                  {integrationCount > 0 ? `${integrationCount} ativa${integrationCount === 1 ? "" : "s"}` : "nenhuma"}
                </span>
              )}
            </div>
            <div className="p-4 flex flex-col gap-3">
              <p className="text-[11px] font-mono text-muted-foreground">
                {integrationCount && integrationCount > 0
                  ? "Você tem integrações ativas. Edite credenciais ou adicione mais sites no hub."
                  : "Conecte WordPress, Wix ou Ghost pra publicar artigos direto da plataforma com 1 clique."}
              </p>
              <Link
                href="/integrations"
                className="inline-flex items-center gap-2 self-start bg-foreground text-background px-4 py-2 text-[10px] font-mono tracking-widest uppercase hover:bg-[#10b981] transition-colors"
              >
                <ExternalLink size={10} />
                {integrationCount && integrationCount > 0 ? "Gerenciar integrações" : "Conectar primeira integração"}
              </Link>
            </div>
          </div>
        )}

        {/* Plano */}
        {authed && (
          <div className="border-2 border-foreground mb-4">
            <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-foreground bg-foreground text-background">
              <span className="text-[10px] font-mono tracking-widest uppercase">Plano</span>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono tracking-widest uppercase font-bold">
                    {plan}
                  </span>
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">
                    {postsCount}/{postsLimit} artigos gerados nesse ciclo
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-32 h-1.5 border border-foreground/50">
                    <div
                      className="h-full bg-[#10b981]"
                      style={{ width: `${Math.min((postsCount / postsLimit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {plan !== "agency" && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-foreground/15">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mr-2">
                    Upgrade:
                  </span>
                  {plan === "free" && (
                    <button
                      onClick={() => handleUpgrade("pro")}
                      className="text-[10px] font-mono tracking-widest uppercase px-3 py-2 border-2 border-foreground hover:bg-[#10b981] hover:border-[#10b981] hover:text-background transition-colors"
                    >
                      Pro · $19.99/mes
                    </button>
                  )}
                  <button
                    onClick={() => handleUpgrade("agency")}
                    className="text-[10px] font-mono tracking-widest uppercase px-3 py-2 border-2 border-foreground hover:bg-[#10b981] hover:border-[#10b981] hover:text-background transition-colors"
                  >
                    Agency · $49.99/mes
                  </button>
                  <Link
                    href="/#pricing"
                    className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors ml-auto"
                  >
                    Comparar planos →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="border-2 border-destructive bg-destructive/10 px-4 py-2 mb-4">
            <span className="text-xs font-mono text-destructive">{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-xs font-mono tracking-widest uppercase disabled:opacity-50"
          >
            {saved ? <Check size={12} /> : <Save size={12} />}
            {saving ? "Salvando..." : saved ? "Salvo" : "Salvar mudancas"}
          </button>
          {authed && (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 border-2 border-foreground px-5 py-2.5 text-xs font-mono tracking-widest uppercase hover:bg-foreground hover:text-background transition-colors"
            >
              <LogOut size={12} />
              Sair
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

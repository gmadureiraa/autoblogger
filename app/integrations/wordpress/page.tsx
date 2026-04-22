"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  ExternalLink,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Plug,
  Plus,
  Globe,
} from "lucide-react"
import { useUser } from "@clerk/nextjs"

const ease = [0.22, 1, 0.36, 1] as const

type Site = {
  id: string
  site_url: string
  username: string
  label: string | null
  default_status: string
  default_category_id: number | null
  last_checked_at: string | null
  created_at: string
}

export default function WordPressIntegrationsPage() {
  const { isSignedIn, isLoaded } = useUser()
  const authed = Boolean(isSignedIn)

  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)

  const [siteUrl, setSiteUrl] = useState("")
  const [username, setUsername] = useState("")
  const [appPassword, setAppPassword] = useState("")
  const [label, setLabel] = useState("")
  const [defaultStatus, setDefaultStatus] = useState<"draft" | "publish">("draft")

  const [submitting, setSubmitting] = useState(false)
  const [formMsg, setFormMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [testMsg, setTestMsg] = useState<Record<string, { ok: boolean; text: string }>>({})

  const fetchSites = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/wordpress/sites", { cache: "no-store" })
      const data = await res.json()
      if (res.ok) setSites(data.sites ?? [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (!isLoaded) return
    if (authed) fetchSites()
    else setLoading(false)
  }, [isLoaded, authed])

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!siteUrl || !username || !appPassword) return
    setSubmitting(true)
    setFormMsg(null)
    try {
      const res = await fetch("/api/wordpress/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteUrl: siteUrl.trim(),
          username: username.trim(),
          appPassword,
          label: label.trim() || null,
          defaultStatus,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormMsg({ type: "err", text: data.error || "Falha ao conectar" })
      } else {
        setFormMsg({ type: "ok", text: "Site conectado com sucesso." })
        setSiteUrl("")
        setUsername("")
        setAppPassword("")
        setLabel("")
        fetchSites()
      }
    } catch (err) {
      setFormMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Erro de rede",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleTest = async (siteId: string) => {
    setTesting(siteId)
    setTestMsg((prev) => ({ ...prev, [siteId]: { ok: false, text: "testando..." } }))
    try {
      const res = await fetch("/api/wordpress/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setTestMsg((prev) => ({
          ...prev,
          [siteId]: {
            ok: true,
            text: `ok (${data.user?.name ?? "user"})`,
          },
        }))
      } else {
        setTestMsg((prev) => ({
          ...prev,
          [siteId]: { ok: false, text: data.error ?? "falhou" },
        }))
      }
    } catch (err) {
      setTestMsg((prev) => ({
        ...prev,
        [siteId]: {
          ok: false,
          text: err instanceof Error ? err.message : "falhou",
        },
      }))
    } finally {
      setTesting(null)
    }
  }

  const handleDelete = async (siteId: string) => {
    if (!confirm("Remover esse site? Nao da pra desfazer.")) return
    try {
      const res = await fetch(`/api/wordpress/sites/${siteId}`, { method: "DELETE" })
      if (res.ok) setSites((prev) => prev.filter((s) => s.id !== siteId))
    } catch {}
  }

  if (isLoaded && !authed) {
    return (
      <div className="min-h-screen dot-grid-bg flex flex-col items-center justify-center gap-4 p-6">
        <Plug size={32} className="text-muted-foreground/40" />
        <p className="text-sm font-mono text-muted-foreground">
          Faca login pra conectar seu WordPress.
        </p>
        <Link
          href="/sign-in"
          className="text-xs font-mono text-[#10b981] tracking-widest uppercase hover:underline"
        >
          Entrar
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen dot-grid-bg">
      {/* Navbar mini */}
      <div className="w-full px-4 pt-4 lg:px-6 lg:pt-6">
        <nav className="w-full border border-foreground/20 bg-background/80 backdrop-blur-sm px-6 py-3 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/artigos"
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
                href="/settings"
                className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase hover:text-foreground transition-colors"
              >
                Settings
              </Link>
            </div>
          </div>
        </nav>
      </div>

      <main className="w-full px-6 py-12 lg:px-12 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
              {"// AUTOBLOGGER: INTEGRATIONS > WORDPRESS"}
            </span>
            <div className="flex-1 border-t border-border" />
            <span className="inline-block h-2 w-2 bg-[#10b981] animate-blink" />
          </div>

          <h1 className="font-pixel text-2xl sm:text-4xl lg:text-5xl tracking-tight text-foreground mb-3">
            WORDPRESS
          </h1>
          <p className="text-xs lg:text-sm text-muted-foreground font-mono max-w-2xl">
            Conecte seu site WordPress pra publicar artigos direto em 1 clique.
            Use uma <strong className="text-foreground">Application Password</strong> (nao sua senha pessoal).
          </p>
        </motion.div>

        {/* Form conectar */}
        <motion.form
          onSubmit={handleConnect}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05, ease }}
          className="border-2 border-foreground mb-8"
        >
          <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground text-background">
            <span className="text-[10px] tracking-[0.2em] uppercase font-mono flex items-center gap-2">
              <Plus size={12} />
              Conectar novo site
            </span>
            <span className="text-[10px] font-mono text-background/60">
              REST API + Application Password
            </span>
          </div>

          <div className="p-5 grid gap-4">
            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                SITE URL
              </label>
              <input
                type="url"
                required
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://meusite.com"
                className="w-full bg-transparent border-2 border-foreground px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#10b981] transition-colors"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                  USERNAME WP
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="seu-usuario"
                  className="w-full bg-transparent border-2 border-foreground px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#10b981] transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                  APPLICATION PASSWORD
                </label>
                <input
                  type="password"
                  required
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                  className="w-full bg-transparent border-2 border-foreground px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#10b981] transition-colors"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                  APELIDO (OPCIONAL)
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Blog principal"
                  className="w-full bg-transparent border-2 border-foreground px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#10b981] transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                  STATUS PADRAO
                </label>
                <div className="flex gap-0">
                  {(["draft", "publish"] as const).map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setDefaultStatus(s)}
                      className={`px-4 py-2.5 text-xs font-mono tracking-widest uppercase border-2 border-foreground -ml-[2px] first:ml-0 transition-colors ${
                        defaultStatus === s
                          ? "bg-[#10b981] text-background border-[#10b981]"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s === "draft" ? "Rascunho" : "Publicado"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-2 border-foreground/30 bg-foreground/5 px-4 py-3 text-[11px] font-mono text-muted-foreground leading-relaxed">
              <strong className="text-foreground block mb-1">Como gerar a Application Password:</strong>
              1. Entre no seu <em>WP Admin</em>.<br />
              2. Users → Profile (voce mesmo).<br />
              3. Role ate <em>Application Passwords</em>, de um nome (ex: AutoBlogger) e clique em <em>Add New</em>.<br />
              4. Copie os 24 caracteres (com espacos ou sem, nao importa) e cole acima.
            </div>

            <AnimatePresence>
              {formMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`border-2 px-4 py-2.5 flex items-center gap-2 ${
                    formMsg.type === "ok"
                      ? "border-[#10b981] bg-[#10b981]/10 text-[#10b981]"
                      : "border-destructive bg-destructive/10 text-destructive"
                  }`}
                >
                  {formMsg.type === "ok" ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span className="text-xs font-mono">{formMsg.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-0 bg-foreground text-background text-sm font-mono tracking-wider uppercase disabled:opacity-50 disabled:cursor-wait self-start"
            >
              <span className="flex items-center justify-center w-10 h-10 bg-[#10b981]">
                {submitting ? (
                  <Loader2 size={16} className="animate-spin text-background" />
                ) : (
                  <Plug size={16} className="text-background" />
                )}
              </span>
              <span className="px-5 py-2.5">
                {submitting ? "Validando e salvando..." : "Conectar site"}
              </span>
            </button>
          </div>
        </motion.form>

        {/* Lista */}
        <div className="mb-4 flex items-center gap-4">
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
            {"// SITES CONECTADOS"}
          </span>
          <div className="flex-1 border-t border-border" />
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            {sites.length} site{sites.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <div className="border-2 border-foreground/30 px-8 py-12 text-center">
            <Loader2 size={18} className="mx-auto animate-spin text-muted-foreground" />
          </div>
        ) : sites.length === 0 ? (
          <div className="border-2 border-foreground/30 px-8 py-12 text-center">
            <Globe size={24} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-mono text-muted-foreground">
              Nenhum site conectado ainda.
            </p>
          </div>
        ) : (
          <div className="border-2 border-foreground">
            {sites.map((site, i) => (
              <div
                key={site.id}
                className={`p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
                  i < sites.length - 1 ? "border-b-2 border-foreground" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe size={12} className="text-[#10b981]" />
                    <a
                      href={site.site_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono font-bold truncate hover:text-[#10b981]"
                    >
                      {site.label || new URL(site.site_url).hostname}
                    </a>
                    <span className="text-[10px] font-mono text-muted-foreground truncate">
                      {site.site_url}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                      user: {site.username}
                    </span>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                      status padrao: {site.default_status}
                    </span>
                    {site.last_checked_at && (
                      <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                        checado: {new Date(site.last_checked_at).toLocaleString("pt-BR")}
                      </span>
                    )}
                    {testMsg[site.id] && (
                      <span
                        className={`text-[10px] font-mono tracking-widest uppercase ${
                          testMsg[site.id].ok ? "text-[#10b981]" : "text-destructive"
                        }`}
                      >
                        {testMsg[site.id].text}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTest(site.id)}
                    disabled={testing === site.id}
                    className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase px-3 py-2 border-2 border-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                  >
                    {testing === site.id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                    Testar
                  </button>
                  <a
                    href={site.site_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase px-3 py-2 border-2 border-foreground hover:bg-foreground hover:text-background transition-colors"
                  >
                    <ExternalLink size={10} />
                    Abrir
                  </a>
                  <button
                    onClick={() => handleDelete(site.id)}
                    className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase px-3 py-2 border-2 border-destructive/50 text-destructive hover:bg-destructive hover:text-background transition-colors"
                  >
                    <Trash2 size={10} />
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

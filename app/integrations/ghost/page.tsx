"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Plug,
  Plus,
  Globe,
  ExternalLink,
} from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"

const ease = [0.22, 1, 0.36, 1] as const

type Integration = {
  id: string
  platform: "ghost"
  display_name: string
  metadata: { accountLabel?: string; apiUrl?: string }
  last_used_at: string | null
  last_checked_at: string | null
  created_at: string
}

export default function GhostIntegrationPage() {
  const { isSignedIn, isLoaded } = useUser()
  const authed = Boolean(isSignedIn)

  const [items, setItems] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)

  const [apiUrl, setApiUrl] = useState("")
  const [adminApiKey, setAdminApiKey] = useState("")
  const [label, setLabel] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [formMsg, setFormMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/integrations", { cache: "no-store" })
      const data = await res.json()
      if (res.ok) {
        const all = (data.integrations ?? []) as Integration[]
        setItems(all.filter((i) => i.platform === "ghost"))
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (!isLoaded) return
    if (authed) fetchItems()
    else setLoading(false)
  }, [isLoaded, authed])

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiUrl || !adminApiKey) return
    // Validação inline antes de bater no servidor:
    if (!/^https?:\/\//i.test(apiUrl.trim())) {
      setFormMsg({ type: "err", text: "URL deve começar com http:// ou https://." })
      return
    }
    if (!/^[a-f0-9]+:[a-f0-9]+$/i.test(adminApiKey.trim())) {
      setFormMsg({
        type: "err",
        text: "Admin API Key deve estar no formato 'id:secret' (hex, sem espaços).",
      })
      return
    }
    setSubmitting(true)
    setFormMsg(null)
    try {
      const cleanUrl = apiUrl.trim().replace(/\/+$/, "")
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "ghost",
          displayName:
            label.trim() ||
            (() => {
              try {
                return new URL(cleanUrl).hostname
              } catch {
                return cleanUrl
              }
            })(),
          credentials: { apiUrl: cleanUrl, adminApiKey: adminApiKey.trim() },
          metadata: { apiUrl: cleanUrl },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormMsg({ type: "err", text: data.error || "Falha ao conectar" })
      } else {
        setFormMsg({ type: "ok", text: "Ghost conectado com sucesso." })
        setApiUrl("")
        setAdminApiKey("")
        setLabel("")
        toast.success("Ghost conectado")
        fetchItems()
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

  const handleDelete = async (id: string) => {
    if (!confirm("Remover essa conexão? Não dá pra desfazer.")) return
    try {
      const res = await fetch(`/api/integrations/${id}`, { method: "DELETE" })
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id))
    } catch {}
  }

  if (isLoaded && !authed) {
    return (
      <div className="min-h-screen dot-grid-bg flex flex-col items-center justify-center gap-4 p-6">
        <Plug size={32} className="text-muted-foreground/40" />
        <p className="text-sm font-mono text-muted-foreground">
          Faça login pra conectar seu Ghost.
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
      <div className="w-full px-4 pt-4 lg:px-6 lg:pt-6">
        <nav className="w-full border border-foreground/20 bg-background/80 backdrop-blur-sm px-6 py-3 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/integrations"
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
                href="/integrations"
                className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase hover:text-foreground transition-colors"
              >
                Hub
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
              {"// AUTOBLOGGER: INTEGRATIONS > GHOST"}
            </span>
            <div className="flex-1 border-t border-border" />
            <span className="inline-block h-2 w-2 bg-[#10b981] animate-blink" />
          </div>

          <h1 className="font-pixel text-2xl sm:text-4xl lg:text-5xl tracking-tight text-foreground mb-3">
            GHOST
          </h1>
          <p className="text-xs lg:text-sm text-muted-foreground font-mono max-w-2xl">
            Conecte seu Ghost (self-hosted ou Ghost Pro) usando uma{" "}
            <strong className="text-foreground">Custom Integration</strong> com Admin API Key.
          </p>
        </motion.div>

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
              Conectar Ghost
            </span>
            <span className="text-[10px] font-mono text-background/60">
              Admin API + JWT
            </span>
          </div>

          <div className="p-5 grid gap-4">
            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                URL DO GHOST
              </label>
              <input
                type="url"
                required
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://meublog.ghost.io"
                className="w-full bg-transparent border-2 border-foreground px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#10b981] transition-colors"
              />
              <p className="text-[10px] font-mono text-muted-foreground mt-1.5">
                URL base, sem <code>/ghost</code> nem <code>/api</code>.
              </p>
            </div>

            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                ADMIN API KEY
              </label>
              <input
                type="password"
                required
                value={adminApiKey}
                onChange={(e) => setAdminApiKey(e.target.value)}
                placeholder="64char-id:64char-secret-em-hex"
                className="w-full bg-transparent border-2 border-foreground px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#10b981] transition-colors"
              />
              <p className="text-[10px] font-mono text-muted-foreground mt-1.5">
                Formato exato como aparece no Ghost: <code>id:secret</code>
              </p>
            </div>

            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                APELIDO (OPCIONAL)
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Meu blog Ghost"
                className="w-full bg-transparent border-2 border-foreground px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#10b981] transition-colors"
              />
            </div>

            <div className="border-2 border-foreground/30 bg-foreground/5 px-4 py-3 text-[11px] font-mono text-muted-foreground leading-relaxed">
              <strong className="text-foreground block mb-1">
                Como pegar o Admin API Key:
              </strong>
              1. Ghost Admin → <em>Settings → Integrations</em>.<br />
              2. <em>+ Add custom integration</em>, dê um nome (ex: AutoBlogger).<br />
              3. Copie o valor de <em>Admin API Key</em> (formato <code>id:secret</code>).<br />
              4. Cole acima.{" "}
              <a
                href="https://ghost.org/docs/admin-api/#authentication"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#10b981] hover:underline inline-flex items-center gap-1"
              >
                Doc oficial
                <ExternalLink size={9} />
              </a>
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
                {submitting ? "Validando..." : "Conectar Ghost"}
              </span>
            </button>
          </div>
        </motion.form>

        <div className="mb-4 flex items-center gap-4">
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
            {"// CONEXÕES GHOST"}
          </span>
          <div className="flex-1 border-t border-border" />
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            {items.length} conexão{items.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <div className="border-2 border-foreground/30 px-8 py-12 text-center">
            <Loader2 size={18} className="mx-auto animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="border-2 border-foreground/30 px-8 py-12 text-center">
            <Globe size={24} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-mono text-muted-foreground">
              Nenhum site Ghost conectado ainda.
            </p>
          </div>
        ) : (
          <div className="border-2 border-foreground">
            {items.map((it, i) => (
              <div
                key={it.id}
                className={`p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
                  i < items.length - 1 ? "border-b-2 border-foreground" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe size={12} className="text-[#10b981]" />
                    <span className="text-sm font-mono font-bold truncate">
                      {it.display_name}
                    </span>
                    {it.metadata?.apiUrl && (
                      <span className="text-[10px] font-mono text-muted-foreground truncate">
                        {it.metadata.apiUrl}
                      </span>
                    )}
                  </div>
                  {Boolean(it.metadata?.accountLabel) && (
                    <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                      site: {String(it.metadata.accountLabel)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {it.metadata?.apiUrl && (
                    <a
                      href={it.metadata.apiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase px-3 py-2 border-2 border-foreground hover:bg-foreground hover:text-background transition-colors"
                    >
                      <ExternalLink size={10} />
                      Abrir
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(it.id)}
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

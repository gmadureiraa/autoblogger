"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ChevronLeft,
  Plug,
  Plus,
  Trash2,
  ExternalLink,
  Globe,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"

const ease = [0.22, 1, 0.36, 1] as const

type Platform = "wordpress" | "wix" | "ghost"

type Integration = {
  id: string
  platform: Platform
  display_name: string
  metadata: Record<string, unknown>
  last_used_at: string | null
  last_checked_at: string | null
  created_at: string
}

const PLATFORM_INFO: Record<
  Platform,
  { name: string; tagline: string; description: string; mark: string; markBg: string; markFg: string }
> = {
  wordpress: {
    name: "WordPress",
    tagline: "REST API + App Password",
    description: "Self-hosted, .com Business+ ou Pressable. 1-clique pra rascunho ou publicar.",
    mark: "WP",
    markBg: "#21759b",
    markFg: "#ffffff",
  },
  wix: {
    name: "Wix Blog",
    tagline: "Headless API + API Key",
    description: "Wix Blog via Headless. HTML simples, edita layout no admin Wix se precisar.",
    mark: "Wx",
    markBg: "#fbbb00",
    markFg: "#0b0b0b",
  },
  ghost: {
    name: "Ghost",
    tagline: "Admin API + JWT",
    description: "Self-hosted ou Ghost Pro. Suporta features e tags. Markdown nativo.",
    mark: "Gh",
    markBg: "#15171a",
    markFg: "#ffffff",
  },
}

export default function IntegrationsHubPage() {
  const { isSignedIn, isLoaded } = useUser()
  const authed = Boolean(isSignedIn)

  const [items, setItems] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/integrations", { cache: "no-store" })
      const data = await res.json()
      if (res.ok) setItems(data.integrations ?? [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (!isLoaded) return
    if (authed) fetchItems()
    else setLoading(false)
  }, [isLoaded, authed])

  const handleDelete = async (id: string) => {
    if (!confirm("Remover essa integração? Não dá pra desfazer.")) return
    try {
      const res = await fetch(`/api/integrations/${id}`, { method: "DELETE" })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id))
        toast.success("Integração removida")
      } else {
        toast.error("Falha ao remover")
      }
    } catch (err) {
      toast.error("Erro de rede", {
        description: err instanceof Error ? err.message : "",
      })
    }
  }

  if (isLoaded && !authed) {
    return (
      <div className="min-h-screen dot-grid-bg flex flex-col items-center justify-center gap-4 p-6">
        <Plug size={32} className="text-muted-foreground/40" />
        <p className="text-sm font-mono text-muted-foreground">
          Faça login pra gerenciar integrações.
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

  const grouped: Record<Platform, Integration[]> = {
    wordpress: items.filter((i) => i.platform === "wordpress"),
    wix: items.filter((i) => i.platform === "wix"),
    ghost: items.filter((i) => i.platform === "ghost"),
  }

  return (
    <div className="min-h-screen dot-grid-bg">
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

      <main className="w-full px-6 py-12 lg:px-12 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
              {"// AUTOBLOGGER: INTEGRATIONS"}
            </span>
            <div className="flex-1 border-t border-border" />
            <span className="inline-block h-2 w-2 bg-[#10b981] animate-blink" />
          </div>
          <h1 className="font-pixel text-2xl sm:text-4xl lg:text-5xl tracking-tight text-foreground mb-3">
            INTEGRAÇÕES
          </h1>
          <p className="text-xs lg:text-sm text-muted-foreground font-mono max-w-2xl">
            Conecte WordPress, Wix ou Ghost pra publicar artigos direto da plataforma com 1 clique.
            Credenciais ficam encriptadas (AES-256-GCM) e nunca saem do servidor.
          </p>
        </motion.div>

        {/* Grid de plataformas */}
        <div className="grid gap-4 md:grid-cols-3 mb-12">
          {(Object.keys(PLATFORM_INFO) as Platform[]).map((p) => {
            const info = PLATFORM_INFO[p]
            const conns = grouped[p]
            const lastConn = conns
              .map((c) => c.last_used_at)
              .filter(Boolean)
              .sort()
              .reverse()[0]
            return (
              <motion.div
                key={p}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease }}
                className="border-2 border-foreground flex flex-col"
              >
                <div className="flex items-stretch border-b-2 border-foreground">
                  <span
                    aria-hidden="true"
                    className="flex items-center justify-center w-12 text-sm font-pixel tracking-tight"
                    style={{ background: info.markBg, color: info.markFg }}
                  >
                    {info.mark}
                  </span>
                  <div className="flex-1 px-3 py-2 flex flex-col justify-center">
                    <div className="text-sm font-pixel tracking-tight">{info.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
                      {info.tagline}
                    </div>
                  </div>
                  <span
                    className="flex items-center text-[10px] font-mono tracking-widest uppercase px-2 border-l-2 border-foreground"
                    style={{
                      background: conns.length > 0 ? "#10b98115" : "transparent",
                      color: conns.length > 0 ? "#10b981" : undefined,
                    }}
                  >
                    {conns.length > 0
                      ? `${conns.length}${conns.length > 1 ? "x" : ""}`
                      : "—"}
                  </span>
                </div>

                <div className="p-4 flex flex-col gap-3 flex-1">
                  <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">
                    {info.description}
                  </p>

                  {conns.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {conns.slice(0, 3).map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between border border-foreground/15 px-2 py-1.5"
                        >
                          <div className="min-w-0 flex-1 flex items-center gap-2">
                            <CheckCircle2 size={10} className="text-[#10b981] shrink-0" />
                            <span className="text-[11px] font-mono truncate">
                              {c.display_name}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDelete(c.id)}
                            aria-label={`Remover ${c.display_name}`}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      {conns.length > 3 && (
                        <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
                          + {conns.length - 3} outros
                        </span>
                      )}
                      {lastConn && (
                        <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
                          última publicação:{" "}
                          {new Date(lastConn).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  )}

                  <Link
                    href={`/integrations/${p}`}
                    aria-label={
                      conns.length > 0
                        ? `Adicionar outra conexão ${info.name}`
                        : `Conectar ${info.name}`
                    }
                    className="mt-auto inline-flex items-center justify-center gap-2 bg-foreground text-background px-4 py-2 text-[10px] font-mono tracking-widest uppercase hover:bg-[#10b981] transition-colors"
                  >
                    <Plus size={12} />
                    {conns.length > 0 ? "Adicionar outra" : "Conectar"}
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Lista geral */}
        <div className="mb-4 flex items-center gap-4">
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
            {"// CONEXÕES ATIVAS"}
          </span>
          <div className="flex-1 border-t border-border" />
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            {items.length} total
          </span>
        </div>

        {loading ? (
          <div className="border-2 border-foreground/30 px-8 py-12 text-center">
            <Loader2 size={18} className="mx-auto animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="border-2 border-foreground/30 px-8 py-12 text-center flex flex-col items-center">
            <Globe size={28} className="text-muted-foreground/30 mb-4" />
            <p className="text-sm font-mono text-foreground mb-1">
              Você ainda não conectou nenhum site.
            </p>
            <p className="text-[11px] font-mono text-muted-foreground/70 mb-5 max-w-md">
              Cada integração permite publicar artigos com 1 clique direto da edição. Suporte a multi-site em todas as plataformas.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {(Object.keys(PLATFORM_INFO) as Platform[]).map((p) => (
                <Link
                  key={p}
                  href={`/integrations/${p}`}
                  className="inline-flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase border-2 border-foreground px-3 py-2 hover:bg-foreground hover:text-background transition-colors"
                >
                  <Plus size={11} />
                  {PLATFORM_INFO[p].name}
                </Link>
              ))}
            </div>
            <Link
              href="/artigos"
              className="mt-6 inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              ou voltar pra meus artigos
              <ArrowRight size={10} />
            </Link>
          </div>
        ) : (
          <div className="border-2 border-foreground">
            {items.map((it, i) => {
              const info = PLATFORM_INFO[it.platform]
              return (
                <div
                  key={it.id}
                  className={`p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
                    i < items.length - 1 ? "border-b-2 border-foreground" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono tracking-widest uppercase text-[#10b981]">
                        {info.name}
                      </span>
                      <span className="text-sm font-mono font-bold truncate">
                        {it.display_name}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {Boolean(it.metadata?.accountLabel) && (
                        <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                          conta: {String(it.metadata.accountLabel)}
                        </span>
                      )}
                      {it.last_used_at && (
                        <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                          último uso: {new Date(it.last_used_at).toLocaleString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/integrations/${it.platform}`}
                      className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase px-3 py-2 border-2 border-foreground hover:bg-foreground hover:text-background transition-colors"
                    >
                      <ExternalLink size={10} />
                      Gerenciar
                    </Link>
                    <button
                      onClick={() => handleDelete(it.id)}
                      className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase px-3 py-2 border-2 border-destructive/50 text-destructive hover:bg-destructive hover:text-background transition-colors"
                    >
                      <Trash2 size={10} />
                      Remover
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

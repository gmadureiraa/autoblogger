"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, Check, Globe, ExternalLink, AlertCircle, Plug } from "lucide-react"

type Site = {
  id: string
  site_url: string
  username: string
  label: string | null
  default_status: string
}

export function WordPressPublishModal({
  open,
  onClose,
  articleId,
}: {
  open: boolean
  onClose: () => void
  articleId: string
}) {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [status, setStatus] = useState<"draft" | "publish">("draft")
  const [publishing, setPublishing] = useState(false)
  const [result, setResult] = useState<
    | { ok: true; wpPostId: number; wpUrl: string; wpStatus: string }
    | { ok: false; error: string }
    | null
  >(null)

  useEffect(() => {
    if (!open) return
    setResult(null)
    setLoading(true)
    fetch("/api/wordpress/sites", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const list = data.sites ?? []
        setSites(list)
        if (list.length > 0 && !selected) setSelected(list[0].id)
        if (list[0]?.default_status === "publish") setStatus("publish")
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handlePublish = async () => {
    if (!selected) return
    setPublishing(true)
    setResult(null)
    try {
      const res = await fetch("/api/wordpress/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, siteId: selected, status }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setResult({ ok: false, error: data.error ?? "Falha ao publicar" })
      } else {
        setResult({
          ok: true,
          wpPostId: data.wpPostId,
          wpUrl: data.wpUrl,
          wpStatus: data.wpStatus,
        })
      }
    } catch (err) {
      setResult({
        ok: false,
        error: err instanceof Error ? err.message : "Erro de rede",
      })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl bg-background border-2 border-foreground"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground text-background">
              <span className="text-[10px] tracking-[0.2em] uppercase font-mono flex items-center gap-2">
                <Globe size={12} />
                Publicar no WordPress
              </span>
              <button
                onClick={onClose}
                className="text-background/60 hover:text-background transition-colors"
                aria-label="Fechar"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-5">
              {loading ? (
                <div className="py-8 text-center">
                  <Loader2 size={16} className="mx-auto animate-spin text-muted-foreground" />
                </div>
              ) : sites.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <Plug size={24} className="text-muted-foreground/40" />
                  <p className="text-sm font-mono text-muted-foreground">
                    Voce nao tem nenhum site WordPress conectado ainda.
                  </p>
                  <Link
                    href="/integrations/wordpress"
                    className="flex items-center gap-2 bg-foreground text-background px-4 py-2 text-xs font-mono tracking-widest uppercase hover:bg-[#10b981] transition-colors"
                    onClick={onClose}
                  >
                    <Plug size={12} />
                    Conectar WordPress
                  </Link>
                </div>
              ) : result?.ok ? (
                <div className="flex flex-col items-start gap-3">
                  <div className="flex items-center gap-2 text-[#10b981]">
                    <Check size={14} />
                    <span className="text-sm font-mono font-bold">
                      Publicado com sucesso!
                    </span>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    WP Post ID: {result.wpPostId} · status: {result.wpStatus}
                  </div>
                  <a
                    href={result.wpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-mono text-[#10b981] hover:underline"
                  >
                    <ExternalLink size={12} />
                    Abrir no WordPress
                  </a>
                </div>
              ) : (
                <>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                    Site de destino
                  </label>
                  <div className="flex flex-col border-2 border-foreground mb-4">
                    {sites.map((s) => {
                      const host = (() => {
                        try {
                          return new URL(s.site_url).hostname
                        } catch {
                          return s.site_url
                        }
                      })()
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-foreground/20 last:border-b-0 transition-colors ${
                            selected === s.id ? "bg-foreground/10" : "hover:bg-foreground/5"
                          }`}
                        >
                          <input
                            type="radio"
                            name="wp-site"
                            checked={selected === s.id}
                            onChange={() => setSelected(s.id)}
                            className="accent-[#10b981]"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-mono font-bold">
                              {s.label || host}
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground">
                              {s.site_url} · user: {s.username}
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>

                  <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                    Status no WordPress
                  </label>
                  <div className="flex gap-0 mb-5">
                    {(["draft", "publish"] as const).map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`px-4 py-2 text-xs font-mono tracking-widest uppercase border-2 border-foreground -ml-[2px] first:ml-0 transition-colors ${
                          status === s
                            ? "bg-[#10b981] text-background border-[#10b981]"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {s === "draft" ? "Rascunho" : "Publicado"}
                      </button>
                    ))}
                  </div>

                  {result && !result.ok && (
                    <div className="border-2 border-destructive bg-destructive/10 px-4 py-2.5 mb-4 flex items-center gap-2 text-destructive">
                      <AlertCircle size={14} />
                      <span className="text-xs font-mono">{result.error}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePublish}
                      disabled={!selected || publishing}
                      className="flex items-center gap-0 bg-foreground text-background text-sm font-mono tracking-wider uppercase disabled:opacity-50 disabled:cursor-wait"
                    >
                      <span className="flex items-center justify-center w-10 h-10 bg-[#10b981]">
                        {publishing ? (
                          <Loader2 size={16} className="animate-spin text-background" />
                        ) : (
                          <Globe size={16} className="text-background" />
                        )}
                      </span>
                      <span className="px-5 py-2.5">
                        {publishing ? "Publicando..." : "Publicar agora"}
                      </span>
                    </button>
                    <Link
                      href="/integrations/wordpress"
                      className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                    >
                      + novo site
                    </Link>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

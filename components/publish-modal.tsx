"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  X,
  Loader2,
  Check,
  Globe,
  ExternalLink,
  AlertCircle,
  Plug,
  Send,
} from "lucide-react"

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

const PLATFORM_LABEL: Record<Platform, string> = {
  wordpress: "WordPress",
  wix: "Wix",
  ghost: "Ghost",
}

/**
 * Modal genérico de publicação. Lista todas as integrações ativas do user e
 * permite escolher destino + status pra disparar /api/integrations/[id]/publish.
 *
 * Substitui o antigo `wordpress-publish-modal.tsx` que era específico de WP.
 */
export function PublishModal({
  open,
  onClose,
  articleId,
}: {
  open: boolean
  onClose: () => void
  articleId: string
}) {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [status, setStatus] = useState<"draft" | "publish">("draft")
  const [publishing, setPublishing] = useState(false)
  const [result, setResult] = useState<
    | { ok: true; url: string; status: string; platform: Platform }
    | { ok: false; error: string }
    | null
  >(null)
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    setResult(null)
    setLoading(true)
    fetch("/api/integrations", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const list: Integration[] = data.integrations ?? []
        setIntegrations(list)
        if (list.length > 0) setSelected(list[0].id)
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // ESC pra fechar + focus trap básico + restaura foco original ao fechar
  useEffect(() => {
    if (!open) return
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null

    const t = setTimeout(() => {
      const node = dialogRef.current?.querySelector<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      )
      node?.focus()
    }, 30)

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== "Tab" || !dialogRef.current) return
      const focusables = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
        )
      ).filter((el) => !el.hasAttribute("aria-hidden"))
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", handleKey)
    return () => {
      clearTimeout(t)
      document.removeEventListener("keydown", handleKey)
      previouslyFocusedRef.current?.focus?.()
    }
  }, [open, onClose])

  const handlePublish = async () => {
    if (!selected) return
    setPublishing(true)
    setResult(null)
    try {
      const res = await fetch(`/api/integrations/${selected}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, status }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        const errMsg = data.error ?? "Falha ao publicar"
        setResult({ ok: false, error: errMsg })
        toast.error("Falha ao publicar", { description: errMsg })
      } else {
        setResult({
          ok: true,
          url: data.url,
          status: data.status,
          platform: data.platform,
        })
        toast.success(`Publicado em ${PLATFORM_LABEL[data.platform as Platform] ?? data.platform}`, {
          description: data.status === "publish" ? "Post ao vivo agora." : "Salvo como rascunho na plataforma.",
        })
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Erro de rede"
      setResult({ ok: false, error: errMsg })
      toast.error("Erro de conexao", { description: errMsg })
    } finally {
      setPublishing(false)
    }
  }

  const selectedIntegration = integrations.find((i) => i.id === selected)

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
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl bg-background border-2 border-foreground"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground text-background">
              <span
                id={titleId}
                className="text-[10px] tracking-[0.2em] uppercase font-mono flex items-center gap-2"
              >
                <Send size={12} />
                Publicar artigo
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
                  <Loader2
                    size={16}
                    className="mx-auto animate-spin text-muted-foreground"
                  />
                </div>
              ) : integrations.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <Plug size={24} className="text-muted-foreground/40" />
                  <p className="text-sm font-mono text-muted-foreground">
                    Você não conectou nenhuma plataforma ainda.
                  </p>
                  <Link
                    href="/integrations"
                    className="flex items-center gap-2 bg-foreground text-background px-4 py-2 text-xs font-mono tracking-widest uppercase hover:bg-[#10b981] transition-colors"
                    onClick={onClose}
                  >
                    <Plug size={12} />
                    Conectar agora
                  </Link>
                </div>
              ) : result?.ok ? (
                <div className="flex flex-col items-start gap-3">
                  <div className="flex items-center gap-2 text-[#10b981]">
                    <Check size={14} />
                    <span className="text-sm font-mono font-bold">
                      Publicado em {PLATFORM_LABEL[result.platform]}!
                    </span>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    Status: {result.status}
                  </div>
                  {result.url && !result.url.startsWith("wix://") && (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs font-mono text-[#10b981] hover:underline"
                    >
                      <ExternalLink size={12} />
                      Abrir post publicado
                    </a>
                  )}
                </div>
              ) : (
                <>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                    Destino
                  </label>
                  <div className="flex flex-col border-2 border-foreground mb-4 max-h-64 overflow-y-auto">
                    {integrations.map((it) => (
                      <label
                        key={it.id}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-foreground/20 last:border-b-0 transition-colors ${
                          selected === it.id ? "bg-foreground/10" : "hover:bg-foreground/5"
                        }`}
                      >
                        <input
                          type="radio"
                          name="integration"
                          checked={selected === it.id}
                          onChange={() => setSelected(it.id)}
                          className="accent-[#10b981]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono tracking-widest uppercase text-[#10b981]">
                              {PLATFORM_LABEL[it.platform]}
                            </span>
                            <span className="text-sm font-mono font-bold truncate">
                              {it.display_name}
                            </span>
                          </div>
                          {Boolean(it.metadata?.accountLabel) && (
                            <div className="text-[10px] font-mono text-muted-foreground truncate">
                              {String(it.metadata.accountLabel)}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                    Status na plataforma
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
                        {s === "draft" ? "Rascunho" : "Publicar agora"}
                      </button>
                    ))}
                  </div>

                  {selectedIntegration?.platform === "wix" && (
                    <div className="border-2 border-[#eab308]/50 bg-[#eab308]/10 px-3 py-2 mb-4">
                      <span className="text-[10px] font-mono text-foreground">
                        Wix: o conteúdo é enviado como bloco HTML simples. Pra layout
                        nativo Ricos, edite no admin Wix depois.
                      </span>
                    </div>
                  )}

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
                      href="/integrations"
                      className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                    >
                      + nova conexão
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

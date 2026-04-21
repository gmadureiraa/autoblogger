"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  Copy,
  Check,
  Trash2,
  FileText,
  Search,
  Edit3,
  Copy as CopyIcon,
  PenLine,
  Globe,
  Archive,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  listPosts,
  deletePost,
  duplicatePost,
  updatePost,
  postToMarkdown,
  downloadBlob,
  type StoredPost,
} from "@/lib/posts-store"

const ease = [0.22, 1, 0.36, 1] as const

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors px-2 py-1 border border-border hover:border-foreground"
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {label || "Copiar"}
    </button>
  )
}

function statusColor(status: StoredPost["status"]) {
  if (status === "published") return "#10b981"
  if (status === "archived") return "#6b7280"
  return "#eab308"
}

function statusLabel(status: StoredPost["status"]) {
  if (status === "published") return "Publicado"
  if (status === "archived") return "Arquivado"
  return "Rascunho"
}

export default function ArtigosPage() {
  const { user, supabaseConfigured, loading: authLoading } = useAuth()
  const authed = Boolean(user) && supabaseConfigured

  const [posts, setPosts] = useState<StoredPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | StoredPost["status"]>("all")

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const data = await listPosts({ authed })
      if (!cancelled) {
        setPosts(data)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [authed, authLoading])

  const handleDelete = async (id: string) => {
    if (!confirm("Deletar esse artigo?")) return
    await deletePost(id, { authed })
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  const handleDuplicate = async (id: string) => {
    const dup = await duplicatePost(id, { authed })
    if (dup) setPosts((prev) => [dup, ...prev])
  }

  const handleStatus = async (id: string, status: StoredPost["status"]) => {
    const updated = await updatePost(id, { status }, { authed })
    if (updated) setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)))
  }

  const handleExport = (post: StoredPost) => {
    const md = postToMarkdown(post)
    const fname = `${(post.slug || post.title).replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.md`
    downloadBlob(fname, md)
  }

  const filtered = useMemo(() => {
    return posts.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false
      if (!search) return true
      const hay = `${a.title} ${a.excerpt ?? ""} ${a.meta?.sourceInput ?? ""}`.toLowerCase()
      return hay.includes(search.toLowerCase())
    })
  }, [posts, statusFilter, search])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })
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
                href="/gerar"
                className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase hover:text-foreground transition-colors"
              >
                Gerar Artigo
              </Link>
              <Link
                href="/settings"
                className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase hover:text-foreground transition-colors"
              >
                Settings
              </Link>
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                {posts.length} artigo{posts.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </nav>
      </div>

      <main className="w-full px-6 py-12 lg:px-12 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
              {"// AUTOBLOGGER: MEUS_ARTIGOS"}
            </span>
            <div className="flex-1 border-t border-border" />
            <span className="inline-block h-2 w-2 bg-[#10b981] animate-blink" />
          </div>

          <h1 className="font-pixel text-2xl sm:text-4xl lg:text-5xl tracking-tight text-foreground mb-3">
            MEUS ARTIGOS
          </h1>
          <p className="text-xs lg:text-sm text-muted-foreground font-mono">
            {authed
              ? `${posts.length} artigos salvos no Supabase.`
              : `${posts.length} artigos salvos no navegador.`}
          </p>
        </motion.div>

        {posts.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-0 mb-6">
            <div className="flex items-center gap-0 flex-1 border-2 border-foreground">
              <span className="flex items-center justify-center w-10 h-10 bg-foreground">
                <Search size={14} className="text-background" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar artigos..."
                className="flex-1 bg-transparent px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
            </div>
            <div className="flex gap-0 -mt-[2px] sm:mt-0 sm:-ml-[2px]">
              {(["all", "draft", "published", "archived"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2.5 text-[10px] font-mono tracking-widest uppercase border-2 border-foreground -ml-[2px] first:ml-0 transition-colors ${
                    statusFilter === s
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s === "all" ? "Todos" : statusLabel(s)}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="border-2 border-foreground/30 px-8 py-16 text-center">
            <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
              Carregando...
            </span>
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-2 border-foreground/30 px-8 py-16 text-center"
          >
            <FileText size={32} className="text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm font-mono text-muted-foreground mb-4">
              Nenhum artigo salvo ainda.
            </p>
            <Link
              href="/gerar"
              className="text-xs font-mono text-[#10b981] hover:underline tracking-widest uppercase"
            >
              Gerar primeiro artigo →
            </Link>
          </motion.div>
        ) : (
          <div className="border-2 border-foreground">
            <div className="hidden md:grid grid-cols-[1fr_90px_80px_80px_140px] gap-0 px-5 py-2 border-b-2 border-foreground bg-foreground text-background">
              <span className="text-[10px] font-mono tracking-widest uppercase">Titulo</span>
              <span className="text-[10px] font-mono tracking-widest uppercase text-center">Status</span>
              <span className="text-[10px] font-mono tracking-widest uppercase text-center">Data</span>
              <span className="text-[10px] font-mono tracking-widest uppercase text-center">SEO</span>
              <span className="text-[10px] font-mono tracking-widest uppercase text-right">Acoes</span>
            </div>

            <AnimatePresence initial={false}>
              {filtered.map((art, i) => (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: i * 0.02, duration: 0.25, ease }}
                  className="grid grid-cols-1 md:grid-cols-[1fr_90px_80px_80px_140px] gap-2 md:gap-0 px-5 py-3 border-b border-foreground/20 last:border-b-0 hover:bg-foreground/5 transition-colors group"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <Link
                      href={`/artigos/${art.id}`}
                      className="text-xs font-mono font-bold truncate group-hover:text-[#10b981] transition-colors"
                    >
                      {art.title}
                    </Link>
                    <span className="text-[10px] font-mono text-muted-foreground truncate">
                      {art.excerpt || art.meta?.sourceInput || "Sem descricao"}
                    </span>
                  </div>
                  <span className="hidden md:flex items-center justify-center">
                    <span
                      className="text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 border"
                      style={{ color: statusColor(art.status), borderColor: statusColor(art.status) }}
                    >
                      {statusLabel(art.status)}
                    </span>
                  </span>
                  <span className="hidden md:flex items-center justify-center text-[10px] font-mono text-muted-foreground">
                    {formatDate(art.created_at)}
                  </span>
                  <span className="hidden md:flex items-center justify-center">
                    <span
                      className="text-[10px] font-mono font-bold"
                      style={{
                        color:
                          (art.meta?.seoScore ?? 0) >= 80
                            ? "#10b981"
                            : (art.meta?.seoScore ?? 0) >= 60
                              ? "#eab308"
                              : "#ef4444",
                      }}
                    >
                      {art.meta?.seoScore ?? "—"}
                    </span>
                  </span>
                  <div className="hidden md:flex items-center justify-end gap-1">
                    <Link
                      href={`/artigos/${art.id}`}
                      className="text-muted-foreground/50 hover:text-foreground transition-colors p-1.5 border border-transparent hover:border-foreground/30"
                      title="Editar"
                    >
                      <Edit3 size={12} />
                    </Link>
                    <button
                      onClick={() => handleExport(art)}
                      className="text-muted-foreground/50 hover:text-foreground transition-colors p-1.5 border border-transparent hover:border-foreground/30"
                      title="Exportar MD"
                    >
                      <FileText size={12} />
                    </button>
                    <button
                      onClick={() => handleDuplicate(art.id)}
                      className="text-muted-foreground/50 hover:text-foreground transition-colors p-1.5 border border-transparent hover:border-foreground/30"
                      title="Duplicar"
                    >
                      <CopyIcon size={12} />
                    </button>
                    <button
                      onClick={() =>
                        handleStatus(art.id, art.status === "published" ? "draft" : "published")
                      }
                      className="text-muted-foreground/50 hover:text-[#10b981] transition-colors p-1.5 border border-transparent hover:border-[#10b981]/30"
                      title={art.status === "published" ? "Voltar pra rascunho" : "Publicar"}
                    >
                      {art.status === "published" ? <PenLine size={12} /> : <Globe size={12} />}
                    </button>
                    <button
                      onClick={() =>
                        handleStatus(art.id, art.status === "archived" ? "draft" : "archived")
                      }
                      className="text-muted-foreground/50 hover:text-foreground transition-colors p-1.5 border border-transparent hover:border-foreground/30"
                      title={art.status === "archived" ? "Desarquivar" : "Arquivar"}
                    >
                      <Archive size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(art.id)}
                      className="text-muted-foreground/30 hover:text-destructive transition-colors p-1.5 border border-transparent hover:border-destructive/30"
                      title="Deletar"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Mobile actions */}
                  <div className="flex md:hidden items-center gap-2 mt-2">
                    <Link
                      href={`/artigos/${art.id}`}
                      className="text-[10px] font-mono tracking-widest uppercase text-[#10b981]"
                    >
                      Editar
                    </Link>
                    <span className="text-muted-foreground/30">|</span>
                    <button
                      onClick={() => handleExport(art)}
                      className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground"
                    >
                      Exportar
                    </button>
                    <span className="text-muted-foreground/30">|</span>
                    <button
                      onClick={() => handleDelete(art.id)}
                      className="text-[10px] font-mono tracking-widest uppercase text-destructive"
                    >
                      Deletar
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filtered.length === 0 && (
              <div className="px-5 py-8 text-center">
                <span className="text-xs font-mono text-muted-foreground">
                  Nenhum artigo encontrado{search ? ` para "${search}"` : ""}.
                </span>
              </div>
            )}
          </div>
        )}

        {posts.length > 0 && (
          <div className="mt-6 flex items-center justify-between text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            <span>
              Total: {posts.length} | Rascunhos:{" "}
              {posts.filter((p) => p.status === "draft").length} | Publicados:{" "}
              {posts.filter((p) => p.status === "published").length}
            </span>
            <CopyButton
              text={JSON.stringify(posts, null, 2)}
              label="Copiar JSON (todos)"
            />
          </div>
        )}
      </main>
    </div>
  )
}

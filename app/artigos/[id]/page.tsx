"use client"

import { useEffect, useState, useCallback, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ChevronLeft,
  Save,
  Check,
  FileText,
  Copy,
  Trash2,
  Globe,
  Archive,
  PenLine,
  Eye,
  EyeOff,
  Send,
} from "lucide-react"
import { useUser } from "@clerk/nextjs"
import {
  getPost,
  updatePost,
  deletePost,
  postToMarkdown,
  downloadBlob,
  type StoredPost,
} from "@/lib/posts-store"
import { htmlToMarkdown, slugify, wordCountFromHtml } from "@/lib/markdown"
import { WordPressPublishModal } from "@/components/wordpress-publish-modal"

const ease = [0.22, 1, 0.36, 1] as const

export default function ArtigoEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { isSignedIn, isLoaded } = useUser()
  const authLoading = !isLoaded
  const authed = Boolean(isSignedIn)
  const router = useRouter()

  const [post, setPost] = useState<StoredPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState("")
  const [wpModalOpen, setWpModalOpen] = useState(false)

  // Campos editaveis
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [markdown, setMarkdown] = useState("")
  const [status, setStatus] = useState<StoredPost["status"]>("draft")
  const [tags, setTags] = useState("")

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const p = await getPost(id, { authed })
      if (cancelled) return
      if (!p) {
        setError("Artigo nao encontrado")
        setLoading(false)
        return
      }
      setPost(p)
      setTitle(p.title)
      setSlug(p.slug ?? slugify(p.title))
      setExcerpt(p.excerpt ?? "")
      setMarkdown(p.body_markdown ?? (p.body_html ? htmlToMarkdown(p.body_html) : ""))
      setStatus(p.status)
      const existingTags =
        (p.meta?.tags as string[] | undefined) ??
        (p.meta?.internalLinks as string[] | undefined) ??
        []
      setTags(existingTags.join(", "))
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [id, authed, authLoading])

  const handleSave = useCallback(
    async (nextStatus?: StoredPost["status"]) => {
      if (!post) return
      setSaving(true)
      setError("")
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      const patch = {
        title,
        slug: slug || slugify(title),
        excerpt: excerpt || null,
        body_markdown: markdown,
        status: nextStatus ?? status,
        meta: {
          ...post.meta,
          tags: tagList,
          wordCount:
            markdown.replace(/[*_`#>-]/g, "").split(/\s+/).filter(Boolean).length ||
            wordCountFromHtml(post.body_html ?? ""),
        },
      }

      try {
        const updated = await updatePost(post.id, patch, { authed })
        if (updated) {
          setPost(updated)
          if (nextStatus) setStatus(nextStatus)
          setSaved(true)
          setTimeout(() => setSaved(false), 2500)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar")
      } finally {
        setSaving(false)
      }
    },
    [post, title, slug, excerpt, markdown, status, tags, authed]
  )

  const handleDelete = async () => {
    if (!post) return
    if (!confirm("Deletar esse artigo? Nao da pra desfazer.")) return
    await deletePost(post.id, { authed })
    router.push("/artigos")
  }

  const handleExportMd = () => {
    if (!post) return
    const md = postToMarkdown({
      ...post,
      title,
      slug: slug || slugify(title),
      excerpt,
      body_markdown: markdown,
      status,
      meta: {
        ...post.meta,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      },
    })
    const fname = `${(slug || slugify(title)).toLowerCase()}.md`
    downloadBlob(fname, md)
  }

  const handleExportJson = () => {
    if (!post) return
    const json = JSON.stringify(
      {
        ...post,
        title,
        slug: slug || slugify(title),
        excerpt,
        body_markdown: markdown,
        status,
        meta: {
          ...post.meta,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        },
      },
      null,
      2
    )
    const fname = `${(slug || slugify(title)).toLowerCase()}.json`
    downloadBlob(fname, json, "application/json")
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen dot-grid-bg flex items-center justify-center">
        <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
          Carregando artigo...
        </span>
      </div>
    )
  }

  if (error && !post) {
    return (
      <div className="min-h-screen dot-grid-bg flex flex-col items-center justify-center gap-4 p-6">
        <span className="text-sm font-mono text-destructive">{error}</span>
        <Link
          href="/artigos"
          className="text-xs font-mono text-[#10b981] tracking-widest uppercase hover:underline"
        >
          Voltar para meus artigos
        </Link>
      </div>
    )
  }

  if (!post) return null

  const wordCount = markdown.split(/\s+/).filter(Boolean).length

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
                Meus Artigos
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 border"
                style={{
                  color:
                    status === "published"
                      ? "#10b981"
                      : status === "archived"
                        ? "#6b7280"
                        : "#eab308",
                  borderColor:
                    status === "published"
                      ? "#10b981"
                      : status === "archived"
                        ? "#6b7280"
                        : "#eab308",
                }}
              >
                {status === "published"
                  ? "Publicado"
                  : status === "archived"
                    ? "Arquivado"
                    : "Rascunho"}
              </span>
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
              {"// AUTOBLOGGER: EDITAR_ARTIGO"}
            </span>
            <div className="flex-1 border-t border-border" />
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
              {wordCount} palavras
            </span>
          </div>

          <h1 className="font-pixel text-xl sm:text-3xl tracking-tight text-foreground mb-3">
            EDITAR ARTIGO
          </h1>
        </motion.div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-0 mb-4 border-2 border-foreground bg-foreground text-background">
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono tracking-widest uppercase hover:bg-[#10b981] transition-colors disabled:opacity-50"
          >
            {saved ? <Check size={12} /> : <Save size={12} />}
            {saving ? "Salvando..." : saved ? "Salvo" : "Salvar"}
          </button>
          <button
            onClick={() => setPreview((p) => !p)}
            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono tracking-widest uppercase border-l border-background/20 hover:bg-background/10 transition-colors"
          >
            {preview ? <EyeOff size={12} /> : <Eye size={12} />}
            {preview ? "Editar" : "Preview"}
          </button>
          <button
            onClick={handleExportMd}
            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono tracking-widest uppercase border-l border-background/20 hover:bg-background/10 transition-colors"
          >
            <FileText size={12} />
            Export MD
          </button>
          <button
            onClick={handleExportJson}
            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono tracking-widest uppercase border-l border-background/20 hover:bg-background/10 transition-colors"
          >
            <FileText size={12} />
            Export JSON
          </button>
          <button
            onClick={() => handleCopy(markdown)}
            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono tracking-widest uppercase border-l border-background/20 hover:bg-background/10 transition-colors"
          >
            <Copy size={12} />
            Copiar MD
          </button>
          <button
            onClick={() =>
              handleSave(status === "published" ? "draft" : "published")
            }
            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono tracking-widest uppercase border-l border-background/20 hover:bg-background/10 transition-colors"
          >
            {status === "published" ? <PenLine size={12} /> : <Globe size={12} />}
            {status === "published" ? "Voltar pra draft" : "Publicar"}
          </button>
          <button
            onClick={() => handleSave(status === "archived" ? "draft" : "archived")}
            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono tracking-widest uppercase border-l border-background/20 hover:bg-background/10 transition-colors"
          >
            <Archive size={12} />
            {status === "archived" ? "Desarquivar" : "Arquivar"}
          </button>
          <div className="flex-1" />
          {authed && (
            <button
              onClick={() => setWpModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono tracking-widest uppercase border-l border-background/20 hover:bg-[#10b981] transition-colors"
              title="Publicar no WordPress"
            >
              <Send size={12} />
              WordPress
            </button>
          )}
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono tracking-widest uppercase border-l border-background/20 hover:bg-destructive transition-colors"
          >
            <Trash2 size={12} />
            Deletar
          </button>
        </div>

        <WordPressPublishModal
          open={wpModalOpen}
          onClose={() => setWpModalOpen(false)}
          articleId={post.id}
        />

        {error && (
          <div className="border-2 border-destructive bg-destructive/10 px-4 py-2 mb-4">
            <span className="text-xs font-mono text-destructive">{error}</span>
          </div>
        )}

        {/* Metadados */}
        <div className="border-2 border-foreground mb-4">
          <div className="px-4 py-3 border-b-2 border-foreground bg-foreground/5">
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
              Metadados SEO
            </span>
          </div>
          <div className="p-4 grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                Titulo
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-2 border-foreground px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#10b981] transition-colors"
              />
              <div className="text-[10px] font-mono text-muted-foreground mt-1">
                {title.length} caracteres {title.length > 60 && "— considera encurtar"}
              </div>
            </div>
            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-transparent border-2 border-foreground px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#10b981] transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                Tags (separadas por virgula)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="bitcoin, defi, guia"
                className="w-full bg-transparent border-2 border-foreground px-3 py-2 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#10b981] transition-colors"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                Meta description
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                className="w-full bg-transparent border-2 border-foreground px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#10b981] transition-colors resize-none"
              />
              <div className="text-[10px] font-mono text-muted-foreground mt-1">
                {excerpt.length} caracteres {excerpt.length > 155 && "— meta ideal ate 155"}
              </div>
            </div>
          </div>
        </div>

        {/* Editor / Preview */}
        <div className="border-2 border-foreground">
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-foreground bg-foreground/5">
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
              {preview ? "Preview" : "Corpo em Markdown"}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {wordCount} palavras
            </span>
          </div>
          {preview ? (
            <div className="p-6 prose prose-sm max-w-none font-mono">
              <MarkdownPreview markdown={markdown} title={title} excerpt={excerpt} />
            </div>
          ) : (
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              rows={24}
              placeholder="# Seu artigo em markdown..."
              className="w-full bg-transparent px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none resize-y min-h-[400px]"
            />
          )}
        </div>

        {/* SEO info */}
        {post.meta?.seoScore !== undefined && (
          <div className="mt-4 border-2 border-foreground/30 px-4 py-3 flex items-center gap-3">
            <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
              SEO Score original
            </span>
            <div className="flex-1 h-1 bg-foreground/10">
              <div
                className="h-full"
                style={{
                  width: `${post.meta.seoScore}%`,
                  backgroundColor:
                    (post.meta.seoScore as number) >= 80
                      ? "#10b981"
                      : (post.meta.seoScore as number) >= 60
                        ? "#eab308"
                        : "#ef4444",
                }}
              />
            </div>
            <span className="text-xs font-mono font-bold">{post.meta.seoScore as number}/100</span>
          </div>
        )}
      </main>
    </div>
  )
}

function MarkdownPreview({
  markdown,
  title,
  excerpt,
}: {
  markdown: string
  title: string
  excerpt: string
}) {
  // Preview minimal: renderiza headings e paragrafos basicos do MD.
  const html = markdownToSimpleHtml(markdown)
  return (
    <div className="[&_h1]:font-pixel [&_h1]:text-2xl [&_h1]:mb-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-[#10b981] [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-3 [&_p]:text-muted-foreground [&_strong]:text-foreground [&_ul]:ml-4 [&_ul]:mb-3 [&_li]:text-sm [&_li]:text-muted-foreground [&_li]:mb-1 [&_a]:text-[#10b981] [&_a]:underline">
      <h1>{title}</h1>
      {excerpt && <p className="italic">{excerpt}</p>}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

function markdownToSimpleHtml(md: string): string {
  // Conversor markdown minimal pro preview — nao perfeito mas suficiente.
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  const lines = md.split("\n")
  const out: string[] = []
  let inList = false

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line) {
      if (inList) {
        out.push("</ul>")
        inList = false
      }
      out.push("")
      continue
    }

    const h3 = line.match(/^### (.+)/)
    const h2 = line.match(/^## (.+)/)
    const h1 = line.match(/^# (.+)/)
    const bullet = line.match(/^[-*] (.+)/)

    if (h1 || h2 || h3) {
      if (inList) {
        out.push("</ul>")
        inList = false
      }
      if (h1) out.push(`<h1>${inline(escape(h1[1]))}</h1>`)
      if (h2) out.push(`<h2>${inline(escape(h2[1]))}</h2>`)
      if (h3) out.push(`<h3>${inline(escape(h3[1]))}</h3>`)
      continue
    }

    if (bullet) {
      if (!inList) {
        out.push("<ul>")
        inList = true
      }
      out.push(`<li>${inline(escape(bullet[1]))}</li>`)
      continue
    }

    if (inList) {
      out.push("</ul>")
      inList = false
    }

    out.push(`<p>${inline(escape(line))}</p>`)
  }
  if (inList) out.push("</ul>")

  return out.join("\n")
}

function inline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/`(.+?)`/g, "<code>$1</code>")
}

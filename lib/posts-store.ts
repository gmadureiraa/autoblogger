"use client"

import { apiFetch } from "@/lib/api-client"
import { htmlToMarkdown, slugify, wordCountFromHtml } from "@/lib/markdown"

/**
 * Camada unificada de CRUD de posts.
 * Se o user esta autenticado (Clerk) => API /api/posts (Neon).
 * Caso contrario => localStorage (compat com o MVP anonimo).
 */

export type StoredPost = {
  id: string
  user_id?: string
  title: string
  slug: string | null
  excerpt: string | null
  body_html: string | null
  body_markdown: string | null
  meta: {
    headings?: string[]
    internalLinks?: string[]
    seoScore?: number
    tips?: string[]
    wordCount?: number
    mode?: string
    sourceInput?: string
    tone?: string
    [key: string]: unknown
  }
  status: "draft" | "published" | "archived"
  created_at: string
  updated_at: string
}

export type LegacySavedArticle = {
  id: string
  title: string
  metaDescription: string
  headings: string[]
  body: string
  internalLinks: string[]
  seoScore: number
  tips: string[]
  createdAt: string
  topic: string
  tone: string
  wordCount: number
}

const LEGACY_KEY = "autoblogger_articles"
const STORE_KEY = "autoblogger_posts_v2"

function readLocalPosts(): StoredPost[] {
  if (typeof window === "undefined") return []
  try {
    const v2 = localStorage.getItem(STORE_KEY)
    if (v2) return JSON.parse(v2) as StoredPost[]

    // Migra o formato antigo pro novo na primeira leitura.
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const articles = JSON.parse(legacy) as LegacySavedArticle[]
      const migrated: StoredPost[] = articles.map((a) => ({
        id: a.id,
        title: a.title,
        slug: slugify(a.title),
        excerpt: a.metaDescription,
        body_html: a.body,
        body_markdown: htmlToMarkdown(a.body),
        meta: {
          headings: a.headings,
          internalLinks: a.internalLinks,
          seoScore: a.seoScore,
          tips: a.tips,
          wordCount: a.wordCount || wordCountFromHtml(a.body),
          sourceInput: a.topic,
          tone: a.tone,
        },
        status: "draft",
        created_at: a.createdAt,
        updated_at: a.createdAt,
      }))
      localStorage.setItem(STORE_KEY, JSON.stringify(migrated))
      return migrated
    }
  } catch {}
  return []
}

function writeLocalPosts(posts: StoredPost[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(posts))
  } catch {}
}

function newLocalId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function shouldUseRemote(authed: boolean) {
  return authed
}

// ---------- API publica ----------

export async function listPosts(opts: { authed: boolean; status?: string } = { authed: false }) {
  if (shouldUseRemote(opts.authed)) {
    const qs = opts.status ? `?status=${encodeURIComponent(opts.status)}` : ""
    const res = await apiFetch(`/api/posts${qs}`)
    if (!res.ok) return readLocalPosts()
    const data = await res.json()
    return (data.posts ?? []) as StoredPost[]
  }
  return readLocalPosts()
}

export async function getPost(id: string, opts: { authed: boolean }) {
  if (shouldUseRemote(opts.authed)) {
    const res = await apiFetch(`/api/posts/${id}`)
    if (res.ok) {
      const data = await res.json()
      return data.post as StoredPost
    }
  }
  return readLocalPosts().find((p) => p.id === id) ?? null
}

type CreateInput = {
  title: string
  slug?: string | null
  excerpt?: string | null
  body_html?: string | null
  body_markdown?: string | null
  meta?: Record<string, unknown>
  status?: "draft" | "published" | "archived"
}

export async function createPost(input: CreateInput, opts: { authed: boolean }) {
  const payload = {
    ...input,
    slug: input.slug ?? slugify(input.title),
    body_markdown:
      input.body_markdown ?? (input.body_html ? htmlToMarkdown(input.body_html) : null),
    meta: input.meta ?? {},
    status: input.status ?? "draft",
  }

  if (shouldUseRemote(opts.authed)) {
    const res = await apiFetch(`/api/posts`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const data = await res.json()
      return data.post as StoredPost
    }
  }

  const now = new Date().toISOString()
  const local: StoredPost = {
    id: newLocalId(),
    title: payload.title,
    slug: payload.slug ?? null,
    excerpt: payload.excerpt ?? null,
    body_html: payload.body_html ?? null,
    body_markdown: payload.body_markdown ?? null,
    meta: payload.meta as StoredPost["meta"],
    status: payload.status,
    created_at: now,
    updated_at: now,
  }
  const all = readLocalPosts()
  all.unshift(local)
  writeLocalPosts(all)
  return local
}

export async function updatePost(
  id: string,
  patch: Partial<CreateInput>,
  opts: { authed: boolean }
) {
  if (shouldUseRemote(opts.authed)) {
    const res = await apiFetch(`/api/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const data = await res.json()
      return data.post as StoredPost
    }
  }

  const all = readLocalPosts()
  const idx = all.findIndex((p) => p.id === id)
  if (idx < 0) return null
  all[idx] = {
    ...all[idx],
    ...patch,
    meta: { ...all[idx].meta, ...(patch.meta as Record<string, unknown> | undefined) },
    updated_at: new Date().toISOString(),
  } as StoredPost
  writeLocalPosts(all)
  return all[idx]
}

export async function deletePost(id: string, opts: { authed: boolean }) {
  if (shouldUseRemote(opts.authed)) {
    const res = await apiFetch(`/api/posts/${id}`, { method: "DELETE" })
    if (res.ok) return true
  }
  const all = readLocalPosts().filter((p) => p.id !== id)
  writeLocalPosts(all)
  return true
}

export async function duplicatePost(id: string, opts: { authed: boolean }) {
  const post = await getPost(id, opts)
  if (!post) return null
  return createPost(
    {
      title: `${post.title} (copia)`,
      excerpt: post.excerpt,
      body_html: post.body_html,
      body_markdown: post.body_markdown,
      meta: post.meta,
      status: "draft",
    },
    opts
  )
}

// ---------- Export helpers ----------

export function postToMarkdown(post: StoredPost): string {
  const frontMatter: string[] = ["---"]
  frontMatter.push(`title: "${post.title.replace(/"/g, '\\"')}"`)
  if (post.excerpt) frontMatter.push(`description: "${post.excerpt.replace(/"/g, '\\"')}"`)
  if (post.slug) frontMatter.push(`slug: ${post.slug}`)
  frontMatter.push(`status: ${post.status}`)
  frontMatter.push(`date: ${post.created_at}`)
  const tags = (post.meta?.tags as string[] | undefined) ?? (post.meta?.internalLinks as string[] | undefined) ?? []
  if (tags.length) frontMatter.push(`tags: [${tags.map((t) => `"${t}"`).join(", ")}]`)
  frontMatter.push("---")

  const body = post.body_markdown || (post.body_html ? htmlToMarkdown(post.body_html) : "")
  return `${frontMatter.join("\n")}\n\n# ${post.title}\n\n${post.excerpt ? `> ${post.excerpt}\n\n` : ""}${body}`
}

export function downloadBlob(filename: string, content: string, type = "text/markdown") {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

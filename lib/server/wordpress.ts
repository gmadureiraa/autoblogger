/**
 * WordPress REST API client — publica posts usando Basic Auth com
 * Application Password (criada em WP Admin → Users → Profile → Application Passwords).
 *
 * Zero dependencias externas: fetch nativo.
 */

export type WordPressCredentials = {
  siteUrl: string
  username: string
  appPassword: string
}

export type WordPressUser = {
  id: number
  name: string
  slug: string
  roles?: string[]
}

export type WordPressMedia = {
  id: number
  source_url: string
  media_details?: { width?: number; height?: number }
}

export type WordPressPost = {
  id: number
  link: string
  status: string
  slug: string
  title: { rendered: string }
}

export type PublishInput = {
  title: string
  html: string
  excerpt?: string | null
  featuredImageUrl?: string | null
  status?: "draft" | "publish" | "pending" | "private"
  categories?: number[]
  tags?: string[]
  slug?: string | null
}

export type PublishResult = {
  wpPostId: number
  wpUrl: string
  wpStatus: string
  featuredMediaId: number | null
}

function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "")
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error("site_url deve comecar com http:// ou https://")
  }
  return trimmed
}

function basicAuthHeader(username: string, appPassword: string): string {
  // Application passwords podem vir com espacos (formato "xxxx xxxx xxxx").
  const clean = appPassword.replace(/\s+/g, "")
  const token = Buffer.from(`${username}:${clean}`, "utf8").toString("base64")
  return `Basic ${token}`
}

async function wpFetch<T = unknown>(
  creds: WordPressCredentials,
  pathOrUrl: string,
  init: RequestInit = {}
): Promise<T> {
  const base = normalizeBaseUrl(creds.siteUrl)
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${base}${pathOrUrl}`
  const headers = new Headers(init.headers ?? {})
  headers.set("Authorization", basicAuthHeader(creds.username, creds.appPassword))
  if (!headers.has("Accept")) headers.set("Accept", "application/json")
  if (init.body && !headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }
  const res = await fetch(url, {
    ...init,
    headers,
    signal: init.signal ?? AbortSignal.timeout(30_000),
    redirect: "follow",
  })
  if (!res.ok) {
    let msg = `WordPress ${res.status} ${res.statusText}`
    try {
      const body = (await res.json()) as { message?: string; code?: string }
      if (body.message) msg += ` — ${body.message}`
      if (body.code) msg += ` [${body.code}]`
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  // 204 No Content sem body
  if (res.status === 204) return null as unknown as T
  return (await res.json()) as T
}

/**
 * Valida credencial contra /wp-json/wp/v2/users/me.
 * Lanca se invalida; retorna user do WP se ok.
 */
export async function validateCredentials(creds: WordPressCredentials): Promise<WordPressUser> {
  return wpFetch<WordPressUser>(creds, "/wp-json/wp/v2/users/me?context=edit")
}

/**
 * Baixa a imagem do URL (ex: capa gerada pelo Imagen) e faz upload em /media.
 * Retorna o objeto do WP com o id.
 */
async function uploadFeaturedMedia(
  creds: WordPressCredentials,
  imageUrl: string,
  filenameHint: string
): Promise<WordPressMedia> {
  const res = await fetch(imageUrl, {
    headers: { "user-agent": "AutoBlogger/1.0 (+publish)" },
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`Falha ao baixar imagem de capa (${res.status})`)
  const ct = res.headers.get("content-type") || "image/png"
  const ext = ct.includes("jpeg") ? "jpg" : ct.includes("webp") ? "webp" : "png"
  const bytes = Buffer.from(await res.arrayBuffer())

  const safeHint = filenameHint
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "cover"
  const filename = `${safeHint}-${Date.now()}.${ext}`

  const headers: Record<string, string> = {
    Authorization: basicAuthHeader(creds.username, creds.appPassword),
    "Content-Type": ct,
    "Content-Disposition": `attachment; filename="${filename}"`,
  }
  const base = normalizeBaseUrl(creds.siteUrl)
  const upload = await fetch(`${base}/wp-json/wp/v2/media`, {
    method: "POST",
    headers,
    body: bytes,
    signal: AbortSignal.timeout(60_000),
  })
  if (!upload.ok) {
    let msg = `WordPress media ${upload.status}`
    try {
      const body = (await upload.json()) as { message?: string }
      if (body.message) msg += ` — ${body.message}`
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  return (await upload.json()) as WordPressMedia
}

/**
 * Publica um post completo no WordPress.
 * - Cria featured image (se houver URL) em /media
 * - Cria post em /posts com featured_media + content + excerpt
 */
export async function publishToWordPress(
  creds: WordPressCredentials,
  input: PublishInput
): Promise<PublishResult> {
  let featuredMediaId: number | null = null
  if (input.featuredImageUrl) {
    try {
      const media = await uploadFeaturedMedia(creds, input.featuredImageUrl, input.title)
      featuredMediaId = media.id
    } catch (err) {
      // Nao derruba o publish se so a imagem falhar — log e segue.
      console.warn("[wp] featured media falhou:", err)
    }
  }

  const body: Record<string, unknown> = {
    title: input.title,
    content: input.html,
    status: input.status ?? "draft",
  }
  if (input.excerpt) body.excerpt = input.excerpt
  if (input.slug) body.slug = input.slug
  if (featuredMediaId) body.featured_media = featuredMediaId
  if (input.categories && input.categories.length > 0) body.categories = input.categories

  const post = await wpFetch<WordPressPost>(creds, "/wp-json/wp/v2/posts", {
    method: "POST",
    body: JSON.stringify(body),
  })

  return {
    wpPostId: post.id,
    wpUrl: post.link,
    wpStatus: post.status,
    featuredMediaId,
  }
}

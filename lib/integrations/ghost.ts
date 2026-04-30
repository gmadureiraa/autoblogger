import { createHmac } from "node:crypto"
import type {
  PublishAdapter,
  PublishOutput,
  PublishablePost,
  ValidateResult,
} from "./adapter"

/**
 * Ghost Admin API adapter.
 *
 * Como pegar a Admin API Key:
 *   Ghost Admin → Integrations → Add custom integration → copiar "Admin API Key".
 *   Formato: "<id>:<secret_hex>"
 *
 * Auth: JWT HS256 assinado com o secret (em hex). Header:
 *   Authorization: Ghost <jwt>
 *
 * Endpoints:
 *   - Validate:  GET  {host}/ghost/api/admin/site/
 *   - Publish:   POST {host}/ghost/api/admin/posts/?source=html
 *
 * Credentials: { apiUrl, adminApiKey }   (apiUrl ex: https://meublog.ghost.io)
 * Metadata:    { siteName? }
 */

export interface GhostCreds extends Record<string, unknown> {
  apiUrl: string
  adminApiKey: string
}

export interface GhostMeta extends Record<string, unknown> {
  siteName?: string | null
  defaultStatus?: "draft" | "published"
}

const GHOST_API_VERSION = "v5.0"

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

/**
 * Gera um JWT HS256 com aud="/admin/", iat=now, exp=now+5min, kid=keyId.
 * Ghost rejeita exp > 5min do iat.
 */
function signGhostJwt(adminApiKey: string): string {
  const sep = adminApiKey.indexOf(":")
  if (sep < 0) throw new Error("adminApiKey inválida — esperado formato 'id:secret'.")
  const keyId = adminApiKey.slice(0, sep)
  const secretHex = adminApiKey.slice(sep + 1)
  if (!keyId || !secretHex) {
    throw new Error("adminApiKey inválida — id ou secret vazios.")
  }
  let secret: Buffer
  try {
    secret = Buffer.from(secretHex, "hex")
  } catch {
    throw new Error("adminApiKey inválida — secret não é hex válido.")
  }
  if (secret.length === 0) {
    throw new Error("adminApiKey inválida — secret vazio após decode hex.")
  }

  const header = { alg: "HS256", typ: "JWT", kid: keyId }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iat: now,
    exp: now + 5 * 60,
    aud: "/admin/",
  }

  const encHeader = base64url(Buffer.from(JSON.stringify(header), "utf8"))
  const encPayload = base64url(Buffer.from(JSON.stringify(payload), "utf8"))
  const signingInput = `${encHeader}.${encPayload}`
  const sig = base64url(createHmac("sha256", secret).update(signingInput).digest())
  return `${signingInput}.${sig}`
}

function normalizeApiUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "")
}

async function ghostFetch<T>(
  creds: GhostCreds,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const base = normalizeApiUrl(creds.apiUrl)
  const url = `${base}/ghost/api/admin/${path.replace(/^\/+/, "")}`
  const headers: Record<string, string> = {
    Authorization: `Ghost ${signGhostJwt(creds.adminApiKey)}`,
    "Accept-Version": GHOST_API_VERSION,
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  }
  const res = await fetch(url, {
    ...init,
    headers,
    signal: init.signal ?? AbortSignal.timeout(30_000),
    redirect: "follow",
  })
  if (!res.ok) {
    let msg = `Ghost ${res.status} ${res.statusText}`
    try {
      const body = (await res.json()) as {
        errors?: Array<{ message?: string; context?: string }>
      }
      const first = body.errors?.[0]
      if (first?.message) msg += ` — ${first.message}`
      if (first?.context) msg += ` [${first.context}]`
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  if (res.status === 204) return null as unknown as T
  return (await res.json()) as T
}

export const ghostAdapter: PublishAdapter<GhostCreds, GhostMeta> = {
  id: "ghost",
  name: "Ghost",
  authMethod: "admin_api",
  tagline: "Ghost Admin API + JWT",

  async validateCredentials(creds): Promise<ValidateResult> {
    if (!creds.apiUrl || !creds.adminApiKey) {
      return { ok: false, error: "Faltam apiUrl ou adminApiKey." }
    }
    if (!/^https?:\/\//i.test(creds.apiUrl)) {
      return { ok: false, error: "apiUrl precisa começar com http:// ou https://" }
    }
    try {
      const data = await ghostFetch<{
        site?: { title?: string; description?: string; url?: string }
      }>(creds, "site/")
      return {
        ok: true,
        accountLabel: data.site?.title ?? data.site?.url ?? "Ghost site",
      }
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Credenciais inválidas",
      }
    }
  },

  async publish(post: PublishablePost, creds, _meta, options): Promise<PublishOutput> {
    const status: "draft" | "published" =
      options?.status === "publish" ? "published" : "draft"

    const body = {
      posts: [
        {
          title: post.title,
          html: post.html,
          status,
          excerpt: post.excerpt ?? undefined,
          slug: post.slug ?? undefined,
          feature_image: post.featuredImageUrl ?? undefined,
        },
      ],
    }

    const data = await ghostFetch<{
      posts?: Array<{ id: string; url: string; status: string }>
    }>(creds, "posts/?source=html", {
      method: "POST",
      body: JSON.stringify(body),
    })

    const created = data.posts?.[0]
    if (!created) throw new Error("Ghost não devolveu post criado.")
    return {
      url: created.url,
      externalId: created.id,
      status: created.status,
    }
  },
}

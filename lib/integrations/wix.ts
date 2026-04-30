import type {
  PublishAdapter,
  PublishOutput,
  PublishablePost,
  ValidateResult,
} from "./adapter"

/**
 * Wix adapter — usa REST API com API Key.
 *
 * Como gerar a API Key:
 *   Wix Dashboard → Settings → Headless Settings → API Keys → Generate.
 *   Permissões necessárias: Wix Blog (read + manage drafts/posts).
 *
 * Pra publicar precisamos do account_id e site_id (também aparecem no
 * Headless Settings da API key).
 *
 * Credentials: { apiKey, accountId, siteId }
 * Metadata:    { siteName?, defaultStatus? }
 *
 * Endpoints usados:
 *   - Validate:  GET https://www.wixapis.com/site-list/v2/sites/query  (lista sites do account)
 *   - Publish:   POST https://www.wixapis.com/blog/v3/draft-posts  (cria draft)
 *               + POST https://www.wixapis.com/blog/v3/draft-posts/{id}/publish (se status=publish)
 *
 * REGRA dura: Wix usa "Ricos" (rich content node tree) pra blog. Como conversão
 * HTML→Ricos é não-trivial, este adapter envia o HTML como um único node
 * "HTML" (suportado nativamente pelo Wix Blog) — não tão bonito quanto Ricos
 * nativo mas funcional. Usuário pode editar no admin Wix depois.
 */

export interface WixCreds extends Record<string, unknown> {
  apiKey: string
  accountId: string
  siteId: string
}

export interface WixMeta extends Record<string, unknown> {
  siteName?: string | null
  defaultStatus?: "draft" | "publish"
}

const WIX_API_BASE = "https://www.wixapis.com"

function wixHeaders(creds: WixCreds): Record<string, string> {
  return {
    Authorization: creds.apiKey,
    "wix-account-id": creds.accountId,
    "wix-site-id": creds.siteId,
    "Content-Type": "application/json",
  }
}

async function wixFetch<T>(
  creds: WixCreds,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = path.startsWith("http") ? path : `${WIX_API_BASE}${path}`
  const headers: Record<string, string> = { ...wixHeaders(creds), ...(init.headers as Record<string, string> | undefined) }
  const res = await fetch(url, {
    ...init,
    headers,
    signal: init.signal ?? AbortSignal.timeout(30_000),
    redirect: "follow",
  })
  if (!res.ok) {
    let msg = `Wix ${res.status} ${res.statusText}`
    try {
      const body = (await res.json()) as { message?: string; details?: { applicationError?: { description?: string } } }
      if (body.message) msg += ` — ${body.message}`
      if (body.details?.applicationError?.description) msg += ` — ${body.details.applicationError.description}`
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  if (res.status === 204) return null as unknown as T
  return (await res.json()) as T
}

/**
 * Converte HTML simples num richContent básico do Wix (tree de nodes).
 * Estratégia: 1 node do tipo PARAGRAPH com 1 TEXT contendo o HTML inteiro.
 * Não é ideal pra SEO/preview do Wix mas funciona pra MVP. Usuário pode
 * editar via admin Wix se quiser layout nativo.
 *
 * Doc oficial Ricos: https://dev.wix.com/docs/rest/business-management/blog-posts/draft-posts
 */
function htmlToWixRichContent(html: string): {
  nodes: Array<Record<string, unknown>>
} {
  return {
    nodes: [
      {
        type: "PARAGRAPH",
        id: `p-${Date.now()}`,
        nodes: [
          {
            type: "TEXT",
            id: `t-${Date.now()}`,
            nodes: [],
            textData: { text: html, decorations: [] },
          },
        ],
        paragraphData: {},
      },
    ],
  }
}

export const wixAdapter: PublishAdapter<WixCreds, WixMeta> = {
  id: "wix",
  name: "Wix Blog",
  authMethod: "api_key",
  tagline: "Wix Headless API + API Key",

  async validateCredentials(creds): Promise<ValidateResult> {
    if (!creds.apiKey || !creds.accountId || !creds.siteId) {
      return { ok: false, error: "Faltam apiKey, accountId ou siteId." }
    }
    try {
      // Endpoint leve: lista sites do account (já scoped via header). Se a key
      // for inválida, retorna 401/403.
      const data = await wixFetch<{ sites?: Array<{ id: string; displayName?: string; name?: string }> }>(
        creds,
        "/site-list/v2/sites/query",
        { method: "POST", body: JSON.stringify({ query: { paging: { limit: 5 } } }) }
      )
      const site = data.sites?.find((s) => s.id === creds.siteId) ?? data.sites?.[0]
      return {
        ok: true,
        accountLabel: site?.displayName ?? site?.name ?? "Wix site",
      }
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Credenciais inválidas",
      }
    }
  },

  async publish(post: PublishablePost, creds, _meta, options): Promise<PublishOutput> {
    const wantPublish = options?.status === "publish"

    const draftBody = {
      draftPost: {
        title: post.title,
        excerpt: post.excerpt ?? "",
        slug: post.slug ?? undefined,
        richContent: htmlToWixRichContent(post.html),
        // status defaults to UNPUBLISHED no Wix. Publish é endpoint separado.
      },
    }

    const draftRes = await wixFetch<{
      draftPost?: { id?: string; url?: { base?: string; path?: string } }
    }>(creds, "/blog/v3/draft-posts", {
      method: "POST",
      body: JSON.stringify(draftBody),
    })
    const draftId = draftRes.draftPost?.id
    if (!draftId) throw new Error("Wix retornou draft sem id.")

    let finalUrl = ""
    let finalStatus = "draft"

    if (wantPublish) {
      const publishRes = await wixFetch<{
        post?: { id?: string; url?: { base?: string; path?: string } }
      }>(creds, `/blog/v3/draft-posts/${draftId}/publish`, { method: "POST" })
      const u = publishRes.post?.url
      finalUrl = u?.base && u?.path ? `${u.base}${u.path}` : ""
      finalStatus = "publish"
    } else {
      const u = draftRes.draftPost?.url
      finalUrl = u?.base && u?.path ? `${u.base}${u.path}` : ""
    }

    return {
      url: finalUrl || `wix://draft/${draftId}`,
      externalId: draftId,
      status: finalStatus,
    }
  },
}

import type {
  PublishAdapter,
  PublishOutput,
  PublishablePost,
  PublishStatus,
  ValidateResult,
} from "./adapter"
import {
  publishToWordPress,
  validateCredentials as wpValidate,
  type WordPressCredentials,
} from "@/lib/server/wordpress"

/**
 * WordPress adapter — usa REST API + Application Password.
 *
 * Credentials: { siteUrl, username, appPassword }
 * Metadata:    { defaultStatus?, defaultCategoryId?, label? }
 */

export type WordPressCreds = WordPressCredentials

export interface WordPressMeta extends Record<string, unknown> {
  label?: string | null
  defaultStatus?: PublishStatus
  defaultCategoryId?: number | null
}

export const wordpressAdapter: PublishAdapter<WordPressCreds, WordPressMeta> = {
  id: "wordpress",
  name: "WordPress",
  authMethod: "app_password",
  tagline: "REST API + Application Password",

  async validateCredentials(creds): Promise<ValidateResult> {
    if (!creds.siteUrl || !creds.username || !creds.appPassword) {
      return { ok: false, error: "Faltam siteUrl, username ou appPassword." }
    }
    if (!/^https?:\/\//i.test(creds.siteUrl)) {
      return { ok: false, error: "siteUrl precisa começar com http:// ou https://" }
    }
    try {
      const user = await wpValidate(creds)
      return { ok: true, accountLabel: user.name ?? user.slug ?? null }
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Credenciais inválidas",
      }
    }
  },

  async publish(post: PublishablePost, creds, meta, options): Promise<PublishOutput> {
    const status = options?.status ?? meta.defaultStatus ?? "draft"
    const result = await publishToWordPress(creds, {
      title: post.title,
      html: post.html,
      excerpt: post.excerpt ?? null,
      slug: post.slug ?? null,
      featuredImageUrl: post.featuredImageUrl ?? null,
      status,
      categories: meta.defaultCategoryId ? [meta.defaultCategoryId] : undefined,
    })
    return {
      url: result.wpUrl,
      externalId: String(result.wpPostId),
      status: result.wpStatus,
    }
  },
}

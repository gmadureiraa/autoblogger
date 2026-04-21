import postgres from "postgres"

/**
 * Cliente Postgres para Neon (DB dedicado do AutoBlogger — schema public).
 *
 * Uso:
 *   import { sql } from "@/lib/neon"
 *   const rows = await sql`SELECT * FROM posts WHERE user_id = ${userId}`
 */

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL env var required")
}

export const sql = postgres(process.env.DATABASE_URL, {
  // Neon hiberna — idle_timeout evita conexoes abertas matando o pool
  idle_timeout: 20,
  max: 10,
})

export type Profile = {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  niche: string[] | null
  default_tone: string
  gemini_api_key: string | null
  plan: "free" | "pro" | "agency"
  posts_limit: number
  posts_count: number
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export type PostStatus = "draft" | "published" | "archived"

export type Post = {
  id: string
  user_id: string
  title: string
  slug: string | null
  excerpt: string | null
  body_markdown: string | null
  body_html: string | null
  meta: Record<string, unknown>
  status: PostStatus
  created_at: string
  updated_at: string
}

/**
 * Garante que o profile existe pro clerkUserId passado. Usa UPSERT.
 * Chamar sempre antes de criar posts — Clerk nao tem webhook aqui,
 * entao criamos o profile on-demand na primeira request autenticada.
 */
export async function ensureProfile(params: {
  clerkUserId: string
  email?: string | null
  name?: string | null
  avatarUrl?: string | null
}): Promise<Profile> {
  const { clerkUserId, email, name, avatarUrl } = params
  const rows = await sql<Profile[]>`
    INSERT INTO profiles (id, email, name, avatar_url)
    VALUES (${clerkUserId}, ${email ?? null}, ${name ?? null}, ${avatarUrl ?? null})
    ON CONFLICT (id) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, profiles.email),
      name = COALESCE(EXCLUDED.name, profiles.name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url)
    RETURNING *
  `
  return rows[0]
}

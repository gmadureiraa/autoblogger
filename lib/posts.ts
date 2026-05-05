import { sql, type Post, type PostStatus } from "@/lib/neon"
import { sanitizeArticleHtml } from "@/lib/server/sanitize"

type JsonPayload = Parameters<typeof sql.json>[0]
const jsonify = (v: Record<string, unknown>): JsonPayload => v as unknown as JsonPayload

/**
 * Camada server-side de CRUD de posts contra Neon.
 * Toda operacao recebe o `userId` (Clerk) e escopa via WHERE.
 * Chame apenas a partir de route handlers / server components.
 */

export async function listPosts(userId: string, status?: string): Promise<Post[]> {
  if (status) {
    return sql<Post[]>`
      SELECT * FROM posts
      WHERE user_id = ${userId} AND status = ${status}
      ORDER BY created_at DESC
    `
  }
  return sql<Post[]>`
    SELECT * FROM posts
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `
}

export async function getPost(userId: string, id: string): Promise<Post | null> {
  const rows = await sql<Post[]>`
    SELECT * FROM posts WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  `
  return rows[0] ?? null
}

export type PostInput = {
  title: string
  slug?: string | null
  excerpt?: string | null
  body_markdown?: string | null
  body_html?: string | null
  meta?: Record<string, unknown>
  status?: PostStatus
  cover_seed?: string | null
  cover_style?: string | null
}

export async function createPost(userId: string, input: PostInput): Promise<Post> {
  // Sanitiza HTML antes de gravar — protege contra XSS no blog publico
  // que renderiza `body_html` via dangerouslySetInnerHTML.
  const cleanHtml = input.body_html ? sanitizeArticleHtml(input.body_html) : null
  const rows = await sql<Post[]>`
    INSERT INTO posts (
      user_id, title, slug, excerpt, body_markdown, body_html, meta, status,
      cover_seed, cover_style
    ) VALUES (
      ${userId},
      ${input.title},
      ${input.slug ?? null},
      ${input.excerpt ?? null},
      ${input.body_markdown ?? null},
      ${cleanHtml},
      ${sql.json(jsonify(input.meta ?? {}))},
      ${input.status ?? "draft"},
      ${input.cover_seed ?? null},
      ${input.cover_style ?? null}
    )
    RETURNING *
  `
  return rows[0]
}

export type PostPatch = Partial<PostInput>

/**
 * Update parcial. Usa COALESCE com NULL nos params que nao foram enviados,
 * pra nao sobrescrever com null acidentalmente. Para meta, faz merge via jsonb.
 */
export async function updatePost(
  userId: string,
  id: string,
  patch: PostPatch
): Promise<Post | null> {
  // Sanitiza body_html no update tambem — qualquer input editado pelo user
  // passa pelo mesmo whitelist.
  const cleanHtml =
    patch.body_html !== undefined
      ? patch.body_html === null
        ? null
        : sanitizeArticleHtml(patch.body_html)
      : undefined
  const rows = await sql<Post[]>`
    UPDATE posts SET
      title         = COALESCE(${patch.title ?? null}, title),
      slug          = ${patch.slug !== undefined ? patch.slug : sql`slug`},
      excerpt       = ${patch.excerpt !== undefined ? patch.excerpt : sql`excerpt`},
      body_markdown = ${patch.body_markdown !== undefined ? patch.body_markdown : sql`body_markdown`},
      body_html     = ${cleanHtml !== undefined ? cleanHtml : sql`body_html`},
      meta          = ${patch.meta !== undefined ? sql.json(jsonify(patch.meta)) : sql`meta`},
      status        = COALESCE(${patch.status ?? null}, status),
      updated_at    = now()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `
  return rows[0] ?? null
}

export async function deletePost(userId: string, id: string): Promise<boolean> {
  const rows = await sql<Post[]>`
    DELETE FROM posts WHERE id = ${id} AND user_id = ${userId} RETURNING id
  `
  return rows.length > 0
}

import type { MetadataRoute } from "next"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://autoblogger-rosy.vercel.app"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/sign-up`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/sign-in`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/gerar`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/artigos`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ]

  // Posts publicados — query Neon direto. Fallback pra rotas estaticas se algo falhar.
  try {
    if (!process.env.DATABASE_URL) return staticRoutes
    const { sql } = await import("@/lib/neon")
    const rows = await sql<{ id: string; slug: string | null; updated_at: string | null }[]>`
      SELECT id, slug, updated_at FROM posts
      WHERE status = 'published'
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 500
    `
    const postRoutes: MetadataRoute.Sitemap = rows.map((p) => ({
      url: `${SITE_URL}/artigos/${p.id}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))

    return [...staticRoutes, ...postRoutes]
  } catch {
    return staticRoutes
  }
}

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

  // Posts publicados + blogs publicos — query Neon. Fallback em caso de falha.
  try {
    if (!process.env.DATABASE_URL) return staticRoutes
    const { sql } = await import("@/lib/neon")

    const blogs = await sql<{ blog_handle: string; updated_at: string | null }[]>`
      SELECT blog_handle, updated_at FROM profiles
      WHERE blog_handle IS NOT NULL
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 200
    `

    const blogRoutes: MetadataRoute.Sitemap = blogs.map((b) => ({
      url: `${SITE_URL}/blog/${b.blog_handle}`,
      lastModified: b.updated_at ? new Date(b.updated_at) : now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }))

    const posts = await sql<{
      id: string
      slug: string | null
      updated_at: string | null
      blog_handle: string | null
    }[]>`
      SELECT p.id, p.slug, p.updated_at, pr.blog_handle
      FROM posts p
      JOIN profiles pr ON pr.id = p.user_id
      WHERE p.status = 'published' AND pr.blog_handle IS NOT NULL
      ORDER BY p.updated_at DESC NULLS LAST
      LIMIT 500
    `
    const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.blog_handle}/${p.slug ?? p.id}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))

    return [...staticRoutes, ...blogRoutes, ...postRoutes]
  } catch {
    return staticRoutes
  }
}

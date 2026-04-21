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
      url: `${SITE_URL}/signup`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/login`,
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

  // Supabase-backed posts publicados. Se as envs nao estao setadas ou algo falhar,
  // devolve apenas as rotas estaticas pra nao quebrar o build.
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) return staticRoutes

    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(url, anon, { auth: { persistSession: false } })
    const { data } = await supabase
      .from("posts")
      .select("id, slug, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(500)

    const postRoutes: MetadataRoute.Sitemap = (data ?? []).map(
      (p: { id: string; slug: string | null; updated_at: string | null }) => ({
        url: `${SITE_URL}/artigos/${p.id}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })
    )

    return [...staticRoutes, ...postRoutes]
  } catch {
    return staticRoutes
  }
}

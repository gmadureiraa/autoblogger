import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { sql } from "@/lib/neon"

export const revalidate = 300 // 5min ISR

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://autoblogger-rosy.vercel.app"

type BlogOwner = {
  id: string
  name: string | null
  bio: string | null
  avatar_url: string | null
  blog_handle: string
  niche: string[] | null
}

type BlogPostRow = {
  id: string
  slug: string | null
  title: string
  excerpt: string | null
  created_at: string
  updated_at: string
  meta: Record<string, unknown>
}

async function loadBlog(handle: string): Promise<{ owner: BlogOwner; posts: BlogPostRow[] } | null> {
  const handleLower = handle.toLowerCase()
  const rows = await sql<BlogOwner[]>`
    SELECT id, name, bio, avatar_url, blog_handle, niche
    FROM profiles
    WHERE LOWER(blog_handle) = ${handleLower}
    LIMIT 1
  `
  const owner = rows[0]
  if (!owner) return null

  const posts = await sql<BlogPostRow[]>`
    SELECT id, slug, title, excerpt, created_at, updated_at, meta
    FROM posts
    WHERE user_id = ${owner.id} AND status = 'published'
    ORDER BY created_at DESC
    LIMIT 50
  `
  return { owner, posts }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>
}): Promise<Metadata> {
  const { handle } = await params
  const data = await loadBlog(handle).catch(() => null)
  if (!data) return { title: "Blog nao encontrado", robots: { index: false } }
  const displayName = data.owner.name ?? data.owner.blog_handle
  const title = `${displayName} | AutoBlogger`
  const description =
    data.owner.bio?.slice(0, 160) ??
    `${data.posts.length} artigos publicados por ${displayName}.`
  const canonical = `${SITE_URL}/blog/${data.owner.blog_handle}`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "profile",
    },
  }
}

export default async function BlogHandlePage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const data = await loadBlog(handle).catch(() => null)
  if (!data) notFound()
  const { owner, posts } = data
  const displayName = owner.name ?? owner.blog_handle
  const handleCanonical = owner.blog_handle

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${displayName} — AutoBlogger`,
    url: `${SITE_URL}/blog/${handleCanonical}`,
    description: owner.bio ?? `Artigos de ${displayName}`,
    author: {
      "@type": "Person",
      name: displayName,
      url: `${SITE_URL}/blog/${handleCanonical}`,
    },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${SITE_URL}/blog/${handleCanonical}/${p.slug ?? p.id}`,
      datePublished: p.created_at,
      dateModified: p.updated_at,
    })),
  }

  return (
    <div className="min-h-screen dot-grid-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />

      <header className="border-b-2 border-foreground/10 bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-10 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/"
              className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              AutoBlogger
            </Link>
            <span className="text-muted-foreground/30">/</span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
              blog/{handleCanonical}
            </span>
          </div>
          <h1 className="font-pixel text-3xl sm:text-5xl tracking-tight mb-3">{displayName}</h1>
          {owner.bio && (
            <p className="text-sm font-mono text-muted-foreground max-w-2xl leading-relaxed">
              {owner.bio}
            </p>
          )}
          {owner.niche && owner.niche.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {owner.niche.map((n) => (
                <span
                  key={n}
                  className="text-[10px] font-mono tracking-widest uppercase px-2 py-1 border border-[#10b981] text-[#10b981]"
                >
                  {n}
                </span>
              ))}
            </div>
          )}
          <div className="mt-6 flex items-center gap-3">
            <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
              {posts.length} artigo{posts.length === 1 ? "" : "s"} publicado{posts.length === 1 ? "" : "s"}
            </span>
            <div className="flex-1 border-t border-border" />
            <span className="inline-block h-2 w-2 bg-[#10b981] animate-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 lg:px-8">
        {posts.length === 0 ? (
          <div className="border-2 border-foreground/20 px-8 py-16 text-center">
            <p className="text-sm font-mono text-muted-foreground">
              Nenhum artigo publicado ainda.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-0 border-2 border-foreground">
            {posts.map((p, i) => {
              const slug = p.slug ?? p.id
              const cover = (p.meta?.coverImage as string | undefined) ?? null
              const seo = (p.meta?.seoScore as number | undefined) ?? null
              const words = (p.meta?.wordCount as number | undefined) ?? null
              return (
                <li
                  key={p.id}
                  className="border-b-2 border-foreground last:border-b-0 hover:bg-foreground/5 transition-colors"
                >
                  <Link
                    href={`/blog/${handleCanonical}/${slug}`}
                    className="block px-5 py-4"
                  >
                    <div className="flex items-center gap-4">
                      {cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cover}
                          alt=""
                          className="hidden md:block w-28 h-16 object-cover border border-foreground/20 shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-mono tracking-widest text-muted-foreground">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <time
                            dateTime={p.created_at}
                            className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground"
                          >
                            {new Date(p.created_at).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </time>
                          {words ? (
                            <span className="text-[10px] font-mono text-muted-foreground">
                              · {words} palavras
                            </span>
                          ) : null}
                        </div>
                        <h2 className="text-base lg:text-lg font-mono font-bold tracking-tight leading-tight">
                          {p.title}
                        </h2>
                        {p.excerpt && (
                          <p className="text-xs font-mono text-muted-foreground mt-1 line-clamp-2">
                            {p.excerpt}
                          </p>
                        )}
                      </div>
                      {seo != null && (
                        <div className="hidden sm:flex flex-col items-center gap-0.5 border-l border-foreground/20 pl-4">
                          <span
                            className="text-lg font-mono font-bold"
                            style={{
                              color: seo >= 80 ? "#10b981" : seo >= 60 ? "#eab308" : "#ef4444",
                            }}
                          >
                            {seo}
                          </span>
                          <span className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground">
                            SEO
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </main>

      <footer className="border-t-2 border-foreground/10 py-8 px-6 mt-16">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            Publicado via <Link href="/" className="underline hover:text-foreground">AutoBlogger</Link>
          </span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </div>
  )
}

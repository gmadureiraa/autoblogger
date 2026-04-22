import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { sql } from "@/lib/neon"

export const revalidate = 300

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://autoblogger-rosy.vercel.app"

type BlogPost = {
  id: string
  user_id: string
  title: string
  slug: string | null
  excerpt: string | null
  body_html: string | null
  body_markdown: string | null
  meta: Record<string, unknown>
  created_at: string
  updated_at: string
  // from join
  owner_name: string | null
  owner_handle: string
  owner_avatar: string | null
  owner_bio: string | null
}

async function loadPost(handle: string, slugOrId: string): Promise<BlogPost | null> {
  const handleLower = handle.toLowerCase()
  const rows = await sql<BlogPost[]>`
    SELECT
      p.id, p.user_id, p.title, p.slug, p.excerpt,
      p.body_html, p.body_markdown, p.meta, p.created_at, p.updated_at,
      pr.name AS owner_name,
      pr.blog_handle AS owner_handle,
      pr.avatar_url AS owner_avatar,
      pr.bio AS owner_bio
    FROM posts p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE LOWER(pr.blog_handle) = ${handleLower}
      AND p.status = 'published'
      AND (p.slug = ${slugOrId} OR p.id::text = ${slugOrId})
    LIMIT 1
  `
  return rows[0] ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>
}): Promise<Metadata> {
  const { handle, slug } = await params
  const post = await loadPost(handle, slug).catch(() => null)
  if (!post) return { title: "Artigo nao encontrado", robots: { index: false } }
  const canonical = `${SITE_URL}/blog/${post.owner_handle}/${post.slug ?? post.id}`
  const cover = post.meta?.coverImage as string | undefined
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      url: canonical,
      type: "article",
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      authors: [post.owner_name ?? post.owner_handle],
      images: cover ? [{ url: cover }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? undefined,
      images: cover ? [cover] : undefined,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>
}) {
  const { handle, slug } = await params
  const post = await loadPost(handle, slug).catch(() => null)
  if (!post) notFound()
  const displayName = post.owner_name ?? post.owner_handle
  const cover = post.meta?.coverImage as string | undefined
  const wordCount = post.meta?.wordCount as number | undefined
  const sourceUrl = post.meta?.sourceUrl as string | undefined
  const canonical = `${SITE_URL}/blog/${post.owner_handle}/${post.slug ?? post.id}`

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: cover ? [cover] : undefined,
    datePublished: post.created_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Person",
      name: displayName,
      url: `${SITE_URL}/blog/${post.owner_handle}`,
    },
    publisher: {
      "@type": "Organization",
      name: "AutoBlogger",
      url: SITE_URL,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    wordCount,
    inLanguage: "pt-BR",
  }

  return (
    <div className="min-h-screen dot-grid-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <nav className="border-b border-foreground/10 bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 lg:px-8 flex items-center gap-3">
          <Link
            href={`/blog/${post.owner_handle}`}
            className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← {displayName}
          </Link>
          <span className="text-muted-foreground/30">/</span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground truncate">
            {post.slug ?? post.id}
          </span>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12 lg:px-8">
        <header className="mb-8 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <time
              dateTime={post.created_at}
              className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground"
            >
              {new Date(post.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </time>
            {wordCount ? (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                  {wordCount} palavras
                </span>
              </>
            ) : null}
          </div>
          <h1 className="font-pixel text-3xl sm:text-5xl tracking-tight leading-tight text-balance">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-base font-mono text-muted-foreground leading-relaxed max-w-2xl">
              {post.excerpt}
            </p>
          )}
        </header>

        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="w-full aspect-[16/9] object-cover border-2 border-foreground mb-10"
          />
        )}

        <div
          className="prose prose-invert max-w-none font-mono text-foreground
            [&_h2]:text-lg [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-[#10b981]
            [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-5 [&_h3]:mb-2
            [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:text-foreground/90
            [&_strong]:text-foreground
            [&_a]:text-[#10b981] [&_a]:underline
            [&_ul]:ml-4 [&_ul]:my-3 [&_li]:text-sm [&_li]:leading-relaxed [&_li]:mb-2 [&_li]:text-foreground/90
            [&_em]:italic"
          dangerouslySetInnerHTML={{ __html: post.body_html ?? "" }}
        />

        {sourceUrl && (
          <p className="mt-8 text-[10px] font-mono tracking-widest uppercase text-muted-foreground border-t border-foreground/20 pt-4">
            Fonte:{" "}
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-[#10b981] underline">
              {sourceUrl}
            </a>
          </p>
        )}
      </article>

      <footer className="border-t-2 border-foreground/10 py-8 px-6 mt-10">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            Por <Link href={`/blog/${post.owner_handle}`} className="underline">{displayName}</Link>
          </span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            Publicado via <Link href="/" className="underline">AutoBlogger</Link>
          </span>
        </div>
      </footer>
    </div>
  )
}

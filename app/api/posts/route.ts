import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { ensureProfile } from "@/lib/neon"
import { createPost, listPosts } from "@/lib/posts"
import { slugify } from "@/lib/markdown"

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") ?? undefined

  try {
    const posts = await listPosts(userId, status)
    return NextResponse.json({ posts, source: "neon" })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao listar posts"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 })
  }

  const title = typeof body.title === "string" ? body.title.trim() : ""
  if (!title) return NextResponse.json({ error: "title e obrigatorio" }, { status: 400 })

  const payload = {
    title,
    slug: typeof body.slug === "string" && body.slug ? body.slug : slugify(title),
    excerpt: typeof body.excerpt === "string" ? body.excerpt : null,
    body_markdown: typeof body.body_markdown === "string" ? body.body_markdown : null,
    body_html: typeof body.body_html === "string" ? body.body_html : null,
    meta:
      typeof body.meta === "object" && body.meta !== null
        ? (body.meta as Record<string, unknown>)
        : {},
    status:
      body.status === "published" || body.status === "archived"
        ? (body.status as "published" | "archived")
        : ("draft" as const),
  }

  try {
    // Garante que o profile existe antes de criar o post (FK).
    const user = await currentUser()
    await ensureProfile({
      clerkUserId: userId,
      email: user?.emailAddresses?.[0]?.emailAddress ?? null,
      name: user?.fullName ?? user?.username ?? null,
      avatarUrl: user?.imageUrl ?? null,
    })

    const post = await createPost(userId, payload)
    return NextResponse.json({ post, source: "neon" })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar post"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

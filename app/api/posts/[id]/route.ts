import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { deletePost, getPost, updatePost, type PostPatch } from "@/lib/posts"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })

  try {
    const post = await getPost(userId, id)
    if (!post) return NextResponse.json({ error: "Post nao encontrado" }, { status: 404 })
    return NextResponse.json({ post })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao buscar post"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 })
  }

  const allowed = [
    "title",
    "slug",
    "excerpt",
    "body_markdown",
    "body_html",
    "meta",
    "status",
  ] as const
  const patch: PostPatch = {}
  for (const key of allowed) {
    if (key in body) {
      // @ts-expect-error - dynamic assignment of allow-listed keys
      patch[key] = body[key]
    }
  }

  try {
    const post = await updatePost(userId, id, patch)
    if (!post) return NextResponse.json({ error: "Post nao encontrado" }, { status: 404 })
    return NextResponse.json({ post })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar post"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })

  try {
    const ok = await deletePost(userId, id)
    if (!ok) return NextResponse.json({ error: "Post nao encontrado" }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao deletar post"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/server/auth-helpers"
import { getSupabaseServerClient } from "@/lib/supabase"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params
  const auth = await requireAuthenticatedUser(req)
  if (auth.response) return auth.response

  if (!auth.supabaseConfigured) {
    return NextResponse.json({ error: "Supabase nao configurado" }, { status: 404 })
  }

  const supabase = getSupabaseServerClient(auth.accessToken!)
  if (!supabase) return NextResponse.json({ error: "Supabase indisponivel" }, { status: 500 })

  const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "Post nao encontrado" }, { status: 404 })
  return NextResponse.json({ post: data })
}

export async function PATCH(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params
  const auth = await requireAuthenticatedUser(req)
  if (auth.response) return auth.response

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
  const patch: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) patch[key] = body[key]
  }
  patch.updated_at = new Date().toISOString()

  if (!auth.supabaseConfigured) {
    return NextResponse.json({ post: { id, ...patch }, source: "local" })
  }

  const supabase = getSupabaseServerClient(auth.accessToken!)
  if (!supabase) return NextResponse.json({ error: "Supabase indisponivel" }, { status: 500 })

  const { data, error } = await supabase
    .from("posts")
    .update(patch)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}

export async function DELETE(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params
  const auth = await requireAuthenticatedUser(req)
  if (auth.response) return auth.response

  if (!auth.supabaseConfigured) {
    return NextResponse.json({ ok: true, source: "local" })
  }

  const supabase = getSupabaseServerClient(auth.accessToken!)
  if (!supabase) return NextResponse.json({ error: "Supabase indisponivel" }, { status: 500 })

  const { error } = await supabase.from("posts").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

import { NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/server/auth-helpers"
import { getSupabaseServerClient } from "@/lib/supabase"
import { slugify } from "@/lib/markdown"

export async function GET(req: Request) {
  const auth = await requireAuthenticatedUser(req)
  if (auth.response) return auth.response

  // Modo dev sem Supabase: devolve array vazio e deixa o client usar localStorage.
  if (!auth.supabaseConfigured) {
    return NextResponse.json({ posts: [], source: "local" })
  }

  const supabase = getSupabaseServerClient(auth.accessToken)
  if (!supabase) return NextResponse.json({ posts: [], source: "local" })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")

  let query = supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })

  if (status) query = query.eq("status", status)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ posts: data ?? [], source: "supabase" })
}

export async function POST(req: Request) {
  const auth = await requireAuthenticatedUser(req)
  if (auth.response) return auth.response

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 })
  }

  const title = typeof body.title === "string" ? body.title.trim() : ""
  if (!title) {
    return NextResponse.json({ error: "title e obrigatorio" }, { status: 400 })
  }

  const payload = {
    title,
    slug: typeof body.slug === "string" && body.slug ? body.slug : slugify(title),
    excerpt: typeof body.excerpt === "string" ? body.excerpt : null,
    body_markdown: typeof body.body_markdown === "string" ? body.body_markdown : null,
    body_html: typeof body.body_html === "string" ? body.body_html : null,
    meta: typeof body.meta === "object" && body.meta !== null ? body.meta : {},
    status:
      body.status === "published" || body.status === "archived" ? body.status : "draft",
  }

  if (!auth.supabaseConfigured) {
    // Dev mode: devolve o payload com id fake pro client persistir local.
    const fake = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Date.now().toString(36),
      user_id: "local",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...payload,
    }
    return NextResponse.json({ post: fake, source: "local" })
  }

  const supabase = getSupabaseServerClient(auth.accessToken!)
  if (!supabase) {
    return NextResponse.json({ error: "Supabase nao disponivel" }, { status: 500 })
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({ ...payload, user_id: auth.user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data, source: "supabase" })
}

import { NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/server/auth-helpers"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET(req: Request) {
  const auth = await requireAuthenticatedUser(req)
  if (auth.response) return auth.response

  if (!auth.supabaseConfigured) {
    return NextResponse.json({ profile: null, source: "local" })
  }

  const supabase = getSupabaseServerClient(auth.accessToken!)
  if (!supabase) return NextResponse.json({ error: "Supabase indisponivel" }, { status: 500 })

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}

export async function PATCH(req: Request) {
  const auth = await requireAuthenticatedUser(req)
  if (auth.response) return auth.response

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 })
  }

  const allowed = ["name", "avatar_url", "niche", "default_tone", "gemini_api_key"] as const
  const patch: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) patch[key] = body[key]
  }
  patch.updated_at = new Date().toISOString()

  if (!auth.supabaseConfigured) {
    return NextResponse.json({ profile: patch, source: "local" })
  }

  const supabase = getSupabaseServerClient(auth.accessToken!)
  if (!supabase) return NextResponse.json({ error: "Supabase indisponivel" }, { status: 500 })

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", auth.user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}

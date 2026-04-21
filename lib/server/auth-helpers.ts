import { NextResponse } from "next/server"
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

/**
 * Extrai e valida o bearer token do header Authorization.
 * Se o Supabase nao estiver configurado, retorna `null` em user mas deixa
 * a rota continuar — modo dev sem DB.
 */
export async function getAuthenticatedUser(req: Request): Promise<{
  user: User | null
  accessToken: string | null
  supabaseConfigured: boolean
}> {
  const supabaseConfigured = isSupabaseConfigured()
  if (!supabaseConfigured) {
    return { user: null, accessToken: null, supabaseConfigured: false }
  }

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization")
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return { user: null, accessToken: null, supabaseConfigured: true }
  }

  const token = authHeader.slice(7).trim()
  if (!token) return { user: null, accessToken: null, supabaseConfigured: true }

  const supabase = getSupabaseServerClient(token)
  if (!supabase) return { user: null, accessToken: null, supabaseConfigured: true }

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    return { user: null, accessToken: token, supabaseConfigured: true }
  }
  return { user: data.user, accessToken: token, supabaseConfigured: true }
}

/**
 * Guarda de rota: retorna um NextResponse 401 se nao autenticado.
 * Em modo dev (Supabase nao configurado) deixa passar e retorna null como user.
 */
export async function requireAuthenticatedUser(req: Request): Promise<
  | { user: User; accessToken: string; supabaseConfigured: true; response: null }
  | { user: null; accessToken: null; supabaseConfigured: false; response: null }
  | { user: null; accessToken: null; supabaseConfigured: true; response: NextResponse }
> {
  const { user, accessToken, supabaseConfigured } = await getAuthenticatedUser(req)

  if (!supabaseConfigured) {
    return { user: null, accessToken: null, supabaseConfigured: false, response: null }
  }

  if (!user || !accessToken) {
    return {
      user: null,
      accessToken: null,
      supabaseConfigured: true,
      response: NextResponse.json({ error: "Nao autenticado" }, { status: 401 }),
    }
  }

  return { user, accessToken, supabaseConfigured: true, response: null }
}

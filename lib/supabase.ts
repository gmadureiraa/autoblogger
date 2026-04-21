import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Supabase client singleton para o browser.
 *
 * Usa cache em `globalThis` pra sobreviver ao HMR do Next.
 * Se as env vars nao estiverem setadas, retorna `null` e o app
 * continua funcionando no modo local (localStorage fallback).
 */

export type Profile = {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  niche: string[] | null
  default_tone: string
  gemini_api_key: string | null
  plan: "free" | "pro" | "agency"
  posts_limit: number
  posts_count: number
  created_at: string
  updated_at: string
}

export type PostStatus = "draft" | "published" | "archived"

export type Post = {
  id: string
  user_id: string
  title: string
  slug: string | null
  excerpt: string | null
  body_markdown: string | null
  body_html: string | null
  meta: Record<string, unknown>
  status: PostStatus
  created_at: string
  updated_at: string
}

// Usamos um schema "any-ish" — o schema real eh enforced pelo banco.
// O typing forte ficaria com `supabase gen types typescript`, mas isso
// exige o projeto Supabase ja criado (Gabriel fara amanha).
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
      posts: {
        Row: Post
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

declare global {
  // eslint-disable-next-line no-var
  var __supabase_browser__: SupabaseClient | null | undefined
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.warn(
        "[autoblogger] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY nao configurados. Usando fallback localStorage."
      )
    }
    return null
  }

  if (typeof window === "undefined") {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  if (!globalThis.__supabase_browser__) {
    globalThis.__supabase_browser__ = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "autoblogger-auth",
      },
    })
  }
  return globalThis.__supabase_browser__
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

/**
 * Cliente server-side (anon key) — usado em route handlers onde a gente
 * valida um bearer token explicitamente.
 */
export function getSupabaseServerClient(accessToken?: string): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  })
}

/**
 * Cliente server-side com service role — bypass RLS.
 * Use SOMENTE em operacoes server confiaveis (ex: trigger de criacao de profile).
 */
export function getSupabaseServiceClient(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !serviceKey) return null

  return createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

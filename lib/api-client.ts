"use client"

import { getSupabaseBrowserClient } from "@/lib/supabase"

/**
 * Wrapper pro fetch que automaticamente anexa o bearer token
 * do Supabase quando tiver um usuario logado.
 */
export async function apiFetch(input: string, init: RequestInit = {}) {
  const supabase = getSupabaseBrowserClient()
  const headers = new Headers(init.headers)
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json")
  }

  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`)
    }
  }

  return fetch(input, { ...init, headers })
}

"use client"

/**
 * Wrapper pro fetch. Com Clerk, as sessions vao por cookie automaticamente
 * (graças ao middleware), entao nao precisa anexar Authorization header.
 */
export async function apiFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json")
  }
  return fetch(input, { ...init, headers, credentials: "same-origin" })
}

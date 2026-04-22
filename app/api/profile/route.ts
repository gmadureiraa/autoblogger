import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { ensureProfile, sql, type Profile } from "@/lib/neon"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })

  try {
    const user = await currentUser()
    const profile = await ensureProfile({
      clerkUserId: userId,
      email: user?.emailAddresses?.[0]?.emailAddress ?? null,
      name: user?.fullName ?? user?.username ?? null,
      avatarUrl: user?.imageUrl ?? null,
    })
    return NextResponse.json({ profile })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao buscar profile"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 })
  }

  const user = await currentUser()
  // Garante profile existe antes do UPDATE
  await ensureProfile({
    clerkUserId: userId,
    email: user?.emailAddresses?.[0]?.emailAddress ?? null,
    name: user?.fullName ?? user?.username ?? null,
    avatarUrl: user?.imageUrl ?? null,
  })

  const name = typeof body.name === "string" ? body.name : null
  const avatarUrl = typeof body.avatar_url === "string" ? body.avatar_url : null
  const niche = Array.isArray(body.niche) ? (body.niche as string[]) : null
  const defaultTone = typeof body.default_tone === "string" ? body.default_tone : null
  const geminiApiKey =
    typeof body.gemini_api_key === "string" || body.gemini_api_key === null
      ? (body.gemini_api_key as string | null)
      : undefined
  const bio = typeof body.bio === "string" ? body.bio : null

  let blogHandle: string | null | undefined = undefined
  if (typeof body.blog_handle === "string") {
    const raw = body.blog_handle.trim().toLowerCase()
    if (raw === "") {
      blogHandle = null
    } else {
      if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(raw)) {
        return NextResponse.json(
          { error: "blog_handle invalido. Use 3-30 chars, [a-z0-9-], sem inicio/fim em hifen." },
          { status: 400 }
        )
      }
      blogHandle = raw
    }
  } else if (body.blog_handle === null) {
    blogHandle = null
  }

  try {
    if (blogHandle) {
      const conflict = await sql<{ id: string }[]>`
        SELECT id FROM profiles
        WHERE LOWER(blog_handle) = ${blogHandle} AND id <> ${userId}
        LIMIT 1
      `
      if (conflict.length > 0) {
        return NextResponse.json({ error: "Handle ja esta em uso." }, { status: 409 })
      }
    }

    const rows = await sql<Profile[]>`
      UPDATE profiles SET
        name           = COALESCE(${name}, name),
        avatar_url     = COALESCE(${avatarUrl}, avatar_url),
        niche          = COALESCE(${niche as unknown as string[] | null}, niche),
        default_tone   = COALESCE(${defaultTone}, default_tone),
        gemini_api_key = ${geminiApiKey !== undefined ? geminiApiKey : sql`gemini_api_key`},
        bio            = COALESCE(${bio}, bio),
        blog_handle    = ${blogHandle !== undefined ? blogHandle : sql`blog_handle`},
        updated_at     = now()
      WHERE id = ${userId}
      RETURNING *
    `
    return NextResponse.json({ profile: rows[0] })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar profile"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

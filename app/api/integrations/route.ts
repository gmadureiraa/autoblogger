import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { ensureProfile } from "@/lib/neon"
import { getAdapter, ALL_PLATFORMS, type IntegrationPlatform } from "@/lib/integrations"
import {
  createIntegration,
  listIntegrations,
  toPublic,
} from "@/lib/integrations/store"

/**
 * GET  /api/integrations           — lista integrações do user (sem credenciais)
 * POST /api/integrations           — cria nova integração após validar credenciais
 *   Body: { platform, displayName, credentials, metadata? }
 */

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  try {
    const rows = await listIntegrations(userId)
    return NextResponse.json({ integrations: rows.map(toPublic) })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao listar integrações"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const platform = typeof body.platform === "string" ? body.platform : ""
  if (!ALL_PLATFORMS.includes(platform as IntegrationPlatform)) {
    return NextResponse.json(
      { error: `platform deve ser um de: ${ALL_PLATFORMS.join(", ")}` },
      { status: 400 }
    )
  }

  const displayName =
    typeof body.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim().slice(0, 80)
      : ""
  const credentials =
    typeof body.credentials === "object" && body.credentials !== null
      ? (body.credentials as Record<string, unknown>)
      : null
  const metadata =
    typeof body.metadata === "object" && body.metadata !== null
      ? (body.metadata as Record<string, unknown>)
      : {}

  if (!displayName) {
    return NextResponse.json({ error: "displayName é obrigatório" }, { status: 400 })
  }
  if (!credentials) {
    return NextResponse.json({ error: "credentials é obrigatório" }, { status: 400 })
  }

  // Garante profile pra FK
  const user = await currentUser()
  await ensureProfile({
    clerkUserId: userId,
    email: user?.emailAddresses?.[0]?.emailAddress ?? null,
    name: user?.fullName ?? user?.username ?? null,
    avatarUrl: user?.imageUrl ?? null,
  })

  // Valida credencial via adapter ANTES de gravar
  const adapter = getAdapter(platform as IntegrationPlatform)
  const validation = await adapter.validateCredentials(credentials, metadata)
  if (!validation.ok) {
    return NextResponse.json(
      { error: `Credenciais inválidas: ${validation.error || "verificação falhou"}` },
      { status: 401 }
    )
  }

  try {
    const row = await createIntegration({
      userId,
      platform: platform as IntegrationPlatform,
      displayName: displayName,
      credentials,
      metadata: {
        ...metadata,
        accountLabel: validation.accountLabel ?? null,
      },
    })
    return NextResponse.json({
      ok: true,
      integration: toPublic(row),
      validation: { accountLabel: validation.accountLabel ?? null },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar integração"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

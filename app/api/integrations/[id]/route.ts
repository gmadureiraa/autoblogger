import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { deleteIntegration, getIntegration, toPublic } from "@/lib/integrations/store"

/**
 * GET    /api/integrations/[id] — retorna integração (sem credenciais)
 * DELETE /api/integrations/[id] — remove integração
 */

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { id } = await context.params
  const row = await getIntegration(userId, id)
  if (!row) return NextResponse.json({ error: "Integração não encontrada" }, { status: 404 })
  return NextResponse.json({ integration: toPublic(row) })
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { id } = await context.params
  const ok = await deleteIntegration(userId, id)
  if (!ok) return NextResponse.json({ error: "Integração não encontrada" }, { status: 404 })
  return NextResponse.json({ ok: true })
}

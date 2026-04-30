import { sql } from "@/lib/neon"
import { encryptSecret, decryptSecret } from "@/lib/server/crypto"
import type { IntegrationPlatform } from "./index"

/**
 * CRUD da tabela `integrations`.
 *
 * Credentials são SEMPRE encriptadas (AES-256-GCM) antes de gravar e
 * decriptadas só on-demand no momento de publicar/validar.
 *
 * Nunca expomos `credentials_encrypted` em respostas de API. A função
 * `decryptCreds` é server-only.
 */

export interface IntegrationRow {
  id: string
  user_id: string
  platform: IntegrationPlatform
  display_name: string
  credentials_encrypted: string
  metadata: Record<string, unknown>
  last_used_at: string | null
  last_checked_at: string | null
  created_at: string
}

/** Versão pública (sem credentials). É o que entra em payloads de API. */
export interface IntegrationPublic {
  id: string
  platform: IntegrationPlatform
  display_name: string
  metadata: Record<string, unknown>
  last_used_at: string | null
  last_checked_at: string | null
  created_at: string
}

export function toPublic(row: IntegrationRow): IntegrationPublic {
  return {
    id: row.id,
    platform: row.platform,
    display_name: row.display_name,
    metadata: row.metadata,
    last_used_at: row.last_used_at,
    last_checked_at: row.last_checked_at,
    created_at: row.created_at,
  }
}

export async function listIntegrations(userId: string): Promise<IntegrationRow[]> {
  return sql<IntegrationRow[]>`
    SELECT id, user_id, platform, display_name, credentials_encrypted, metadata,
           last_used_at, last_checked_at, created_at
    FROM integrations
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `
}

export async function getIntegration(
  userId: string,
  id: string
): Promise<IntegrationRow | null> {
  const rows = await sql<IntegrationRow[]>`
    SELECT id, user_id, platform, display_name, credentials_encrypted, metadata,
           last_used_at, last_checked_at, created_at
    FROM integrations
    WHERE id = ${id} AND user_id = ${userId}
    LIMIT 1
  `
  return rows[0] ?? null
}

type JsonPayload = Parameters<typeof sql.json>[0]
const jsonify = (v: Record<string, unknown>): JsonPayload => v as unknown as JsonPayload

export interface CreateIntegrationInput {
  userId: string
  platform: IntegrationPlatform
  displayName: string
  credentials: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export async function createIntegration(input: CreateIntegrationInput): Promise<IntegrationRow> {
  const encrypted = encryptSecret(JSON.stringify(input.credentials))
  const rows = await sql<IntegrationRow[]>`
    INSERT INTO integrations (user_id, platform, display_name, credentials_encrypted, metadata, last_checked_at)
    VALUES (
      ${input.userId},
      ${input.platform},
      ${input.displayName},
      ${encrypted},
      ${sql.json(jsonify(input.metadata ?? {}))},
      now()
    )
    RETURNING id, user_id, platform, display_name, credentials_encrypted, metadata,
              last_used_at, last_checked_at, created_at
  `
  return rows[0]
}

export async function deleteIntegration(userId: string, id: string): Promise<boolean> {
  const rows = await sql<{ id: string }[]>`
    DELETE FROM integrations
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `
  return rows.length > 0
}

export async function markUsed(userId: string, id: string): Promise<void> {
  await sql`
    UPDATE integrations SET last_used_at = now()
    WHERE id = ${id} AND user_id = ${userId}
  `
}

export async function markChecked(userId: string, id: string): Promise<void> {
  await sql`
    UPDATE integrations SET last_checked_at = now()
    WHERE id = ${id} AND user_id = ${userId}
  `
}

export function decryptCreds(row: IntegrationRow): Record<string, unknown> {
  const plain = decryptSecret(row.credentials_encrypted)
  return JSON.parse(plain) as Record<string, unknown>
}

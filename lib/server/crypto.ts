import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

/**
 * AES-256-GCM helpers pra guardar segredos sensiveis (ex: WP Application Passwords).
 * Formato do ciphertext (string, URL-safe-ish): base64(iv(12) || ciphertext || tag(16)).
 *
 * Chave derivada de WORDPRESS_ENCRYPTION_KEY (env) via SHA-256.
 * Qualquer string server-side serve como chave mestre — usamos SHA-256
 * pra garantir 32 bytes independente do tamanho.
 */

function getKey(): Buffer {
  const secret =
    process.env.WORDPRESS_ENCRYPTION_KEY ||
    process.env.ENCRYPTION_KEY ||
    process.env.CLERK_SECRET_KEY // fallback dev: usar algum segredo ja existente
  if (!secret) {
    throw new Error(
      "WORDPRESS_ENCRYPTION_KEY nao configurada. Defina no env pra encriptar Application Passwords."
    )
  }
  return createHash("sha256").update(secret).digest()
}

export function encryptSecret(plain: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, ct, tag]).toString("base64")
}

export function decryptSecret(payload: string): string {
  const key = getKey()
  const buf = Buffer.from(payload, "base64")
  if (buf.length < 12 + 16 + 1) throw new Error("payload encriptado invalido (muito curto)")
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(buf.length - 16)
  const ct = buf.subarray(12, buf.length - 16)
  const decipher = createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  const pt = Buffer.concat([decipher.update(ct), decipher.final()])
  return pt.toString("utf8")
}

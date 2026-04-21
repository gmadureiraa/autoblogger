// Rate limit in-memory simples. Suficiente pra prototipo/MVP.
// Em producao serverless, trocar por Upstash Redis ou similar.

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export function checkRateLimit(
  key: string,
  { limit = 20, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt < now) {
    const bucket: Bucket = { count: 1, resetAt: now + windowMs }
    buckets.set(key, bucket)
    return { ok: true, remaining: limit - 1, resetAt: bucket.resetAt }
  }

  existing.count += 1
  if (existing.count > limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt }
  }
  return { ok: true, remaining: limit - existing.count, resetAt: existing.resetAt }
}

export function getClientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  const real = req.headers.get("x-real-ip")
  if (real) return real
  return "anonymous"
}

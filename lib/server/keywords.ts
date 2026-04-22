/**
 * Keyword research via Serper.dev (Google SERP API).
 * Usa SERPER_API_KEY do env. Sem key = retorna null (caller trata).
 *
 * Retorna um cluster editorial: main keyword, related queries, top competing titles.
 * Usado pelo endpoint /api/generate/keywords e pela UI de brainstorm.
 */

export type KeywordCluster = {
  query: string
  relatedSearches: string[]
  peopleAlsoAsk: string[]
  topTitles: string[]
  topDomains: string[]
}

type SerperResponse = {
  searchParameters?: { q: string }
  organic?: Array<{ title: string; link: string; snippet?: string }>
  peopleAlsoAsk?: Array<{ question: string; snippet?: string }>
  relatedSearches?: Array<{ query: string }>
}

export async function researchKeywords(query: string, gl = "br", hl = "pt"): Promise<KeywordCluster | null> {
  const key = process.env.SERPER_API_KEY
  if (!key) return null
  const clean = query.trim().slice(0, 160)
  if (!clean) return null
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "content-type": "application/json",
    },
    body: JSON.stringify({ q: clean, gl, hl, num: 10 }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) return null
  const data = (await res.json()) as SerperResponse
  const organic = data.organic ?? []
  return {
    query: clean,
    relatedSearches: (data.relatedSearches ?? []).map((r) => r.query).slice(0, 10),
    peopleAlsoAsk: (data.peopleAlsoAsk ?? []).map((r) => r.question).slice(0, 6),
    topTitles: organic.map((o) => o.title).slice(0, 10),
    topDomains: [...new Set(organic.map((o) => new URL(o.link).hostname.replace(/^www\./, "")))].slice(0, 10),
  }
}

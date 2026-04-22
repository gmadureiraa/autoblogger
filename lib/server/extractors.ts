/**
 * Extractors — puxam conteudo de fontes externas (URL, YouTube)
 * pra alimentar o gerador de artigos.
 *
 * Design: zero deps externas. fetch + regex. Suficiente pro escopo
 * (AutoBlogger regenera o conteudo; nao precisa parser HTML perfeito).
 */

const UA =
  "Mozilla/5.0 (compatible; AutoBlogger/1.0; +https://autoblogger-rosy.vercel.app)"

export type ExtractResult = {
  title: string | null
  text: string
  url: string
  source: "url" | "youtube"
}

/* --------------------------------------------- URL extractor */

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
}

function extractTitle(html: string): string | null {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
  if (og?.[1]) return og[1].trim()
  const tw = html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i)
  if (tw?.[1]) return tw[1].trim()
  const t = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (t?.[1]) return t[1].trim()
  return null
}

function extractArticleBody(html: string): string {
  const article = html.match(/<article[\s\S]*?<\/article>/i)
  if (article) return stripTags(article[0])
  const main = html.match(/<main[\s\S]*?<\/main>/i)
  if (main) return stripTags(main[0])
  return stripTags(html)
}

export async function extractFromUrl(url: string): Promise<ExtractResult> {
  const u = new URL(url)
  if (!/^https?:$/.test(u.protocol)) {
    throw new Error("URL invalida. Use http:// ou https://.")
  }
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`Falha ao buscar URL (${res.status})`)
  const ct = res.headers.get("content-type") ?? ""
  if (!ct.includes("text/html") && !ct.includes("application/xhtml")) {
    throw new Error(`URL nao retornou HTML (content-type: ${ct})`)
  }
  const html = await res.text()
  const title = extractTitle(html)
  const raw = extractArticleBody(html).slice(0, 15_000)
  return { title, text: raw, url, source: "url" }
}

/* --------------------------------------------- YouTube extractor */

function parseYouTubeId(input: string): string | null {
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input
  try {
    const u = new URL(input)
    if (u.hostname === "youtu.be") return u.pathname.slice(1, 12)
    if (u.hostname.endsWith("youtube.com")) {
      const v = u.searchParams.get("v")
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v
      const m = u.pathname.match(/\/(?:embed|shorts|live|v)\/([a-zA-Z0-9_-]{11})/)
      if (m) return m[1]
    }
  } catch {
    /* not a url */
  }
  return null
}

async function fetchTranscript(videoId: string, lang = "pt"): Promise<string> {
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=${lang}`, {
    headers: { "user-agent": UA, "accept-language": `${lang},en;q=0.5` },
    signal: AbortSignal.timeout(15_000),
  })
  if (!pageRes.ok) throw new Error(`YouTube page ${pageRes.status}`)
  const html = await pageRes.text()
  const tracksMatch = html.match(/"captionTracks":(\[[\s\S]*?\])/)
  if (!tracksMatch) {
    throw new Error("Esse video nao tem legendas disponiveis para extracao.")
  }
  const tracks = JSON.parse(tracksMatch[1]) as Array<{
    baseUrl: string
    languageCode: string
    kind?: string
  }>
  const pick =
    tracks.find((t) => t.languageCode === lang && t.kind !== "asr") ||
    tracks.find((t) => t.languageCode === lang) ||
    tracks.find((t) => t.languageCode === "en") ||
    tracks[0]
  if (!pick) throw new Error("Nenhuma faixa de legenda utilizavel.")

  const vttRes = await fetch(`${pick.baseUrl}&fmt=vtt`, {
    headers: { "user-agent": UA },
    signal: AbortSignal.timeout(15_000),
  })
  let raw = vttRes.ok ? await vttRes.text() : ""
  if (!raw) {
    const xmlRes = await fetch(pick.baseUrl, {
      headers: { "user-agent": UA },
      signal: AbortSignal.timeout(15_000),
    })
    if (!xmlRes.ok) throw new Error(`Captions fetch failed ${xmlRes.status}`)
    const xml = await xmlRes.text()
    raw = xml.replace(/<[^>]+>/g, " ")
  } else {
    raw = raw
      .replace(/WEBVTT[\s\S]*?\n\n/, "")
      .replace(/\d{2}:\d{2}:\d{2}\.\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}\.\d{3}[^\n]*\n/g, "")
      .replace(/<[^>]+>/g, " ")
  }
  return raw.replace(/\s+/g, " ").trim()
}

function extractYoutubeTitle(html: string): string | null {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
  if (og?.[1]) return og[1].trim()
  const t = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (t?.[1]) return t[1].replace(/ - YouTube$/i, "").trim()
  return null
}

export async function extractFromYouTube(input: string, lang = "pt"): Promise<ExtractResult> {
  const id = parseYouTubeId(input)
  if (!id) throw new Error("Nao consegui identificar o id do video do YouTube.")

  const titleRes = await fetch(`https://www.youtube.com/watch?v=${id}`, {
    headers: { "user-agent": UA, "accept-language": `${lang},en;q=0.5` },
    signal: AbortSignal.timeout(10_000),
  })
  const titleHtml = titleRes.ok ? await titleRes.text() : ""
  const title = extractYoutubeTitle(titleHtml)

  const transcript = await fetchTranscript(id, lang)
  return {
    title,
    text: transcript.slice(0, 20_000),
    url: `https://www.youtube.com/watch?v=${id}`,
    source: "youtube",
  }
}

/**
 * Utilitarios de conversao entre HTML (saida do Gemini) e Markdown.
 * Nao perfeito, mas cobre os tags que o prompt pede: h2, p, strong, em, ul, li, a.
 */

export function htmlToMarkdown(html: string): string {
  if (!html) return ""

  return html
    .replace(/<h1>(.*?)<\/h1>/gi, "\n# $1\n")
    .replace(/<h2>(.*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3>(.*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<h4>(.*?)<\/h4>/gi, "\n#### $1\n")
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em>(.*?)<\/em>/gi, "_$1_")
    .replace(/<i>(.*?)<\/i>/gi, "_$1_")
    .replace(/<a\s+href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    .replace(/<ul>/gi, "\n")
    .replace(/<\/ul>/gi, "\n")
    .replace(/<ol>/gi, "\n")
    .replace(/<\/ol>/gi, "\n")
    .replace(/<li>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<p>([\s\S]*?)<\/p>/gi, "\n$1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<hr\s*\/?>/gi, "\n---\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
}

export function wordCountFromHtml(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  return text ? text.split(" ").length : 0
}

export function formatFrontMatter(meta: Record<string, unknown>): string {
  const lines: string[] = ["---"]
  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map((v) => `"${String(v).replace(/"/g, '\\"')}"`).join(", ")}]`)
    } else if (typeof value === "object") {
      lines.push(`${key}: ${JSON.stringify(value)}`)
    } else {
      lines.push(`${key}: "${String(value).replace(/"/g, '\\"')}"`)
    }
  }
  lines.push("---")
  return lines.join("\n")
}

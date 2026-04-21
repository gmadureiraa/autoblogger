/**
 * SEO scoring simples e determinístico.
 *
 * Calcula um score de 0-100 a partir do HTML do artigo + meta description + título,
 * baseado em sinais básicos: presença de H1/H2, densidade da keyword do título,
 * contagem de palavras vs alvo, intro + conclusão, e tamanho da meta description.
 *
 * Retorna também uma lista de sugestões pra melhorar o score.
 */

import { wordCountFromHtml } from "@/lib/markdown"

export type SeoScoreInput = {
  title: string
  metaDescription: string
  bodyHtml: string
  /** Alvo de palavras (short=500, medium=1000, long=2000). */
  targetWords: number
}

export type SeoScoreResult = {
  score: number
  suggestions: string[]
  breakdown: {
    hasH1: boolean
    h2Count: number
    keywordDensity: number
    wordCount: number
    targetWords: number
    wordCountRatio: number
    hasIntro: boolean
    hasConclusion: boolean
    metaLength: number
  }
}

/** Extrai a keyword principal do título (maior token alfanum com >=4 chars, normalizado). */
function extractKeyword(title: string): string {
  const stop = new Set([
    "a", "o", "e", "de", "da", "do", "das", "dos", "em", "no", "na",
    "para", "por", "com", "sem", "como", "que", "uma", "um", "os", "as",
    "the", "and", "for", "with", "this", "that",
  ])
  const tokens = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !stop.has(t))

  if (tokens.length === 0) return title.toLowerCase().split(/\s+/)[0] ?? ""
  // Escolhe o token mais longo (heurística simples pra "palavra-chave")
  return tokens.sort((a, b) => b.length - a.length)[0]
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

/**
 * Calcula o score SEO do artigo.
 * Pesos (total 100):
 *  - estrutura H1 + H2 hierárquicos: 20
 *  - densidade keyword (0.5% - 2.5%): 20
 *  - contagem de palavras vs alvo: 25
 *  - intro + conclusão presentes: 15
 *  - meta description 120-160 chars: 20
 */
export function computeSeoScore(input: SeoScoreInput): SeoScoreResult {
  const { title, metaDescription, bodyHtml, targetWords } = input
  const html = bodyHtml || ""
  const plain = stripHtml(html).toLowerCase()
  const wordCount = wordCountFromHtml(html)

  const hasH1 = /<h1[\s>]/i.test(html)
  const h2Count = (html.match(/<h2[\s>]/gi) ?? []).length
  const h3Count = (html.match(/<h3[\s>]/gi) ?? []).length

  // Densidade da keyword principal.
  const keyword = extractKeyword(title)
  const keywordOccurrences = keyword
    ? (plain.match(new RegExp(`\\b${keyword}\\b`, "g")) ?? []).length
    : 0
  const keywordDensity = wordCount > 0 ? keywordOccurrences / wordCount : 0

  // Ratio de palavras — 1.0 é exato, penaliza curto e longo.
  const wordCountRatio = targetWords > 0 ? wordCount / targetWords : 1

  // Intro: primeiros ~200 chars do texto fora de heading.
  const firstParagraph =
    html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? ""
  const hasIntro = firstParagraph.length >= 80

  // Conclusão: procura um heading que indique fechamento OU um parágrafo final razoável.
  const conclusionPattern =
    /(conclusão|conclusao|considera[çc][õo]es finais|para finalizar|em resumo|finalizando)/i
  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
  const lastParagraph =
    paragraphs.length > 0
      ? paragraphs[paragraphs.length - 1][1].replace(/<[^>]+>/g, "").trim()
      : ""
  const hasConclusion =
    conclusionPattern.test(html) || lastParagraph.length >= 80

  const metaLength = metaDescription?.length ?? 0

  // --- Scoring ---
  let score = 0
  const suggestions: string[] = []

  // Estrutura (20 pontos): H1 (8) + H2s (12).
  if (hasH1) score += 8
  else suggestions.push("Adicione um H1 com a palavra-chave principal.")

  if (h2Count >= 3) score += 12
  else if (h2Count >= 1) {
    score += 6
    suggestions.push(`Use pelo menos 3 H2 para estruturar melhor (atual: ${h2Count}).`)
  } else {
    suggestions.push("Adicione headings H2 pra quebrar o artigo em seções.")
  }

  // Densidade keyword (20 pontos): faixa ideal 0.5% - 2.5%.
  if (keywordDensity >= 0.005 && keywordDensity <= 0.025) {
    score += 20
  } else if (keywordDensity > 0 && keywordDensity < 0.005) {
    score += 10
    suggestions.push(`Repita a keyword "${keyword}" mais vezes no texto (densidade ${(keywordDensity * 100).toFixed(2)}%).`)
  } else if (keywordDensity > 0.025) {
    score += 10
    suggestions.push(`Densidade da keyword "${keyword}" muito alta (${(keywordDensity * 100).toFixed(2)}%), evite keyword stuffing.`)
  } else {
    suggestions.push(`A keyword "${keyword}" não aparece no corpo do artigo.`)
  }

  // Word count vs alvo (25 pontos): 0.85 - 1.15 é ótimo; queda linear fora.
  if (wordCountRatio >= 0.85 && wordCountRatio <= 1.15) {
    score += 25
  } else if (wordCountRatio >= 0.7 && wordCountRatio <= 1.3) {
    score += 18
    suggestions.push(
      wordCountRatio < 1
        ? `Artigo curto (${wordCount} palavras, alvo ${targetWords}).`
        : `Artigo longo (${wordCount} palavras, alvo ${targetWords}).`
    )
  } else if (wordCountRatio >= 0.5 && wordCountRatio <= 1.5) {
    score += 10
    suggestions.push(
      wordCountRatio < 1
        ? `Artigo muito curto — expanda pra ~${targetWords} palavras.`
        : `Artigo muito longo — considere cortar pra ~${targetWords} palavras.`
    )
  } else {
    suggestions.push(`Fora do alvo de ${targetWords} palavras (atual: ${wordCount}).`)
  }

  // Intro + conclusão (15 pontos): 7 + 8.
  if (hasIntro) score += 7
  else suggestions.push("A introdução está fraca — o primeiro parágrafo precisa de pelo menos 80 caracteres.")

  if (hasConclusion) score += 8
  else suggestions.push("Adicione uma conclusão ou CTA clara no final do artigo.")

  // Meta description (20 pontos): 120-160 ideal.
  if (metaLength >= 120 && metaLength <= 160) {
    score += 20
  } else if (metaLength >= 80 && metaLength <= 180) {
    score += 12
    suggestions.push(
      metaLength < 120
        ? `Meta description curta (${metaLength} chars, ideal 120-160).`
        : `Meta description longa (${metaLength} chars, ideal 120-160).`
    )
  } else if (metaLength > 0) {
    score += 5
    suggestions.push(`Meta description fora da faixa ideal (${metaLength} chars, ideal 120-160).`)
  } else {
    suggestions.push("Adicione uma meta description de 120-160 caracteres.")
  }

  // Bônus leves fora do total (até 100 já).
  if (h3Count >= 2 && !suggestions.some((s) => s.includes("H2"))) {
    // Hierarquia H3 indica profundidade — nada a ajustar
  }

  score = Math.max(0, Math.min(100, Math.round(score)))

  return {
    score,
    suggestions,
    breakdown: {
      hasH1,
      h2Count,
      keywordDensity: Number(keywordDensity.toFixed(4)),
      wordCount,
      targetWords,
      wordCountRatio: Number(wordCountRatio.toFixed(2)),
      hasIntro,
      hasConclusion,
      metaLength,
    },
  }
}

export const LENGTH_TARGETS = {
  short: 500,
  medium: 1000,
  long: 2000,
} as const

export type ArticleLength = keyof typeof LENGTH_TARGETS

export function targetWordsFor(length?: string | null): number {
  if (!length) return LENGTH_TARGETS.medium
  const normalized = length.toLowerCase() as ArticleLength
  return LENGTH_TARGETS[normalized] ?? LENGTH_TARGETS.medium
}

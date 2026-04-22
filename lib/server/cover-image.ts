import { GoogleGenAI } from "@google/genai"

/**
 * Gera uma imagem de capa (cover) para o artigo com Imagen 4 (Google).
 *
 * Regra obrigatoria: a imagem NUNCA pode ter texto/letras/tipografia.
 * A composicao e sempre cena fotografica/ilustrativa abstrata.
 *
 * Retorna `dataUrl: data:image/png;base64,...` pro caller decidir storage
 * (inline em post.meta.coverImage, ou upload pra Blob/Supabase/etc).
 * Se nao conseguir gerar, retorna `null` — caller trata sem bloquear o fluxo.
 */
const IMAGEN_MODEL = "imagen-4.0-generate-001"

function buildPrompt(articleTitle: string, niche: string | null): string {
  const topic = articleTitle.slice(0, 200)
  const nichePart = niche ? ` Contexto: ${niche.slice(0, 120)}.` : ""
  return [
    `Editorial magazine cover photograph representing: "${topic}".${nichePart}`,
    "Cinematic lighting, shallow depth of field, high-end commercial photography.",
    "Composition: single strong subject, rule-of-thirds, negative space on top-right for editorial layout.",
    "Mood: thoughtful, premium, modern.",
    // NO-TEXT constraint enforced redundantly (mirrors /api/images + cover-scene rule).
    "CRITICAL: NO TEXT. NO LETTERS. NO WORDS. NO TYPOGRAPHY. No books with readable text, no signs, no UI screens, no captions, no watermarks, no logos, no overlays.",
  ].join(" ")
}

export async function generateCoverImage(params: {
  articleTitle: string
  niche?: string | null
  apiKey: string
}): Promise<string | null> {
  const { articleTitle, niche, apiKey } = params
  if (!apiKey) return null
  try {
    const ai = new GoogleGenAI({ apiKey })
    const prompt = buildPrompt(articleTitle, niche ?? null)
    const response = await ai.models.generateImages({
      model: IMAGEN_MODEL,
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "16:9",
      },
    })
    const img = response.generatedImages?.[0]?.image
    const bytes = img?.imageBytes
    const mime = img?.mimeType ?? "image/png"
    if (!bytes) return null
    return `data:${mime};base64,${bytes}`
  } catch (err) {
    console.warn("[cover-image] failed:", err)
    return null
  }
}

import { GoogleGenAI } from "@google/genai"
import { createHash } from "node:crypto"

/**
 * Gera uma imagem de capa (cover) para o artigo com Imagen 4 (Google).
 *
 * Estilos suportados (todos sem texto/letras):
 *   - "brutalist" (default): identidade do AutoBlogger — verde #10b981 + dark + ASCII vibes
 *   - "editorial": foto realística cinematográfica
 *   - "abstract": gradientes + formas geométricas, sem objeto
 *
 * Retorna `dataUrl: data:image/png;base64,...` pro caller decidir storage.
 * Se não conseguir gerar, retorna `null` — caller trata sem bloquear o fluxo.
 *
 * Cache: usa sha256(title|style|niche) como seed determinística. Caller pode
 * salvar isso em posts.cover_seed pra detectar regenerações idênticas.
 */
const IMAGEN_MODEL = "imagen-4.0-generate-001"

export type CoverStyle = "brutalist" | "editorial" | "abstract"

export const COVER_STYLES: Array<{
  id: CoverStyle
  label: string
  description: string
}> = [
  {
    id: "brutalist",
    label: "Brutalist",
    description: "Verde + preto + ASCII (identidade AutoBlogger)",
  },
  {
    id: "editorial",
    label: "Editorial",
    description: "Foto realística + tom premium",
  },
  {
    id: "abstract",
    label: "Abstract",
    description: "Gradientes + formas geométricas",
  },
]

const NEGATIVE_PROMPT_UNIVERSAL =
  "no text, no letters, no words, no typography, no human faces, no logos, no watermark, no readable text, no UI screens, no captions, no overlays, no AI artifacts, no extra fingers, no distorted geometry"

function buildPrompt(args: {
  articleTitle: string
  niche: string | null
  style: CoverStyle
}): string {
  const { articleTitle, niche, style } = args
  const topic = articleTitle.slice(0, 200)
  const nichePart = niche ? ` Contexto temático: ${niche.slice(0, 120)}.` : ""

  const baseSubject = `Cover image for the article: "${topic}".${nichePart}`

  const styleDirectives: Record<CoverStyle, string[]> = {
    brutalist: [
      "STYLE: brutalist tech minimalism, dark almost-black background (#0a0a0a) with vibrant green #10b981 accent shapes.",
      "Sharp geometric shapes, monospace grid patterns, subtle CRT scanline / pixel aesthetic, slight digital glitch hints.",
      "Composition: bold geometric primary element on the left third, negative space top-right, rule-of-thirds framing.",
      "Mood: technical, raw, code-editor energy, hacker aesthetic, very Firecrawl/Vercel/Linear vibes.",
      "Render style: flat vector with subtle dot-grid texture, tiny dithering noise, high contrast.",
    ],
    editorial: [
      "STYLE: editorial magazine cover photograph, cinematic lighting, shallow depth of field, high-end commercial photography.",
      "Composition: single strong subject, rule-of-thirds, negative space top-right for editorial layout.",
      "Mood: thoughtful, premium, modern, sophisticated.",
      "Color palette: rich, saturated, slight cinematic teal-orange grade, but green #10b981 must appear as a subtle accent (object or light).",
    ],
    abstract: [
      "STYLE: pure abstract composition, no representational subject. Smooth gradient washes intersected by sharp geometric shapes.",
      "Color palette: dark background fading to deep emerald, primary accent #10b981 in geometric shards, secondary lime highlights.",
      "Composition: dynamic diagonal flow, suggestion of depth via overlapping translucent layers.",
      "Mood: contemplative, futuristic, design-system poster, very Bauhaus-meets-tech.",
    ],
  }

  return [
    baseSubject,
    ...styleDirectives[style],
    "Aspect ratio: 16:9 widescreen.",
    `CRITICAL: ${NEGATIVE_PROMPT_UNIVERSAL}.`,
  ].join(" ")
}

export function coverSeed(args: {
  articleTitle: string
  style: CoverStyle
  niche?: string | null
}): string {
  const key = `${args.articleTitle.toLowerCase().trim()}|${args.style}|${args.niche ?? ""}`
  return createHash("sha256").update(key).digest("hex").slice(0, 16)
}

export async function generateCoverImage(params: {
  articleTitle: string
  niche?: string | null
  apiKey: string
  style?: CoverStyle
}): Promise<{ dataUrl: string; seed: string; style: CoverStyle } | null> {
  const { articleTitle, niche, apiKey } = params
  const style: CoverStyle = params.style ?? "brutalist"
  if (!apiKey) return null
  try {
    const ai = new GoogleGenAI({ apiKey })
    const prompt = buildPrompt({ articleTitle, niche: niche ?? null, style })
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
    return {
      dataUrl: `data:${mime};base64,${bytes}`,
      seed: coverSeed({ articleTitle, style, niche }),
      style,
    }
  } catch (err) {
    console.warn("[cover-image] failed:", err)
    return null
  }
}

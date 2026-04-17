import { GoogleGenAI } from "@google/genai"

export interface ArticleOutput {
  title: string
  metaDescription: string
  headings: string[]
  body: string
  internalLinks: string[]
  seoScore: number
  tips: string[]
}

const SYSTEM_PROMPT = `Voce e um redator SEO especialista. Gere artigos otimizados para blog.

REGRAS:
- Titulo: maximo 60 caracteres, com palavra-chave principal
- Meta description: maximo 155 caracteres, persuasiva
- Use headings H2 logicos e semanticos (minimo 3, maximo 8)
- Body: artigo completo com 800-1500 palavras, bem estruturado com paragrafos curtos
- Inclua sugestoes de internal links (topicos relacionados)
- De um SEO score de 0 a 100
- Inclua dicas de melhoria

Responda APENAS em JSON valido no formato:
{
  "title": "string",
  "metaDescription": "string",
  "headings": ["H2 1", "H2 2", "H2 3"],
  "body": "string (HTML com tags <h2>, <p>, <strong>, <em>, <ul>, <li>)",
  "internalLinks": ["topico 1", "topico 2"],
  "seoScore": number,
  "tips": ["dica 1", "dica 2"]
}`

export async function generateArticleFromTopic(
  topic: string,
  tone: string,
  apiKey: string
): Promise<ArticleOutput> {
  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Gere um artigo completo para blog sobre: "${topic}"\nTom: ${tone}\n\nResponda APENAS em JSON valido.`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  })

  const text = response.text ?? ""
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("Falha ao parsear resposta da IA")
  }

  return JSON.parse(jsonMatch[0]) as ArticleOutput
}

export async function generateArticleFromUrl(
  url: string,
  tone: string,
  apiKey: string
): Promise<ArticleOutput> {
  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Analise a URL "${url}" e gere um artigo original e otimizado para SEO baseado no mesmo tema/nicho. NAO copie o conteudo - crie algo novo e melhor.\nTom: ${tone}\n\nResponda APENAS em JSON valido.`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  })

  const text = response.text ?? ""
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("Falha ao parsear resposta da IA")
  }

  return JSON.parse(jsonMatch[0]) as ArticleOutput
}

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

const MODEL = "gemini-2.5-flash"

function buildSystemPrompt(targetWords: number, tone: string): string {
  return `Você é um redator SEO experiente escrevendo em português brasileiro.

REGRAS DE ESTRUTURA:
- Título: máximo 60 caracteres, natural, contém a keyword principal.
- Meta description: 120-160 caracteres, persuasiva, com CTA sutil.
- Estrutura: H2 (3-6) com H3 aninhados quando fizer sentido. Não use H1 no corpo.
- Introdução: hook curto (1-2 parágrafos) que puxa o leitor.
- Desenvolvimento: parágrafos curtos (2-4 linhas), bullets (<ul><li>) quando tiver lista ou etapas.
- Conclusão: fechamento + CTA claro (assinar, ler próximo artigo, aplicar o aprendizado).
- Meta: inclui "internalLinks" com sugestões de tópicos relacionados (4-6).

CONTAGEM DE PALAVRAS:
- Alvo: ${targetWords} palavras no corpo. Mire em ~${targetWords} (margem de 15%).

TOM:
- ${tone}. Direto, sem jargão desnecessário, exemplos concretos quando possível.

FORMATO DE RESPOSTA:
Responda APENAS JSON válido, sem markdown, sem backticks, neste formato exato:
{
  "title": "string",
  "metaDescription": "string",
  "headings": ["H2 1", "H2 2"],
  "body": "HTML com <h2>, <h3>, <p>, <strong>, <em>, <ul>, <li>. SEM <html>, <body>, SEM <h1>.",
  "internalLinks": ["tópico 1", "tópico 2"],
  "seoScore": number,
  "tips": ["dica 1", "dica 2"]
}`
}

function parseJson(text: string): ArticleOutput {
  // Tenta achar um bloco JSON {...} mesmo se o modelo envelopar em markdown.
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "")
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("Falha ao parsear resposta da IA (sem JSON).")
  return JSON.parse(match[0]) as ArticleOutput
}

type GenerateArgs = {
  contents: string
  targetWords: number
  tone: string
  apiKey: string
}

async function callGemini({ contents, targetWords, tone, apiKey }: GenerateArgs): Promise<ArticleOutput> {
  const ai = new GoogleGenAI({ apiKey })
  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: {
      systemInstruction: buildSystemPrompt(targetWords, tone),
      temperature: 0.7,
      maxOutputTokens: 8192,
      // thinkingBudget 0 = desliga o thinking em 2.5 Flash (mais rápido e barato)
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
    },
  })

  const text = response.text ?? ""
  if (!text) throw new Error("Gemini retornou resposta vazia.")
  return parseJson(text)
}

/**
 * Geração principal — contrato novo: recebe título/nicho/tom/tamanho explícitos.
 */
export async function generateArticle(params: {
  title: string
  niche?: string | null
  tone: string
  targetWords: number
  apiKey: string
}): Promise<ArticleOutput> {
  const { title, niche, tone, targetWords, apiKey } = params
  const nichePart = niche ? `\nNicho / contexto do blog: ${niche}.` : ""
  const contents = `Escreva um artigo SEO completo em português brasileiro.
Título (ou tópico base): "${title}".${nichePart}
Tom: ${tone}.
Alvo de palavras no corpo: ${targetWords}.
Estrutura: introdução com hook, ${Math.max(3, Math.round(targetWords / 250))} seções H2, conclusão com CTA.`
  return callGemini({ contents, targetWords, tone, apiKey })
}

/**
 * Legado — gera a partir de um tópico livre (compatibilidade com UI `/gerar`).
 */
export async function generateArticleFromTopic(
  topic: string,
  tone: string,
  apiKey: string,
  targetWords = 1000
): Promise<ArticleOutput> {
  const contents = `Gere um artigo completo para blog sobre: "${topic}".
Tom: ${tone}.
Alvo de palavras no corpo: ${targetWords}.`
  return callGemini({ contents, targetWords, tone, apiKey })
}

/**
 * Legado — gera a partir de uma URL de referência.
 */
export async function generateArticleFromUrl(
  url: string,
  tone: string,
  apiKey: string,
  targetWords = 1000
): Promise<ArticleOutput> {
  const contents = `Analise a URL "${url}" e gere um artigo original e otimizado para SEO baseado no mesmo tema/nicho. NÃO copie o conteúdo — crie algo novo e melhor.
Tom: ${tone}.
Alvo de palavras no corpo: ${targetWords}.`
  return callGemini({ contents, targetWords, tone, apiKey })
}

/**
 * Novo — gera a partir de conteudo ja extraido (URL, transcript YouTube etc).
 * Regenera com voz propria, nao copia. Usa o material como fonte/insumo.
 */
export async function generateArticleFromSource(params: {
  sourceTitle: string | null
  sourceText: string
  sourceUrl: string
  sourceKind: "url" | "youtube"
  tone: string
  targetWords: number
  niche?: string | null
  apiKey: string
}): Promise<ArticleOutput> {
  const { sourceTitle, sourceText, sourceUrl, sourceKind, tone, targetWords, niche, apiKey } = params
  const nichePart = niche ? `\nNicho do blog: ${niche}.` : ""
  const kindLabel = sourceKind === "youtube" ? "transcricao de video do YouTube" : "conteudo de artigo web"
  const titleHint = sourceTitle ? `\nTitulo original: "${sourceTitle}".` : ""
  const contents = `Use a ${kindLabel} abaixo como insumo de pesquisa e escreva um artigo ORIGINAL em portugues brasileiro.
NAO copie frases literalmente. Reescreva com voz propria, adicione contexto, exemplos e estrutura SEO.
Cite a fonte uma vez no fim em <p><em>Fonte: <a href="${sourceUrl}">${sourceUrl}</a></em></p>.${titleHint}${nichePart}
Tom: ${tone}.
Alvo de palavras no corpo: ${targetWords}.

--- MATERIAL BRUTO (insumo, nao reproduza) ---
${sourceText.slice(0, 12_000)}
--- FIM DO MATERIAL ---`
  return callGemini({ contents, targetWords, tone, apiKey })
}

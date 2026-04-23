import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { GoogleGenAI } from "@google/genai"
import { checkRateLimit, getClientKey } from "@/lib/server/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const MODEL = "gemini-2.5-flash"

export type RoastDimension = {
  name: string
  score: number // 0-10
  verdict: string
}

export type RoastReport = {
  name: string
  verdictOneLiner: string
  overallScore: number // 0-10
  dimensions: RoastDimension[]
  killers: string[]
  saviors: string[]
  finalVerdict: string
  sarcasticTagline: string
}

const SYSTEM_INSTRUCTION = `Voce e o "Coveiro de Startups" — um analista brutal, inspirado nos investidores mais cinicos do Vale do Silicio e no tom editorial do The Information + Paul Graham quando tira onda.

SEU TRABALHO:
Receber a descricao de uma startup e entregar uma autopsia preventiva — o que vai mata-la, o que pode salva-la, e uma nota honesta.

TOM:
- Direto, inteligente, levemente sarcastico. Nunca gratuito.
- Humor dark estilo "eu te respeito, por isso vou ser honesto".
- Portugues brasileiro, frases curtas, zero enrolacao.
- Use exemplos de casos reais famosos (Juicero, Theranos, Quibi, WeWork) quando servir.
- Cada critica deve vir com um PORQUE. Nada vago.

METODOLOGIA:
Avalie em 5 dimensoes, notas 0-10:
1. Proposta de valor (o problema e real? dor quente?)
2. Diferenciacao (e uma feature ou e um produto?)
3. Modelo de negocio (a conta fecha? CAC vs LTV?)
4. Timing de mercado (muito cedo? muito tarde? tendencia clara?)
5. Barreira de entrada (moat real ou copiavel em 3 meses?)

Depois liste:
- KILLERS: 5-8 pontos que provavelmente vao matar a startup, cada um em 1-2 frases concretas
- SAVIORS: 3 recomendacoes concretas pra virar o jogo, cada uma acionavel em 30 dias

Nota geral = media ponderada das 5 dimensoes, arredondada a 1 decimal.

FORMATO DE SAIDA (JSON puro, sem markdown, sem backticks):
{
  "name": "string — nome/slug da startup como foi enviado",
  "verdictOneLiner": "string — 1 frase brutal que resume o diagnostico (max 120 chars)",
  "overallScore": number 0-10 (uma decimal ok),
  "dimensions": [
    {"name":"Proposta de valor","score":0-10,"verdict":"1-2 frases com porque"},
    {"name":"Diferenciacao","score":0-10,"verdict":"..."},
    {"name":"Modelo de negocio","score":0-10,"verdict":"..."},
    {"name":"Timing","score":0-10,"verdict":"..."},
    {"name":"Barreira de entrada","score":0-10,"verdict":"..."}
  ],
  "killers": ["5 a 8 frases curtas", "..."],
  "saviors": ["3 recomendacoes concretas", "..."],
  "finalVerdict": "parágrafo final de 3-5 frases, brutal mas construtivo",
  "sarcasticTagline": "frase de 8-12 palavras em caixa baixa, estilo lapide/tombstone"
}

REGRA ABSOLUTA: responda APENAS JSON valido. Sem texto antes, sem texto depois, sem markdown.`

function parseJson(text: string): RoastReport {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "")
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("Falha ao parsear resposta (sem JSON).")
  const parsed = JSON.parse(match[0]) as RoastReport

  // Validacao leve + defaults
  if (!parsed.dimensions || !Array.isArray(parsed.dimensions)) {
    throw new Error("Resposta sem dimensoes.")
  }
  parsed.killers = Array.isArray(parsed.killers) ? parsed.killers : []
  parsed.saviors = Array.isArray(parsed.saviors) ? parsed.saviors : []
  parsed.overallScore = Number(parsed.overallScore) || 0
  return parsed
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    const clientKey = userId || getClientKey(request)
    const limited = checkRateLimit(`destrua:${clientKey}`, { limit: 10, windowMs: 60_000 })
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Devagar, Elon. 10 startups por minuto ja da." },
        { status: 429 }
      )
    }

    const body = (await request.json().catch(() => ({}))) as {
      name?: string
      pitch?: string
      url?: string
      targetMarket?: string
      businessModel?: string
    }

    const name = (body.name || "").trim()
    const pitch = (body.pitch || "").trim()
    if (!name || !pitch || pitch.length < 30) {
      return NextResponse.json(
        { error: "Envie 'name' e 'pitch' (minimo 30 caracteres descrevendo o que faz)." },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey === "your-key-here") {
      return NextResponse.json(
        { error: "GEMINI_API_KEY nao configurada no servidor." },
        { status: 503 }
      )
    }

    const userContent = [
      `Startup: ${name}`,
      body.url ? `URL: ${body.url}` : "",
      body.targetMarket ? `Publico-alvo: ${body.targetMarket}` : "",
      body.businessModel ? `Modelo de negocio: ${body.businessModel}` : "",
      "",
      "Pitch / descricao:",
      pitch,
    ]
      .filter(Boolean)
      .join("\n")

    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: userContent,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.85,
        maxOutputTokens: 2400,
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
      },
    })

    const text = response.text ?? ""
    if (!text) throw new Error("Gemini retornou resposta vazia.")
    const report = parseJson(text)
    // Garante que o name do report casa com o input
    report.name = report.name || name

    return NextResponse.json(report)
  } catch (error: unknown) {
    console.error("[/api/destrua-startup] error:", error)
    const message = error instanceof Error ? error.message : "Erro ao gerar autopsia."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

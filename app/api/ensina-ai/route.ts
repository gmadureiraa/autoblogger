import { NextRequest } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { GoogleGenAI } from "@google/genai"
import { checkRateLimit, getClientKey } from "@/lib/server/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const MODEL = "gemini-2.5-flash"

type ChatMessage = { role: "user" | "model"; text: string }

const SYSTEM_INSTRUCTION = `Voce e o "Ensina AI" — o tutor oficial do AutoBlogger, especialista em SEO, content marketing, blogging, WordPress, IA generativa e copywriting.

PERFIL:
- Fala em portugues brasileiro.
- Direto, pratico, sem enrolar.
- Exemplos concretos sempre que possivel (numeros, nomes reais, URLs, templates).
- Corta jargao. Quando usar termo tecnico, explica em 1 linha.
- Tom: mentor que respeita o tempo do aluno. Nunca condescendente.

COMO ENSINAR:
1. Entenda a pergunta. Se vaga, pergunte 1 coisa especifica.
2. Responda em blocos curtos: 1 tese + 2-4 bullets/steps + 1 exemplo.
3. Quando o usuario pedir passo a passo, entregue numerado com acoes concretas.
4. Quando for comparar ferramentas ou estrategias, use tabela simples.
5. Se a duvida for sobre o AutoBlogger (este produto), explique com referencia a rotas reais: /gerar (gera artigo), /artigos (lista), /blog/[handle] (blog publico), /integrations/wordpress, /settings.
6. Sempre que couber, termine com "Proximo passo:" dando 1 acao imediata.

FORMATACAO:
- Use markdown: **negrito** para keywords, \`inline\` para comandos, listas numeradas para steps, listas com "-" para bullets.
- Nunca use emojis decorativos. Pode usar -> para indicar fluxo.
- Limite de 350 palavras por resposta, salvo pedido explicito de aprofundar.

REGRAS:
- Se perguntarem algo fora de SEO/blog/IA/marketing/autoblogger, responda curto e puxe de volta ("Posso ajudar com SEO, blog e IA. Sua duvida casa com isso? Exemplo: ...").
- Nao invente metricas. Quando citar dado, diga "benchmark do setor" ou "faixa comum".
- Quando recomendar ferramenta, mencione o trade-off em 1 linha.`

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    const clientKey = userId || getClientKey(request)
    const limited = checkRateLimit(`ensina-ai:${clientKey}`, { limit: 20, windowMs: 60_000 })
    if (!limited.ok) {
      return Response.json(
        { error: "Muitas perguntas. Espera 1 minuto e tenta de novo." },
        { status: 429 }
      )
    }

    const body = (await request.json().catch(() => ({}))) as {
      messages?: ChatMessage[]
      message?: string
    }

    const history: ChatMessage[] = Array.isArray(body.messages) ? body.messages : []
    const lastMsg = body.message?.trim() || ""
    if (!lastMsg && history.length === 0) {
      return Response.json({ error: "Envie uma pergunta." }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey === "your-key-here") {
      return Response.json(
        { error: "GEMINI_API_KEY nao configurada no servidor." },
        { status: 503 }
      )
    }

    const contents = [
      ...history.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      })),
      ...(lastMsg
        ? [{ role: "user" as const, parts: [{ text: lastMsg }] }]
        : []),
    ]

    const ai = new GoogleGenAI({ apiKey })
    const streamResp = await ai.models.generateContentStream({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.6,
        maxOutputTokens: 1400,
        thinkingConfig: { thinkingBudget: 0 },
      },
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResp) {
            const text = chunk.text ?? ""
            if (text) controller.enqueue(encoder.encode(text))
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (error: unknown) {
    console.error("[/api/ensina-ai] error:", error)
    const message = error instanceof Error ? error.message : "Erro ao responder."
    return Response.json({ error: message }, { status: 500 })
  }
}

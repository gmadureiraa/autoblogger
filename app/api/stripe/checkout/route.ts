import { NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/server/auth-helpers"

/**
 * Stub de Stripe Checkout.
 * Enquanto STRIPE_SECRET_KEY nao for configurada, retorna 501.
 * Quando Gabriel plugar Stripe, implementa a criacao de session aqui.
 */
export async function POST(req: Request) {
  const auth = await requireAuthenticatedUser(req)
  if (auth.response) return auth.response

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json(
      {
        error:
          "Billing ainda nao foi configurado. Plugue STRIPE_SECRET_KEY no Vercel para ativar.",
      },
      { status: 501 }
    )
  }

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    // body opcional
  }

  // TODO: Gabriel — quando quiser ativar, criar a session aqui:
  // const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" })
  // const session = await stripe.checkout.sessions.create({ ... })
  // return NextResponse.json({ url: session.url })

  return NextResponse.json(
    {
      error: "Stripe Checkout nao implementado ainda. Plugue a lib stripe e ative aqui.",
      receivedPlan: body?.plan ?? null,
    },
    { status: 501 }
  )
}

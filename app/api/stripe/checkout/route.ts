import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getStripe, PLAN_CONFIG, type Plan } from "@/lib/stripe"
import { ensureProfile, sql } from "@/lib/neon"

/**
 * POST /api/stripe/checkout
 *
 * Body: { plan: "pro" | "agency" }
 * Retorna: { url } (URL do Stripe Checkout) ou 503 se Stripe não tá configurado.
 *
 * Usa price IDs do Stripe via env:
 *   STRIPE_PRICE_ID_PRO, STRIPE_PRICE_ID_AGENCY
 * Se o price ID não existir no env, cria price_data inline com o valor do PLAN_CONFIG
 * (funciona pra dev, mas em prod você quer price IDs fixos).
 *
 * IMPORTANTE: requer coluna `profiles.stripe_customer_id` (migration
 * supabase/migrations/20260420_add_stripe_customer_id.sql). Sem ela, o fallback
 * antigo `meta->>'stripe_customer_id'` duplicava customers no Stripe a cada checkout.
 */
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: "Billing não configurado. Defina STRIPE_SECRET_KEY no env pra ativar." },
      { status: 503 }
    )
  }

  let body: { plan?: Plan } = {}
  try {
    body = await req.json()
  } catch {
    // body opcional
  }
  const plan = body.plan
  if (!plan || (plan !== "pro" && plan !== "agency")) {
    return NextResponse.json({ error: "Plano inválido. Use 'pro' ou 'agency'." }, { status: 400 })
  }

  const cfg = PLAN_CONFIG[plan]

  // Garante profile (pode ser primeiro acesso).
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null
  await ensureProfile({
    clerkUserId: userId,
    email,
    name: user?.fullName ?? user?.username ?? null,
    avatarUrl: user?.imageUrl ?? null,
  })

  // Customer id persistente (evita duplicatas no Stripe).
  // Le direto da coluna dedicada `stripe_customer_id` (adicionada na migration
  // 20260420_add_stripe_customer_id.sql). Fallback pra null se a migration ainda
  // nao rodou — primeiro checkout criaria customer novo, webhook persiste depois.
  let stripeCustomerId: string | null = null
  try {
    const rows = await sql<{ stripe_customer_id: string | null }[]>`
      SELECT stripe_customer_id
      FROM profiles WHERE id = ${userId} LIMIT 1
    `
    stripeCustomerId = rows[0]?.stripe_customer_id ?? null
  } catch (err) {
    // Se a coluna ainda nao existe (migration nao rodada), loga e segue.
    console.warn("[stripe/checkout] failed to read stripe_customer_id, criando customer novo:", err)
  }

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: email ?? undefined,
      metadata: { clerk_user_id: userId },
    })
    stripeCustomerId = customer.id

    // Persiste no profile pra reuso nos proximos checkouts.
    try {
      await sql`
        UPDATE profiles
        SET stripe_customer_id = ${stripeCustomerId}, updated_at = now()
        WHERE id = ${userId}
      `
    } catch (err) {
      // Falha silenciosa: webhook tambem popula via event.data.object.customer
      console.warn("[stripe/checkout] failed to persist stripe_customer_id:", err)
    }
  }

  const priceId = process.env[cfg.envPriceId]
  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [
      priceId
        ? { price: priceId, quantity: 1 }
        : {
            // Fallback dev: cria price inline. Em prod, use price IDs fixos.
            price_data: {
              currency: "usd",
              recurring: { interval: "month" },
              product_data: {
                name: `AutoBlogger ${cfg.name}`,
                description: cfg.description,
              },
              unit_amount: Math.round(cfg.priceUsd * 100),
            },
            quantity: 1,
          },
    ],
    success_url: `${origin}/settings?checkout=success&plan=${plan}`,
    cancel_url: `${origin}/settings?checkout=cancel`,
    client_reference_id: userId,
    metadata: { clerk_user_id: userId, plan },
    subscription_data: {
      metadata: { clerk_user_id: userId, plan },
    },
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url, sessionId: session.id })
}

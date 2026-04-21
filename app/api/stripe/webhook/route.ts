import { NextResponse } from "next/server"
import { getStripe, postsLimitForPlan, type Plan } from "@/lib/stripe"
import { sql } from "@/lib/neon"
import type Stripe from "stripe"

/**
 * POST /api/stripe/webhook
 *
 * Eventos tratados:
 *   - checkout.session.completed            → ativa plano pro/agency
 *   - customer.subscription.updated         → sincroniza plano (upgrade/downgrade)
 *   - customer.subscription.deleted         → volta pro free
 *
 * Requer STRIPE_WEBHOOK_SECRET pra validar assinatura. Se faltar, retorna 503.
 * Não quebra o build — `stripe` só é chamado dentro do handler.
 */
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function updateProfilePlan(clerkUserId: string, plan: Plan) {
  const limit = postsLimitForPlan(plan)
  await sql`
    UPDATE profiles
    SET plan = ${plan}, posts_limit = ${limit}, updated_at = now()
    WHERE id = ${clerkUserId}
  `
}

/**
 * Persiste o stripe_customer_id no profile (caso ainda nao esteja salvo).
 * Safe: se a coluna nao existe (migration nao rodada), apenas loga e segue.
 */
async function persistStripeCustomerId(clerkUserId: string, customerId: string) {
  try {
    await sql`
      UPDATE profiles
      SET stripe_customer_id = ${customerId}, updated_at = now()
      WHERE id = ${clerkUserId} AND (stripe_customer_id IS NULL OR stripe_customer_id <> ${customerId})
    `
  } catch (err) {
    console.warn("[stripe webhook] failed to persist stripe_customer_id:", err)
  }
}

function planFromSubscription(sub: Stripe.Subscription): Plan {
  const metaPlan = sub.metadata?.plan
  if (metaPlan === "pro" || metaPlan === "agency") return metaPlan

  // Fallback: decide pelo valor do primeiro item.
  const amount = sub.items?.data?.[0]?.price?.unit_amount ?? 0
  if (amount >= 4000) return "agency"
  if (amount >= 1000) return "pro"
  return "free"
}

export async function POST(req: Request) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe não configurado (STRIPE_SECRET_KEY ausente)." },
      { status: 503 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET ausente." },
      { status: 503 }
    )
  }

  const sig = req.headers.get("stripe-signature")
  if (!sig) {
    return NextResponse.json({ error: "Assinatura ausente." }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "erro de verificação"
    console.error("[stripe webhook] invalid signature:", msg)
    return NextResponse.json({ error: `Webhook inválido: ${msg}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const clerkUserId =
          (session.client_reference_id as string | null) ||
          (session.metadata?.clerk_user_id as string | undefined)
        const plan = (session.metadata?.plan as Plan | undefined) ?? "pro"
        if (!clerkUserId) {
          console.warn("[stripe webhook] checkout sem clerk_user_id")
          break
        }
        await updateProfilePlan(clerkUserId, plan)
        // Persiste customer id no profile pra reuso nos proximos checkouts.
        const customerId = typeof session.customer === "string" ? session.customer : null
        if (customerId) {
          await persistStripeCustomerId(clerkUserId, customerId)
        }
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const clerkUserId = sub.metadata?.clerk_user_id
        if (!clerkUserId) {
          console.warn("[stripe webhook] subscription sem clerk_user_id na metadata")
          break
        }
        // Se cancelou (status canceled/incomplete_expired), volta pro free.
        const isActive = sub.status === "active" || sub.status === "trialing"
        const plan: Plan = isActive ? planFromSubscription(sub) : "free"
        await updateProfilePlan(clerkUserId, plan)
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const clerkUserId = sub.metadata?.clerk_user_id
        if (!clerkUserId) break
        await updateProfilePlan(clerkUserId, "free")
        break
      }

      default:
        // eventos que não precisamos tratar
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[stripe webhook] handler error:", err)
    const msg = err instanceof Error ? err.message : "erro"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

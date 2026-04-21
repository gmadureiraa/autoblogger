import Stripe from "stripe"

/**
 * Cliente Stripe server-side. Usa STRIPE_SECRET_KEY do env.
 * Retorna `null` se a key não estiver configurada — o caller trata com 503.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key, {
    apiVersion: "2026-03-25.dahlia",
    typescript: true,
  })
}

export type Plan = "free" | "pro" | "agency"

export const PLAN_CONFIG: Record<Exclude<Plan, "free">, {
  name: string
  priceUsd: number
  postsLimit: number
  envPriceId: string
  description: string
}> = {
  pro: {
    name: "Pro",
    priceUsd: 19.99,
    postsLimit: 50,
    envPriceId: "STRIPE_PRICE_ID_PRO",
    description: "50 artigos por mês, suporte prioritário.",
  },
  agency: {
    name: "Agency",
    priceUsd: 49.99,
    postsLimit: 200,
    envPriceId: "STRIPE_PRICE_ID_AGENCY",
    description: "200 artigos por mês, multi-blog.",
  },
}

export function postsLimitForPlan(plan: Plan): number {
  if (plan === "pro") return PLAN_CONFIG.pro.postsLimit
  if (plan === "agency") return PLAN_CONFIG.agency.postsLimit
  return 5 // free
}

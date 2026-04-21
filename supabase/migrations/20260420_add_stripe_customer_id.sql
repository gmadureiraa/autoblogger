-- ============================================================
-- AutoBlogger — Adiciona coluna stripe_customer_id em profiles
-- ============================================================
-- Contexto: /app/api/stripe/checkout/route.ts tentava fazer
--   SELECT meta->>'stripe_customer_id' FROM profiles
-- mas a coluna `meta` nao existe no schema `profiles` (so em `posts`).
-- O .catch(() => []) mascarava o erro e criava um customer NOVO no
-- Stripe a cada checkout — gerando customers duplicados.
--
-- Esta migration:
--  1. Adiciona coluna `stripe_customer_id text` em `profiles`
--  2. Cria indice pra lookups rapidos no webhook
--
-- Idempotente: pode rodar multiplas vezes sem quebrar.
--
-- Como rodar (DB = Neon):
--   psql "$DATABASE_URL" -f supabase/migrations/20260420_add_stripe_customer_id.sql
-- ou atraves do console do Neon.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

COMMENT ON COLUMN profiles.stripe_customer_id IS
  'Stripe customer id (cus_xxx). Preenchido no 1o checkout e reusado nos seguintes pra nao duplicar customers.';

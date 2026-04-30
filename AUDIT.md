# AutoBlogger — Audit Técnico

**Data:** 2026-04-21
**Escopo:** `/Users/gabrielmadureira/GOS/02 - PROJETOS PESSOAIS/043 - AUTOBLOGGER/autoblogger-new`
**URL prod:** https://autoblogger-rosy.vercel.app
**Stack:** Next.js 16.1.6 (Turbopack) · React 19.2 · Clerk v7 · Neon Postgres · Gemini 2.5 Flash · Stripe 22 · Tailwind 3.4 · Shadcn/ui
**Modo:** read-only. Nada foi alterado no código.

---

## TL;DR

O projeto builda limpo (exit 0, 12 páginas), roda em produção (HTTP/2 200) e tem uma stack moderna montada de forma razoável. Clerk + Neon + Gemini + Stripe estão **todos presentes** e tecnicamente corretos, mas há **problemas sérios de segurança** (rota `/api/generate` aceita apiKey do body sem auth + não tem rate limit por IP+user robusto), um **misfit estrutural na integração Clerk↔Stripe** (coluna `stripe_customer_id` não existe no schema, webhook depende de metadata em runtime), um **bloqueio editorial de landing page** (preços da landing `$99/$149` não batem com `$19.99/$49.99` do código), e **deprecação do Next 16** que precisa de migração `middleware.ts → proxy.ts` antes da v17. Pricing, fluxo de API Key na UI e persistência anônima em localStorage têm UX confusa e precisam de convergência.

---

## Sumário dos comandos executados

| Comando | Resultado |
|---|---|
| `bun run build` | ✅ exit 0 · 2.4s compile · 12 páginas geradas · **warning crítico**: `"middleware" file convention is deprecated. Please use "proxy" instead` · `Skipping validation of types` (ignoreBuildErrors=true) |
| `curl -I https://autoblogger-rosy.vercel.app` | ✅ HTTP/2 200 · `x-vercel-cache: PRERENDER` · `x-clerk-auth-status: signed-out` · Cache: `public, max-age=0, must-revalidate` (sem ISR) |
| `curl -I /sitemap.xml` | ✅ 200 · `content-length: 945` (só rotas estáticas no momento, DB vazio) |
| `curl -I /api/profile` | ✅ 401 retornado corretamente quando sem cookie Clerk |
| `vercel env ls production` | ⚠️ **Só 8 vars em prod**: Clerk (6) + DATABASE_URL + DATABASE_REST_URL. **Faltam**: `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO`, `STRIPE_PRICE_ID_AGENCY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` |

---

## 1. Build

**Status:** ✅ passa · ⚠️ 2 warnings relevantes

- **Next 16.1.6 + Turbopack** como default. Compile em 2.4s, SSG em 1.4s para 12 rotas.
- **⚠️ Middleware deprecado**: o build loga `The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy`. O `middleware.ts` ainda roda em Next 16 (backward-compat), mas **Next 17 vai quebrar**. Fix: renomear `middleware.ts` → `proxy.ts`, trocar `import { clerkMiddleware }` → `import { clerkMiddleware }` (export pattern idêntico; o Clerk v7 já exporta `clerkMiddleware` que funciona nos dois nomes). Também trocar `export default clerkMiddleware()` dentro de `proxy.ts`.
- **⚠️ `typescript.ignoreBuildErrors: true`** em `next.config.mjs`: build não valida types. Há um `@ts-expect-error` em `app/api/posts/[id]/route.ts:46` que esconde um tipo inferido frouxo — aceitável, mas com ignoreBuildErrors nada protege regressões.
- **Rotas**: 6 estáticas (○), 8 dinâmicas (ƒ). `/`, `/artigos`, `/gerar`, `/settings`, `/sitemap.xml`, `/robots.txt`, `/_not-found` estão prerendered — bom.
- `icon.tsx`, `opengraph-image.tsx` como rotas dinâmicas (ƒ) — OK, geradas on-demand.
- **PWA/manifest**: não há `app/manifest.ts` nem `public/manifest.webmanifest`. Dado que `metadata.applicationName = 'AutoBlogger'`, a ausência de manifest reduz installability.
- **Package manager**: projeto usa `bun` (tem `bun.lock` de 108KB). Mas CLAUDE.md define bun como padrão, então OK.

---

## 2. Deploy

**Status:** ✅ live com limitações funcionais

- URL prod acessível (HTTP/2 200, `strict-transport-security` configurado pela Vercel).
- `x-vercel-cache: PRERENDER` na homepage — SSG funcionando.
- **Não tem domínio custom** (só `.vercel.app`), o que é aceitável para MVP mas compromete o `NEXT_PUBLIC_SITE_URL` em metadata/OG.
- **Tipo do projeto na Vercel**: `gfmadureiraa-3391s-projects/autoblogger`.
- **GitHub auto-deploy**: o README menciona o projeto como "v0 project" — se o repo não estiver linkado, pushes locais não deployam. Não é possível confirmar isso sem gh cli, mas o `.vercel` local existe → está linkado via CLI.
- **Preview environments**: não configurados via `vercel env ls preview` (não executado por escopo), mas produção tem apenas 8 vars, sinal de que ambientes não-prod podem estar vazios.
- **Região**: deploys em `gru1` (São Paulo) no edge — OK pra user BR. Cold starts em região única podem aumentar latência da API `/api/generate`, que chama Gemini (US) em sync.

---

## 3. Integrações

### 3.1 Clerk (auth) — ✅ funcional

- `@clerk/nextjs@^7.2.3` (última major estável).
- `middleware.ts` com `clerkMiddleware()` e matcher padrão — cobre todas as rotas (inclui `/api/*`). `x-clerk-auth-status: signed-out` chega no header de resposta, confirmando que o middleware está rodando em prod.
- Route handlers usam `auth()` + `currentUser()` corretamente. `ensureProfile()` faz UPSERT on-demand em vez de webhook Clerk, o que é escolha pragmática pra MVP mas **perde eventos de deleção de conta** — não há cascade delete Clerk → Neon se o user deletar a conta no Clerk UI.
- `appearance={{ variables: { colorPrimary: "#10b981" } }}` nos componentes `<SignIn />` / `<SignUp />` — mantém brand verde.
- `profiles.id TEXT PRIMARY KEY` com formato Clerk `user_xxx`, não UUID. OK para este app.
- **Faltando**: Clerk webhook (`user.created`, `user.deleted`) pra sincronizar profile automaticamente. Hoje confia em `ensureProfile()` no primeiro acesso autenticado.

### 3.2 Neon Postgres — ✅ funcional

- `postgres@^3.4.9` (tagged templates, escapa params → previne SQL injection).
- `lib/neon.ts`: `max: 10, idle_timeout: 20` — OK para Neon (hiberna rápido).
- Schema em `supabase/schema.sql` (nome da pasta desatualizado — migração Supabase→Neon concluída mas não renomeou). Schema bem estruturado: `profiles`, `posts`, triggers de contagem e `updated_at`, CHECKs em `plan` e `status`.
- **RLS**: como Neon está sendo acessado por driver direto com service creds, **não há RLS** — toda proteção é a nível de aplicação via `WHERE user_id = ${userId}`. OK se rigorosamente aplicado (e está aplicado em todas as queries lidas em `lib/posts.ts`, `app/api/*`).
- `DATABASE_REST_URL` está no env mas **não é usada no código** (removida da migração; restou apenas como artifact).
- **Faltando**: índices explícitos além da PK. `SELECT * FROM posts WHERE user_id = X ORDER BY created_at DESC` escaneia tabela inteira se não tiver `CREATE INDEX posts_user_id_created_at_idx ON posts(user_id, created_at DESC)`.

### 3.3 Gemini — ✅ funcional, ⚠️ com brechas

- `@google/genai@^1.50.1` · modelo `gemini-2.5-flash` · `thinkingBudget: 0` (alinhado com preferências do vault).
- `responseMimeType: "application/json"` + fallback regex parser — robusto.
- **Resolução da API key** (`app/api/generate/route.ts:82-89`): body → profile.gemini_api_key → env.GEMINI_API_KEY. Retorna 503 claro se nenhuma existir.
- **⚠️ UX inconsistente**: a página `/gerar` insiste em API key no localStorage (`saveApiKey`), mas a API já aceita `apiKey: null` e cai no profile/env. User pode ter a key no profile e ainda ver o banner amarelo "API Key necessaria" na UI. Descrito em UX #8.
- **⚠️ Modelo referenciado errado no texto**: `/gerar` diz "usando Gemini **2.0 Flash**" no subtítulo, mas o código usa `gemini-2.5-flash`. Pequeno bug editorial (`app/gerar/page.tsx:329`).
- **⚠️ GEMINI_API_KEY ausente em prod** segundo `vercel env ls`. Sem ela + sem user com key salva + sem key no body = a geração sempre retorna 503 em produção atual.

### 3.4 Stripe — ⚠️ parcialmente funcional

- `stripe@^22.0.2` com `apiVersion: "2026-03-25.dahlia"` — última.
- Checkout: `POST /api/stripe/checkout` aceita `plan: "pro" | "agency"`. Cria customer com `metadata.clerk_user_id`, usa `client_reference_id: userId`, `subscription_data.metadata: { clerk_user_id, plan }`. Bem feito.
- Webhook: `POST /api/stripe/webhook` valida assinatura com `STRIPE_WEBHOOK_SECRET`. Trata `checkout.session.completed`, `customer.subscription.created/updated/deleted`. `planFromSubscription` faz fallback pelo amount.
- **❌ Bug crítico**: `checkout/route.ts:53-70` tenta `SELECT meta->>'stripe_customer_id' FROM profiles` mas **a coluna `meta` não existe** no schema `profiles` (só existe em `posts`). O `.catch(() => [])` mascara o erro e **cria um customer NOVO no Stripe a cada checkout** — duplica customers. Ler comentário do próprio dev (`/checkout/route.ts:66-70`) já reconhece o problema.
- **❌ Bug de segurança baixo**: fallback `price_data` inline está ativo por default (se `STRIPE_PRICE_ID_PRO` não estiver no env). Em prod isso gera prices "one-off" em vez de prices catalogados. Além disso, como **as envs do Stripe não estão em prod na Vercel** (confirmado por `vercel env ls`), o endpoint hoje retorna **503** em todas as chamadas.
- **❌ Inconsistência de preços**: landing (`components/pricing-section.tsx:62-80`) tem `STARTER $99 setup único` e provavelmente outros tiers, enquanto `lib/stripe.ts:24-38` define `pro $19.99/mo` e `agency $49.99/mo`. Não há link funcional entre o CTA da landing e o `/api/stripe/checkout`.

---

## 4. Env vars

**Em código (.env.example):** 16 vars declaradas.
**Em prod (Vercel):** 8 vars (só Clerk + Neon).

### Ausentes em produção (crítico)

| Var | Impacto |
|---|---|
| `GEMINI_API_KEY` | `/api/generate` retorna 503 para todos os users sem key própria |
| `STRIPE_SECRET_KEY` | `/api/stripe/checkout` e `/api/stripe/webhook` retornam 503 |
| `STRIPE_WEBHOOK_SECRET` | Webhook não valida eventos, retorna 503 |
| `STRIPE_PRICE_ID_PRO` / `STRIPE_PRICE_ID_AGENCY` | Fallback `price_data` ativa (OK dev, ruim prod) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Não consumida no código hoje (não vi referência), então irrelevante até adicionar Elements |
| `NEXT_PUBLIC_SITE_URL` | `sitemap.ts`, `robots.ts`, `layout.tsx` caem no fallback hardcoded `https://autoblogger-rosy.vercel.app` — OK pra URL atual, mas frágil se mudar domínio |

### Observações

- `.env.local` existe local com 917 bytes — provavelmente tem GEMINI local mas não foi sincronizado pra prod via `vercel env add`.
- `DATABASE_REST_URL` existe em prod mas não é usada em código (dead env var).
- Não há `VERCEL_URL` sendo consumida como fallback dinâmico — poderia ajudar em previews.

---

## 5. SEO

**Status:** ✅ sólido para um MVP, com ajustes pequenos

- ✅ `metadataBase` configurada (`app/layout.tsx:18`).
- ✅ Template de título (`default` + `template: "%s | AutoBlogger"`).
- ✅ Meta description descritiva (172 chars — um pouco acima do ideal de 120-160).
- ✅ `keywords` presentes (10 items — útil, ainda que desvalorizadas pelo Google).
- ✅ OG + Twitter card completos, `locale: "pt_BR"`.
- ✅ `app/icon.tsx` + `app/opengraph-image.tsx` gerados dinamicamente.
- ✅ `sitemap.ts` + `robots.ts` funcionam em prod (HTTP 200 confirmado). Sitemap faz query Neon para incluir posts publicados (hoje vazio).
- ✅ `computeSeoScore` (lib/seo.ts) — scoring client-side robusto de conteúdo.
- ✅ `/sign-in` com `robots: { index: false, follow: true }` — correto.
- ⚠️ **Falta JSON-LD / Structured Data**: `application/ld+json` para `WebSite`, `Organization`, `Article` (nos posts) — cruciais para SEO técnico do produto.
- ⚠️ **Canonical fixo `/`** no root layout: herda para filhos sem override. `/artigos/[id]` e `/gerar` precisam definir canonical próprio (falta).
- ⚠️ **Robots `Disallow: /settings` mas permite `/sign-in` / `/sign-up`**: `/sign-in` tem `robots: noindex` no metadata mas o `robots.txt` não bloqueia. OK (metadata > robots.txt), só inconsistente.
- ⚠️ **Sitemap cap em 500 posts**: precisa paginar (sitemap index) quando escalar.
- ⚠️ Posts em `/artigos/[id]` não têm `generateMetadata` — perde SEO por post específico (é client component, então `export const metadata` estática não resolve; precisa migrar para server component wrapper).

---

## 6. Performance

**Status:** ⚠️ aceitável, com gargalos identificáveis

- ✅ Turbopack ativo — HMR rápido em dev, build ~2.4s.
- ✅ SSG nas rotas principais (`/`, `/artigos`, `/gerar`, `/settings`).
- ✅ Fonts via `next/font` (JetBrains Mono) + Geist Pixel preload — visível nos response headers (`link: ...rel=preload`).
- ⚠️ **Todo page é `"use client"`**: `/gerar` (34KB!), `/artigos` (16KB), `/settings` (14KB), `/artigos/[id]` (19KB) estão 100% client-side. Quase nada é Server Component. **Perde-se streaming, perde-se PPR, bundle JS fica pesado**. A página `/gerar` em particular carrega framer-motion, lucide-react, e toda lógica de batch no cliente.
- ⚠️ **60 arquivos com `"use client"`** — todo o `components/` é client (incluindo landing sections que poderiam ser Server). Não há uma única Server Component com data fetching.
- ⚠️ **Shadcn/ui completo** (52 componentes em `components/ui/`) mas maioria **não é usada** pelas páginas atuais (páginas custom fazem tudo com Tailwind inline). Tree-shaking cuida disso no bundle final, mas é bagagem para manter.
- ⚠️ **No caching em APIs**: nenhum handler usa `'use cache'`, `revalidate`, ou `fetch({ next: { revalidate } })`. `/api/posts` faz round-trip completo ao Neon em toda listagem.
- ⚠️ **Listagem em `/artigos`** faz 1 request a `/api/posts` + 1 ao Clerk, tudo client-side após hidratação. Blank screen até auth + fetch completarem. Poderia ser RSC com `auth()` server-side.
- ⚠️ **Gemini sync em `/api/generate`**: a requisição fica aberta 10-30s em geração longa. Não há streaming de response (SSE) — user vê o loading sem feedback granular. Vercel Functions têm timeout default de 10s em hobby, 60s em pro. Verificar `maxDuration`.
- ⚠️ `framer-motion` usado em praticamente todo componente — bundle inicial pesado. Poderia substituir por CSS animations nas landing sections.

---

## 7. A11y

**Status:** ⚠️ mediano, precisa auditoria manual

- ✅ `<html lang="pt-BR">` correto.
- ✅ `suppressHydrationWarning` por causa do ThemeProvider — OK.
- ✅ Sonner Toaster com `richColors` (suporta `role="status"` internamente).
- ⚠️ **Muitos botões só com ícone sem `aria-label`**: ex. `CopyButton` em `/gerar`, botões de status em `/artigos`, ícones de action. Screen reader lê "button" sem contexto.
- ⚠️ **Contraste**: verde `#10b981` em fundo preto (dark default) passa WCAG AA, mas alguns textos `text-muted-foreground/70` em dark podem cair abaixo de 4.5:1.
- ⚠️ **`<input type="password">` sem `autocomplete="off"` nem `inputmode`** na UI de API key (lib de segurança: navegador pode tentar autocompletar).
- ⚠️ **Keyboard traps potenciais** em menus com framer-motion + `AnimatePresence` — não validado.
- ⚠️ **Skip-to-content link ausente**: landing tem navbar fixa + 7 seções, impossível skipar sem mouse.
- ⚠️ Headings: `/gerar`, `/artigos`, `/settings` usam `<h1>` com classe `font-pixel uppercase` — texto acessível como está, mas `font-pixel` é font decorativo que pode confundir leitores.

---

## 8. Security

**Status:** ❌ vários pontos críticos

### Críticos (P0)

1. **`/api/generate` aceita `apiKey` no body de cliente anônimo sem auth**. Qualquer pessoa pode submeter uma key Gemini roubada, gerar artigos com ela, e o server sequer loga. Agrava-se com o rate limit por IP (facilmente burlável por proxy). **Mitigação**: exigir auth para uso da key, ou validar formato da key + consumir cota do próprio servidor se vier do env.
2. **Rate limit in-memory (`lib/server/rate-limit.ts`)**: funciona no dev, **não funciona em Vercel serverless** (cada invoke cria nova memória). O comentário do próprio arquivo reconhece. **Resultado**: limite de 30 req/min é ilusório em prod. Fix: Upstash Redis com `@upstash/ratelimit`.
3. **`profiles.gemini_api_key TEXT` em plain text no Neon**: a key do Gemini é armazenada sem encryption. Se DB vazar, todas as keys dos users vazam. **Mitigação**: encrypt at rest com `pgcrypto` + key do env, ou envelope encryption via Clerk/KMS.
4. **Coluna `meta` não existe em `profiles` mas é consultada** (ver seção 3.4). Fora ser bug, o `.catch(() => [])` que engole o erro pode esconder outras falhas críticas.

### Médios (P1)

5. **Webhook Stripe sem idempotency**: `event.id` não é verificado. Stripe pode re-enviar events e reaplicar mudanças de plano. Fix: tabela `stripe_webhook_events(id TEXT PRIMARY KEY)` com INSERT ON CONFLICT DO NOTHING.
6. **Matcher do middleware exclui extensões** (.html, .css, .js, etc.) — padrão Clerk. OK, mas combinado com `/(api|trpc)(.*)` deixa **`/api/stripe/webhook` atrás do clerkMiddleware**. O Clerk não bloqueia webhooks (não exige auth), mas adiciona overhead. Considerar excluir webhook do matcher.
7. **`app/artigos/[id]/page.tsx` é client component**. Isso significa que dados do post vão pro browser após fetch, e não há proteção server-side de que o post pertence ao user — proteção é só na API. Race conditions possíveis se user manipular requests. Todos os handlers já checam `user_id`, então é seguro, mas design menos defensivo.
8. **Tokens em localStorage (`autoblogger_config.apiKey`)**: qualquer XSS vaza a API key do user. Mitigação: mover pra `httpOnly cookie` ou `sessionStorage` + bordas claras em CSP.
9. **CSP/Security headers**: nenhum header definido no `next.config.mjs`. Sem `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. Vercel seta HSTS mas o resto cabe ao app.
10. **`dangerouslySetInnerHTML` em preview de post** (não confirmado mas típico de editor MD→HTML): validar se existe sanitização DOMPurify para HTML gerado por Gemini.

### Baixos (P2)

11. **`/api/posts/[id]` retorna o campo `meta` JSONB inteiro** sem pick — se futuramente guardarem dados sensíveis em meta, vazam na resposta da API.
12. **Clerk sign-out não revoga server-side**: signOut() client-side limpa cookie, mas `currentUser()` depende da sessão Clerk e pode ter um delay de invalidation em edge cases.

---

## 9. UX

**Status:** ⚠️ confuso em fluxos-chave

1. **Dual-mode anônimo/autenticado com localStorage vs Neon**: user pode gerar anônimo, salvar no browser, depois criar conta e ter artigos em dois lugares. `posts-store.ts` tem migração `LEGACY_KEY` → `STORE_KEY` mas não migra localStorage → Neon no primeiro sign-in. Posts ficam presos no browser.
2. **API Key na página `/gerar` vs `/settings`**: user vê dois lugares pra configurar. Campo na `/gerar` salva em localStorage; campo em `/settings` (quando autenticado) salva no Neon. Se user configura em um, o outro não reflete.
3. **Banner amarelo "API Key necessaria"** em `/gerar` aparece mesmo quando a key está no env do server (`GEMINI_API_KEY`). `hasApiKey` só olha o state local (`apiKey.trim() !== ""`). User autenticado com key no profile ainda vê o aviso.
4. **Pricing section da landing (`$99 setup único`)** ≠ planos do Stripe (`$19.99/mo` Pro, `$49.99/mo` Agency) ≠ `posts_limit: 5 | 50 | 200`. Não há CTA claro ligando landing → checkout. Button de upgrade no `/settings` apenas escreve "stub — aguardando Stripe" (settings/page.tsx:349).
5. **Loading states inconsistentes**: `/gerar` mostra "Gerando..." sem progress; batch mode tem counter `batchProgress/batchTotal` mas sem bar visual.
6. **Erros 503 genéricos** no front: quando Gemini/Stripe key falta, UI mostra a string crua do erro da API. OK pra dev, ruim pra user final.
7. **`"Gemini 2.0 Flash"`** hardcoded no texto (app/gerar/page.tsx:329) mas código usa 2.5. Bug editorial.
8. **`/settings` sem profile**: anônimo vê campos mas o blog config em localStorage (`autoblogger_config`) usa shape diferente do profile Neon. A transição não preserva defaults.
9. **Navbar links para âncoras `#como-funciona`, `#features`, `#pricing`** — aparecem em `/gerar`, `/artigos`, `/settings` onde as anchors não existem. Click quebra navegação ou leva pra home sem scroll.
10. **"Meus Artigos" mostra contagem do localStorage mesmo quando autenticado**: navbar lê `autoblogger_posts_v2` sem checar `isSignedIn`. Contagem desalinhada com backend.
11. **Navigation mista `<a>` / `<Link>`**: `navbar.tsx` usa `<a href>` com full reload em links internos, `/artigos/[id]/page.tsx` usa `next/navigation`. Inconsistência de SPA feel.

---

## 10. Docs

**Status:** ⚠️ incompleta/obsoleta

- **`README.md` é o v0 scaffold gerado automaticamente**: ainda referencia o projeto como `v0-design-brutalist-ai-saa-s`. Não descreve produto, setup, arquitetura ou stack real.
- **`NEON-README.md`**: bom, descreve migração Supabase→Neon+Clerk, env vars, schema. Dated de 18 abr.
- **`.env.example`**: bem estruturado, 4 seções (Clerk/DB/Gemini/Stripe/App) com comentários úteis.
- **Pasta `supabase/`**: contém `schema.sql` aplicado ao Neon — **nome da pasta é misleading**, deveria ser `db/` ou `neon/`.
- **Sem CONTRIBUTING / CHANGELOG / ARCHITECTURE**: normal para projeto solo, mas ausência de doc de endpoints dificulta onboarding.
- **Sem JSDoc nos módulos críticos** (`gemini.ts`, `stripe.ts` têm comentários mas não TypeDoc). `lib/neon.ts` tem ótimo comentário de uso.
- **Sem tests**: zero testes unitários, e2e, ou integration em todo o repo. Nenhum `vitest`, `playwright`, `jest` nas dependencies.

---

## Prioridades

### P0 — Blocos de produção (resolver antes de abrir pra public)

1. **Adicionar envs de prod faltantes** (`GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO`, `STRIPE_PRICE_ID_AGENCY`, `NEXT_PUBLIC_SITE_URL`). Sem elas: `/api/generate` e `/api/stripe/*` retornam 503 silenciosamente.
2. **Rate limit: trocar in-memory por Upstash Redis**. Hoje não funciona em serverless.
3. **`/api/generate` — fechar pra anônimos OU auditar apiKey no body**. Considerar exigir login ou exigir a própria `GEMINI_API_KEY` do server com quota.
4. **Corrigir bug do `stripe_customer_id`**: adicionar coluna em `profiles` (ALTER TABLE) ou persistir em outro lugar antes do checkout duplicar customers.
5. **Convergir pricing**: landing, `lib/stripe.ts`, `posts_limit`, CTA. Um único source of truth.
6. **Encryptar `profiles.gemini_api_key`** com `pgcrypto` ou remover a feature se não for crítica.
7. **Migrar `middleware.ts` → `proxy.ts`** antes do Next 17.

### P1 — Debt técnico/UX sério

8. **Clerk webhook** (`user.deleted`) pra cascade delete e sincronização.
9. **Idempotency no webhook Stripe** (tabela `stripe_webhook_events`).
10. **Headers de segurança** (CSP, X-Frame-Options, Permissions-Policy) via `next.config.mjs`.
11. **Migrar `/artigos`, `/artigos/[id]`, `/gerar` pra RSC** com thin client islands. Reduz bundle, melhora SEO/TTI.
12. **`generateMetadata` em `/artigos/[id]`** pra SEO por post.
13. **Fix banner "API Key necessaria"** refletindo key do server/profile.
14. **Índice `posts_user_id_created_at_idx`** no Neon.
15. **Reescrever `README.md`** pra descrever o produto de verdade.
16. **Sanitizar HTML** do Gemini com DOMPurify ou `rehype-sanitize` antes de renderizar.

### P2 — Polish e ajustes

17. **JSON-LD estruturado** (`WebSite`, `Organization`, `Article`).
18. **Streaming de resposta** do Gemini via SSE pra feedback progressivo no `/gerar`.
19. **Migração localStorage → Neon** no primeiro sign-in.
20. **ARIA labels** em botões icon-only.
21. **Setup de tests** (vitest + playwright).
22. **Skip-to-content link**.
23. **Renomear pasta `supabase/` → `db/`**.
24. **Remover `DATABASE_REST_URL`** (env não usada).
25. **Corrigir "Gemini 2.0 Flash" → "Gemini 2.5 Flash"** no texto do `/gerar`.
26. **PWA manifest** (`app/manifest.ts`).
27. **Sitemap index** pra escalar além de 500 posts.

---

## Top 5 recomendações (acionáveis esta semana)

1. **Popular envs de prod** (30 min). Sem `GEMINI_API_KEY` + `STRIPE_*` em produção, nada funciona além de auth e CRUD de posts vazios. Usar `vercel env add` ou dashboard.
2. **Rate limit em Upstash Redis** (2h). Instalar `@upstash/ratelimit @upstash/redis`, subir KV gratuito na Vercel Marketplace, trocar `lib/server/rate-limit.ts`. Protege contra abuso em `/api/generate`.
3. **Fix Stripe customer persistence + convergir pricing** (3h). (a) Adicionar `profiles.stripe_customer_id TEXT` via migration. (b) Atualizar `checkout/route.ts` pra ler/escrever a coluna. (c) Atualizar `webhook/route.ts` pra popular o campo. (d) Unificar tabela de pricing na landing com os prices reais do Stripe.
4. **Migrar `middleware.ts` → `proxy.ts` + corrigir ignoreBuildErrors** (1h). Rename + typecheck local. Remove `typescript.ignoreBuildErrors: true` e corrige os type errors que aparecerem. Projeto está em Next 16 — a deprecação é warning hoje, error em Next 17.
5. **Reescrever `/api/generate`: auth obrigatório + server-only API key** (4h). Remove `persist: false` e key-from-body. Todas as gerações passam por profile autenticado. Server consome `GEMINI_API_KEY` ou `profile.gemini_api_key` (encryptado). Enforça `posts_limit` antes e incrementa `posts_count` depois. Fecha o buraco de segurança mais urgente.

---

## Arquivos-chave referenciados

- `/Users/gabrielmadureira/GOS/02 - PROJETOS PESSOAIS/043 - AUTOBLOGGER/autoblogger-new/middleware.ts` — Clerk middleware (deprecado)
- `/Users/gabrielmadureira/GOS/02 - PROJETOS PESSOAIS/043 - AUTOBLOGGER/autoblogger-new/next.config.mjs` — 8 linhas, `ignoreBuildErrors: true`
- `/Users/gabrielmadureira/GOS/02 - PROJETOS PESSOAIS/043 - AUTOBLOGGER/autoblogger-new/package.json` — Next 16.1.6, Clerk 7.2, Stripe 22, Gemini 1.50
- `/Users/gabrielmadureira/GOS/02 - PROJETOS PESSOAIS/043 - AUTOBLOGGER/autoblogger-new/lib/neon.ts` — cliente postgres + ensureProfile
- `/Users/gabrielmadureira/GOS/02 - PROJETOS PESSOAIS/043 - AUTOBLOGGER/autoblogger-new/lib/gemini.ts` — 3 funções (generateArticle + legado)
- `/Users/gabrielmadureira/GOS/02 - PROJETOS PESSOAIS/043 - AUTOBLOGGER/autoblogger-new/lib/stripe.ts` — config + PLAN_CONFIG
- `/Users/gabrielmadureira/GOS/02 - PROJETOS PESSOAIS/043 - AUTOBLOGGER/autoblogger-new/lib/server/rate-limit.ts` — in-memory, não-serverless-safe
- `/Users/gabrielmadureira/GOS/02 - PROJETOS PESSOAIS/043 - AUTOBLOGGER/autoblogger-new/app/api/generate/route.ts` — endpoint crítico, aceita key do body
- `/Users/gabrielmadureira/GOS/02 - PROJETOS PESSOAIS/043 - AUTOBLOGGER/autoblogger-new/app/api/stripe/checkout/route.ts` — bug `meta->>'stripe_customer_id'`
- `/Users/gabrielmadureira/GOS/02 - PROJETOS PESSOAIS/043 - AUTOBLOGGER/autoblogger-new/app/api/stripe/webhook/route.ts` — sem idempotency
- `/Users/gabrielmadureira/GOS/02 - PROJETOS PESSOAIS/043 - AUTOBLOGGER/autoblogger-new/supabase/schema.sql` — schema aplicado no Neon
- `/Users/gabrielmadureira/GOS/02 - PROJETOS PESSOAIS/043 - AUTOBLOGGER/autoblogger-new/components/pricing-section.tsx` — pricing da landing (desalinhado com Stripe)

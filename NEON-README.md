# AutoBlogger — Migração para Neon

Fase de **fundação**: cliente Neon disponível em `lib/neon.ts`. Os arquivos Supabase
continuam ativos para auth + posts. A migração será por fase.

## Cliente Neon

```ts
import { sql } from "@/lib/neon";

const rows = await sql`SELECT * FROM posts WHERE user_id = ${userId}`;
const [post] = await sql`
  INSERT INTO posts (user_id, title, body_markdown)
  VALUES (${userId}, ${title}, ${body})
  RETURNING *
`;
```

- Schema: `autoblogger`
- Client `postgres` v3 — tagged templates, escapa params automático.

## Variáveis de ambiente

```bash
DATABASE_URL=postgresql://neondb_owner:...@ep-royal-silence-amq4nm53.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require
DATABASE_SCHEMA=autoblogger
```

## Arquivos que ainda usam `@supabase/supabase-js` (migrar na fase 2)

- `lib/supabase.ts` — factory de clients (browser/server/service)
- `lib/auth-context.tsx` — sign up / sign in / session
- `lib/server/auth-helpers.ts` — validação de bearer token nas routes
- `app/sitemap.ts` — lista posts publicados (SELECT)
- `app/api/posts/[id]/route.ts` — CRUD de posts (o melhor candidato a migrar primeiro, é SQL puro)

## Tabelas esperadas no schema `autoblogger`

O schema já foi criado no Neon. As tabelas principais, inferidas do código legacy:

- `profiles` — dados de usuário (plan, gemini_api_key, posts_count, posts_limit)
- `posts` — artigos (title, slug, excerpt, body_markdown, body_html, status)

Tipos de referência já estão em `lib/supabase.ts` (`Profile`, `Post`, `PostStatus`).

Pra listar:

```ts
const tables = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'autoblogger'
`;
```

## Próximos passos

1. Fase 2 — migrar `app/api/posts/[id]/route.ts` pra `sql` (é o caminho mais curto)
2. Fase 3 — migrar `sitemap.ts` (SELECT simples)
3. Fase 4 — decidir provider de auth (Clerk recomendado) e migrar `auth-context.tsx`
4. Fase 5 — remover `@supabase/supabase-js` quando nada mais usar

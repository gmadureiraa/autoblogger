# AutoBlogger — Neon + Clerk

Migração Supabase → **Neon (Postgres)** + **Clerk (auth)** concluída.

## Stack

- **Next.js 16** (App Router)
- **Clerk** — auth via cookie-based sessions; middleware em `middleware.ts`
- **Neon Postgres** — schema `public`, 2 tabelas (`profiles`, `posts`)
- **`postgres` v3** — tagged templates, escapa params automático

## Cliente Neon

```ts
import { sql } from "@/lib/neon"

const rows = await sql`SELECT * FROM posts WHERE user_id = ${userId}`
const [post] = await sql`
  INSERT INTO posts (user_id, title, body_markdown)
  VALUES (${userId}, ${title}, ${body})
  RETURNING *
`
```

## Auth (Clerk)

- User ID do Clerk é **`string`** (formato `user_xxx`), não UUID.
- O schema foi alterado: `profiles.id TEXT PRIMARY KEY` e `posts.user_id TEXT`.
- Na primeira request autenticada, `ensureProfile()` faz UPSERT do profile
  com dados vindos do `currentUser()` do Clerk.

### Route handlers

```ts
import { auth, currentUser } from "@clerk/nextjs/server"

const { userId } = await auth()
if (!userId) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })
```

## Variáveis de ambiente

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/artigos
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/artigos

# Neon
DATABASE_URL=postgresql://neondb_owner:...@ep-bitter-wildflower-...neon.tech/neondb?sslmode=require&channel_binding=require
DATABASE_REST_URL=https://...apirest.sa-east-1.aws.neon.tech/neondb/rest/v1

# Gemini
GEMINI_API_KEY=AIza...
```

## Schema

```sql
-- profiles
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,              -- Clerk userId (user_xxx)
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  niche TEXT[] DEFAULT '{}',
  default_tone TEXT DEFAULT 'informativo',
  gemini_api_key TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free','pro','agency')),
  posts_limit INT DEFAULT 5,
  posts_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT,
  excerpt TEXT,
  body_markdown TEXT,
  body_html TEXT,
  meta JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

Triggers: `posts_increment_count`, `posts_decrement_count`, `posts_updated_at`,
`profiles_updated_at` — continuam ativos pós-migração.

## Arquivos-chave

- `lib/neon.ts` — cliente `postgres` + `ensureProfile()`
- `lib/posts.ts` — CRUD server-side (listPosts, getPost, createPost, updatePost, deletePost)
- `lib/posts-store.ts` — client-side wrapper (fallback pra localStorage quando anonimo)
- `lib/api-client.ts` — wrapper fetch (cookies do Clerk já vão auto)
- `middleware.ts` — `clerkMiddleware()`
- `app/api/posts/route.ts`, `app/api/posts/[id]/route.ts`, `app/api/profile/route.ts`,
  `app/api/generate/route.ts` — usam `auth()` do Clerk
- `app/sign-in/[[...sign-in]]`, `app/sign-up/[[...sign-up]]` — pages Clerk

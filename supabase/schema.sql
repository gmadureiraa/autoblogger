-- ============================================================
-- AutoBlogger — Schema Supabase
-- ============================================================
-- Rodar este arquivo no SQL Editor do dashboard do Supabase.
-- Idempotente: pode rodar multiplas vezes sem quebrar.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- PROFILES ----------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  avatar_url text,
  niche text[] default '{}'::text[],
  default_tone text default 'informativo',
  gemini_api_key text,
  plan text default 'free' check (plan in ('free','pro','agency')),
  posts_limit int default 5,
  posts_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.profiles is 'Perfil publico de cada usuario. 1-1 com auth.users.';
comment on column public.profiles.gemini_api_key is 'API key do Gemini do proprio usuario (opcional — fallback pra chave do app).';

-- ---------- POSTS ----------

create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text,
  excerpt text,
  body_markdown text,
  body_html text,
  meta jsonb default '{}'::jsonb,
  status text default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.posts is 'Artigos gerados pelo usuario (rascunhos, publicados, arquivados).';
comment on column public.posts.meta is 'JSON com seoScore, headings, tips, internalLinks, wordCount, mode, tone etc.';

create index if not exists posts_user_id_idx on public.posts (user_id);
create index if not exists posts_status_idx on public.posts (status);
create index if not exists posts_created_at_idx on public.posts (created_at desc);

-- ---------- ROW LEVEL SECURITY ----------

alter table public.profiles enable row level security;
alter table public.posts enable row level security;

-- PROFILES policies
drop policy if exists "own profile select" on public.profiles;
drop policy if exists "own profile update" on public.profiles;
drop policy if exists "own profile insert" on public.profiles;

create policy "own profile select"
  on public.profiles for select
  using (auth.uid() = id);

create policy "own profile insert"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "own profile update"
  on public.profiles for update
  using (auth.uid() = id);

-- POSTS policies (CRUD completo, owner-only)
drop policy if exists "own posts select" on public.posts;
drop policy if exists "own posts insert" on public.posts;
drop policy if exists "own posts update" on public.posts;
drop policy if exists "own posts delete" on public.posts;

create policy "own posts select"
  on public.posts for select
  using (auth.uid() = user_id);

create policy "own posts insert"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "own posts update"
  on public.posts for update
  using (auth.uid() = user_id);

create policy "own posts delete"
  on public.posts for delete
  using (auth.uid() = user_id);

-- ---------- TRIGGER: cria profile ao inserir em auth.users ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- TRIGGER: updated_at ----------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute procedure public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ---------- TRIGGER: incrementa posts_count ----------

create or replace function public.increment_posts_count()
returns trigger language plpgsql as $$
begin
  update public.profiles set posts_count = posts_count + 1 where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists posts_increment_count on public.posts;
create trigger posts_increment_count
  after insert on public.posts
  for each row execute procedure public.increment_posts_count();

create or replace function public.decrement_posts_count()
returns trigger language plpgsql as $$
begin
  update public.profiles set posts_count = greatest(posts_count - 1, 0) where id = old.user_id;
  return old;
end;
$$;

drop trigger if exists posts_decrement_count on public.posts;
create trigger posts_decrement_count
  after delete on public.posts
  for each row execute procedure public.decrement_posts_count();

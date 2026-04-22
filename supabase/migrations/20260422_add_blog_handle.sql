-- ============================================================
-- AutoBlogger — Adiciona blog_handle + bio + indices de publish
-- ============================================================
-- Cada usuario pode escolher um handle publico (3-30 chars, [a-z0-9-])
-- que vira a URL /blog/<handle>.
--
-- Idempotente. Rodar via `psql "$DATABASE_URL" -f <arquivo>`.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS blog_handle TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- unique case-insensitive handle
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_blog_handle
  ON profiles (LOWER(blog_handle))
  WHERE blog_handle IS NOT NULL;

-- lookup posts by user + status + recency (drives /blog/<handle> SSG)
CREATE INDEX IF NOT EXISTS idx_posts_user_status_created
  ON posts (user_id, status, created_at DESC);

-- slug unique per user (evita conflito em /blog/<handle>/<slug>)
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_user_slug
  ON posts (user_id, slug)
  WHERE slug IS NOT NULL;

COMMENT ON COLUMN profiles.blog_handle IS 'Handle publico [a-z0-9-]. URL: /blog/<handle>. Case-insensitive unique.';
COMMENT ON COLUMN profiles.bio IS 'Bio curta exibida no cabecalho do blog publico.';

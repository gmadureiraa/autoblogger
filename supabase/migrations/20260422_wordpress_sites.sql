-- ============================================================
-- AutoBlogger — Integracao WordPress
-- ============================================================
-- Uma linha por site WP conectado pelo usuario.
-- Application Password encriptada (AES-GCM) usando WORDPRESS_ENCRYPTION_KEY.
-- Publish usa REST API /wp-json/wp/v2/posts com Basic Auth.
--
-- Idempotente. Rodar via `bun scripts/run-migration.ts <arquivo>`.
-- ============================================================

CREATE TABLE IF NOT EXISTS wordpress_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  site_url TEXT NOT NULL,
  username TEXT NOT NULL,
  app_password_encrypted TEXT NOT NULL,
  label TEXT,
  default_status TEXT DEFAULT 'draft' CHECK (default_status IN ('draft','publish','pending','private')),
  default_category_id INTEGER,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wordpress_sites_user ON wordpress_sites (user_id);

COMMENT ON TABLE wordpress_sites IS 'Sites WordPress conectados por usuario (REST API + Application Password).';
COMMENT ON COLUMN wordpress_sites.site_url IS 'URL base do site (sem trailing slash). Ex: https://meusite.com';
COMMENT ON COLUMN wordpress_sites.app_password_encrypted IS 'AES-256-GCM: base64(iv(12) || ciphertext || tag(16)).';

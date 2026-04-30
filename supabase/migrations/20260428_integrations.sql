-- ============================================================
-- AutoBlogger — Integrações genéricas de publicação
-- ============================================================
-- Substitui (em paralelo, sem dropar) o `wordpress_sites`. A partir
-- daqui qualquer plataforma (WordPress, Wix, Ghost, ...) salva uma linha
-- aqui. As credenciais inteiras (objeto JSON) são encriptadas com AES-GCM
-- usando WORDPRESS_ENCRYPTION_KEY.
--
-- Idempotente. Rodar via `bun scripts/run-migration.ts <arquivo>`.
-- ============================================================

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('wordpress', 'wix', 'ghost')),
  display_name TEXT NOT NULL,
  credentials_encrypted TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_used_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_integrations_user ON integrations (user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_platform ON integrations (user_id, platform);

COMMENT ON TABLE integrations IS 'Integrações de publicação por usuário (WordPress, Wix, Ghost, ...).';
COMMENT ON COLUMN integrations.credentials_encrypted IS 'AES-256-GCM (base64 de iv||ciphertext||tag). Decifrado contém JSON com creds específicas da plataforma.';
COMMENT ON COLUMN integrations.metadata IS 'Configs públicas (não-sensíveis): default_status, default_category, site_id, site_url legível, etc.';

-- Cover image: salva seed pra reproduzir a mesma capa em regenerações.
ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_seed TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_style TEXT;
COMMENT ON COLUMN posts.cover_seed IS 'Seed determinístico (sha256(title|style)) usado pra cache da cover image.';
COMMENT ON COLUMN posts.cover_style IS 'Estilo da capa: brutalist | editorial | abstract.';

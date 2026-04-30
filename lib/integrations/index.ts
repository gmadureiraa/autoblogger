import type { PublishAdapter } from "./adapter"
import { wordpressAdapter } from "./wordpress"
import { wixAdapter } from "./wix"
import { ghostAdapter } from "./ghost"

export type IntegrationPlatform = "wordpress" | "wix" | "ghost"

const REGISTRY: Record<IntegrationPlatform, PublishAdapter> = {
  wordpress: wordpressAdapter as PublishAdapter,
  wix: wixAdapter as PublishAdapter,
  ghost: ghostAdapter as PublishAdapter,
}

export function getAdapter(platform: IntegrationPlatform): PublishAdapter {
  const adapter = REGISTRY[platform]
  if (!adapter) {
    throw new Error(`Integração desconhecida: ${platform}`)
  }
  return adapter
}

export const ALL_PLATFORMS: IntegrationPlatform[] = ["wordpress", "wix", "ghost"]

export const PLATFORM_META: Record<IntegrationPlatform, {
  name: string
  tagline: string
  /** Pequeno descritivo do que o usuário precisa pra conectar. */
  helpHint: string
  /** Documentação oficial pra pegar credenciais. */
  helpUrl: string
}> = {
  wordpress: {
    name: "WordPress",
    tagline: "REST API + Application Password",
    helpHint:
      "Crie uma Application Password em Users → Profile → Application Passwords (no admin do seu WP).",
    helpUrl: "https://wordpress.org/documentation/article/application-passwords/",
  },
  wix: {
    name: "Wix Blog",
    tagline: "Wix Headless API + API Key",
    helpHint:
      "Em Wix Dashboard → Settings → Headless Settings → API Keys → Generate. Permita acesso a Wix Blog.",
    helpUrl: "https://dev.wix.com/docs/rest/articles/getting-started/api-keys",
  },
  ghost: {
    name: "Ghost",
    tagline: "Ghost Admin API + JWT",
    helpHint:
      "Em Ghost Admin → Integrations → Add custom integration. Copie o Admin API Key (formato id:secret).",
    helpUrl: "https://ghost.org/docs/admin-api/",
  },
}

export type { PublishAdapter, PublishablePost, PublishStatus } from "./adapter"

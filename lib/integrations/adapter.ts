/**
 * Integration adapter contract.
 *
 * Toda plataforma de publicação (WordPress, Wix, Ghost, ...) implementa este
 * tipo. Frontend e API genérica chamam só `validateCredentials` + `publish`,
 * sem saber detalhes específicos.
 *
 * Credentials e metadata são `Record<string, unknown>` proposital pra cada
 * adapter definir o seu shape interno (validado pelo próprio adapter).
 */

export type PublishStatus = "draft" | "publish" | "pending" | "private"

export interface PublishablePost {
  title: string
  /** HTML pronto. Adapters convertem pro formato nativo se preciso (ex: Ghost aceita html). */
  html: string
  /** Markdown opcional pra adapters que prefiram (Ghost aceita mobiledoc/lexical mas html é OK). */
  markdown?: string | null
  excerpt?: string | null
  slug?: string | null
  /** Data URL ou URL pública da capa. Adapter decide se faz upload ou usa direto. */
  featuredImageUrl?: string | null
}

export interface ValidateResult {
  ok: boolean
  /** Identificação humana retornada pela plataforma (display name, site title, etc). */
  accountLabel?: string | null
  error?: string
}

export interface PublishOutput {
  /** URL pública (ou de admin) do post na plataforma. */
  url: string
  /** ID do post na plataforma (string pra suportar uuid + número). */
  externalId: string
  /** Status final que a plataforma reportou (draft/publish/...). */
  status: string
}

export type AuthMethod = "oauth" | "api_key" | "app_password" | "admin_api"

export interface PublishAdapter<
  Creds extends Record<string, unknown> = Record<string, unknown>,
  Meta extends Record<string, unknown> = Record<string, unknown>,
> {
  /** ID estável; usado em DB e URLs. */
  readonly id: "wordpress" | "wix" | "ghost"
  /** Nome humano. */
  readonly name: string
  /** Usado na UI de hub. */
  readonly authMethod: AuthMethod
  /** Curtinho. Aparece no hub de integrações. */
  readonly tagline: string

  /**
   * Valida sem persistir. Implementações fazem 1 chamada minimal à API.
   * Não lança — devolve `{ ok: false, error }`.
   */
  validateCredentials(
    creds: Creds,
    metadata?: Meta
  ): Promise<ValidateResult>

  /**
   * Publica um post. Lança se quebrar — caller faz try/catch e retorna 502.
   */
  publish(
    post: PublishablePost,
    creds: Creds,
    metadata: Meta,
    options?: { status?: PublishStatus }
  ): Promise<PublishOutput>
}

import sanitizeHtmlLib from "sanitize-html"

/**
 * Sanitiza HTML gerado pelo Gemini antes de salvar no banco.
 *
 * Por que: o Gemini retorna body HTML construído a partir de prompt do usuário
 * (tópico, URL, transcrição YouTube). Um prompt malicioso pode injetar
 * `<script>`, `<iframe>`, handlers `onclick` etc. Como o blog público
 * (`/blog/[handle]/[slug]`) renderiza com `dangerouslySetInnerHTML`, qualquer
 * tag executável vira XSS pra qualquer visitante.
 *
 * Estratégia: whitelist explícito de tags semânticas + atributos.
 * Headings, parágrafos, listas, links (com rel/nofollow), code, blockquote
 * e formatação básica. Sem `<script>`, `<iframe>`, `<style>`, `<form>`,
 * sem event handlers, sem `data:` URIs.
 *
 * Sanitiza on-write (nos route handlers) — uma única vez, garantia que
 * todo HTML no banco já está limpo. Render fica simples.
 */
export function sanitizeArticleHtml(html: string | null | undefined): string {
  if (!html) return ""
  return sanitizeHtmlLib(html, {
    allowedTags: [
      "p",
      "br",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "blockquote",
      "ul",
      "ol",
      "li",
      "a",
      "code",
      "pre",
      "hr",
      "img",
      "figure",
      "figcaption",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "span",
      "div",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    allowProtocolRelative: false,
    transformTags: {
      // Força rel="noopener noreferrer" + target=_blank em links externos.
      a: (tagName, attribs) => {
        const href = attribs.href ?? ""
        const isExternal = /^https?:\/\//i.test(href)
        return {
          tagName,
          attribs: {
            ...attribs,
            ...(isExternal
              ? {
                  rel: "noopener noreferrer nofollow",
                  target: "_blank",
                }
              : {}),
          },
        }
      },
      // Lazy load em imagens externas.
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy" },
      }),
    },
    // Remove tags `<script>`, `<style>`, `<iframe>` e tudo que tiver dentro.
    nonTextTags: ["style", "script", "textarea", "option", "noscript"],
  })
}

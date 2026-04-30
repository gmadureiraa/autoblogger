// ASCII art pictorica curada — artes classicas / dominio publico.
// Selecionadas e levemente ajustadas pra encaixar no grid do AsciiArtMorph
// (cap de 800 cells por arte, larguras consistentes).

/**
 * Robo / IA — referencia classica de bot ASCII.
 * 17 cols × 11 rows = 187 cells.
 */
export const PIC_ROBOT = String.raw`
   ╔════════╗
   ║  ◉  ◉  ║
   ║   ──   ║
   ╚═╦════╦═╝
  ╔══╩════╩══╗
  ║ ▓ AI ▓ ▓ ║
  ║ ▓▓ ████ ▓║
  ║ ▓ ▓▓▓▓ ▓ ║
  ╚═╤══════╤═╝
    │      │
   ═╧══════╧═
`

/**
 * Terminal / monitor de computador com cursor.
 * 22 cols × 10 rows = 220 cells.
 */
export const PIC_TERMINAL = String.raw`
 ┌────────────────────┐
 │ ● ● ●   article.md │
 ├────────────────────┤
 │ > generating...    │
 │ # SEO 92/100       │
 │ ████████████████░░ │
 │ 1247 words ✓       │
 │ ready to publish ▮ │
 └────────────────────┘
        ╚═══════╝
`

/**
 * Documento / artigo aberto com texto e linhas.
 * 24 cols × 13 rows = 312 cells.
 */
export const PIC_DOCUMENT = String.raw`
   ┌──────────────────────┐
   │ ████████████████     │
   │ ██████████           │
   │                      │
   │ ████ ████  ████████  │
   │ ████████████████     │
   │ ██████ ██████████    │
   │ ████████ █████████   │
   │ █████████████ █████  │
   │                      │
   │ ████████████████     │
   │ ▓▓▓▓▓▓▓▓ SEO 94/100  │
   └──────────────────────┘
`

/**
 * Grafico de barras subindo — trafego organico.
 * 30 cols × 12 rows = 360 cells.
 */
export const PIC_CHART = String.raw`
 ▲ TRAFEGO ORGANICO
 │                       ████
 │                    ███████
 │                 ██████████
 │              █████████████
 │           ████████████████
 │        ███████████████████
 │     ██████████████████████
 │  █████████████████████████
 │ ██████████████████████████
 └──────────────────────────►
   JAN  FEV  MAR  ABR  MAI
`

/**
 * Raio / energia / IA — simbolo de poder/velocidade.
 * 14 cols × 11 rows = 154 cells.
 */
export const PIC_BOLT = String.raw`
        ▄█▀
      ▄██▀
    ▄███▀
  ▄████▀▀▀▀
 ████▀
   ▀█▄
    ▀█▄
     ▀█▄
      ▀█▄
       ▀▀
`

/**
 * Stack de paginas web sendo geradas (multi-artigos).
 * 22 cols × 14 rows = 308 cells.
 */
export const PIC_STACK = String.raw`
   ┌──────────────────┐
   │ ▓▓▓▓ ░░░░░░░░░   │
   │ ░░░░░ ▓▓ ░░░░    │ article-3.md
   ├──────────────────┤
   │ ▓▓▓▓ ░░░░░░░     │
   │ ░░░░ ▓▓▓▓ ░░░    │ article-2.md
   │ ░░░░░░░░░░░░░    │
   ├──────────────────┤
   │ ▓▓▓▓▓ ░░░░░░░    │
   │ ░░ ▓▓▓ ░░░░░░    │ article-1.md
   │ ░░░░░ ▓▓▓ ░░░░   │
   └──────────────────┘
`

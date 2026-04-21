import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "404 — Pagina nao encontrada",
  description:
    "A pagina que voce procura nao existe ou foi movida. Volta pro inicio e continua gerando conteudo.",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main className="min-h-screen dot-grid-bg flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-2xl border-2 border-foreground bg-background/60 backdrop-blur-sm p-10 lg:p-14">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-[#10b981] flex items-center justify-center">
            <span className="text-background font-mono font-bold text-sm">A</span>
          </div>
          <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground">
            AutoBlogger / error 404
          </span>
        </div>

        <h1 className="font-pixel text-5xl sm:text-7xl tracking-tight text-foreground mb-6 select-none">
          404<span className="text-[#10b981]">.</span>
        </h1>

        <p className="text-sm lg:text-base text-foreground font-mono mb-2">
          Rota fora do ar.
        </p>
        <p className="text-xs lg:text-sm text-muted-foreground font-mono mb-10 max-w-md leading-relaxed">
          A URL que voce digitou nao existe, foi arquivada ou nunca foi publicada. Nada pessoal contra voce — nossa maquina so escreve, nao chuta caminhos.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className="group flex items-center gap-0 bg-foreground text-background text-xs font-mono tracking-widest uppercase"
          >
            <span className="flex items-center justify-center w-9 h-9 bg-[#10b981] text-background">
              {"←"}
            </span>
            <span className="px-5 py-2.5">Voltar pro inicio</span>
          </Link>
          <Link
            href="/gerar"
            className="flex items-center border-2 border-foreground text-foreground text-xs font-mono tracking-widest uppercase px-5 py-2 hover:bg-foreground hover:text-background transition-colors"
          >
            Gerar artigo
          </Link>
          <Link
            href="/artigos"
            className="flex items-center border border-foreground/40 text-muted-foreground text-xs font-mono tracking-widest uppercase px-5 py-2 hover:text-foreground hover:border-foreground transition-colors"
          >
            Meus artigos
          </Link>
        </div>
      </div>
    </main>
  )
}

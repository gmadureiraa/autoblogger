"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log client-side pra conseguir rastrear no Vercel.
    console.error("[AutoBlogger] route error:", error)
  }, [error])

  return (
    <main className="min-h-screen dot-grid-bg flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-2xl border-2 border-foreground bg-background/60 backdrop-blur-sm p-10 lg:p-14">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-destructive flex items-center justify-center">
            <span className="text-background font-mono font-bold text-sm">!</span>
          </div>
          <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground">
            AutoBlogger / runtime error
          </span>
        </div>

        <h1 className="font-pixel text-4xl sm:text-6xl tracking-tight text-foreground mb-6 select-none">
          algo quebrou<span className="text-destructive">.</span>
        </h1>

        <p className="text-xs lg:text-sm text-muted-foreground font-mono mb-6 leading-relaxed max-w-md">
          A pagina encontrou um erro inesperado. Pode ter sido uma falha momentanea da API, conexao ou estado invalido.
        </p>

        {error?.digest && (
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/70 mb-8 border-l-2 border-destructive pl-3">
            digest: {error.digest}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => reset()}
            className="group flex items-center gap-0 bg-foreground text-background text-xs font-mono tracking-widest uppercase cursor-pointer"
          >
            <span className="flex items-center justify-center w-9 h-9 bg-[#10b981] text-background">
              {"↻"}
            </span>
            <span className="px-5 py-2.5">Tentar de novo</span>
          </button>
          <Link
            href="/"
            className="flex items-center border-2 border-foreground text-foreground text-xs font-mono tracking-widest uppercase px-5 py-2 hover:bg-foreground hover:text-background transition-colors"
          >
            Voltar pro inicio
          </Link>
        </div>
      </div>
    </main>
  )
}

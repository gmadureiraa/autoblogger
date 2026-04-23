import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { DestruaStartupTool } from "./destrua-startup-tool"

export const metadata: Metadata = {
  title: "Destrua Minha Startup - Autopsia IA | AutoBlogger",
  description:
    "Relatorio brutal gerado por IA. Cole seu pitch e receba autopsia preventiva: killers, saviors e nota 0-10 nas 5 dimensoes que matam startups.",
}

export default function Page() {
  return (
    <div className="min-h-screen dot-grid-bg flex flex-col">
      <Navbar />
      <main className="flex-1 w-full px-6 pt-8 pb-12 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block h-2 w-2 bg-[#ef4444] animate-blink" />
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
              Coveiro de Startups · Gemini 2.5 · Autopsia preventiva
            </span>
          </div>

          <h1 className="font-pixel text-[26px] sm:text-4xl lg:text-5xl tracking-tight text-foreground mb-3 select-none leading-[1]">
            DESTRUA
            <br />
            <span className="text-[#ef4444]">MINHA STARTUP</span>
            <br />
            ANTES DO MERCADO.
          </h1>

          <p className="text-xs sm:text-sm font-mono text-muted-foreground max-w-2xl mb-6 leading-relaxed">
            Relatorio brutal em menos de 15 segundos. 5 dimensoes avaliadas, killers listados,
            saviors priorizados. Melhor levar porrada de IA agora do que do mercado depois.
          </p>

          <DestruaStartupTool />
        </div>
      </main>
      <Footer />
    </div>
  )
}

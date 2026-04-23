import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { EnsinaAiChat } from "./ensina-ai-chat"

export const metadata: Metadata = {
  title: "Ensina AI - Tutor de SEO e Blog | AutoBlogger",
  description:
    "Mentor IA que ensina SEO, content marketing, blogging e automacao de conteudo. Pergunta tudo que quiser.",
}

export default function Page() {
  return (
    <div className="min-h-screen dot-grid-bg flex flex-col">
      <Navbar />
      <main className="flex-1 w-full px-6 pt-8 pb-12 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block h-2 w-2 bg-[#10b981] animate-blink" />
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
              Tutor AI · Gemini 2.5 Flash · Streaming
            </span>
          </div>

          <h1 className="font-pixel text-[26px] sm:text-4xl lg:text-5xl tracking-tight text-foreground mb-3 select-none leading-[1]">
            ENSINA AI.
            <br />
            <span className="text-[#10b981]">PERGUNTA QUALQUER COISA</span>
            <br />
            DE SEO E BLOG.
          </h1>

          <p className="text-xs sm:text-sm font-mono text-muted-foreground max-w-2xl mb-6 leading-relaxed">
            Mentor IA direto ao ponto. Tira duvida de SEO, copy, autoridade, WordPress, IA,
            estrategia de conteudo. Resposta em streaming, menos de 10s por pergunta.
          </p>

          <EnsinaAiChat />
        </div>
      </main>
      <Footer />
    </div>
  )
}

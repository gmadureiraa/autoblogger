import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Gerar artigo com IA",
  description:
    "Gere artigos SEO-ready com IA (Gemini) em segundos: informe o topico ou cole uma URL, escolha o tom e publique no seu blog.",
  alternates: { canonical: "/gerar" },
  openGraph: {
    title: "Gerar artigo com IA | AutoBlogger",
    description:
      "Gere artigos SEO-ready com IA (Gemini) em segundos. Informe o topico, escolha o tom e publique.",
    url: "/gerar",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gerar artigo com IA | AutoBlogger",
    description:
      "Gere artigos SEO-ready com IA (Gemini) em segundos. Informe o topico, escolha o tom e publique.",
  },
}

export default function GerarLayout({ children }: { children: React.ReactNode }) {
  return children
}

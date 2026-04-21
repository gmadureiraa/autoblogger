import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Criar conta gratis",
  description:
    "Crie sua conta no AutoBlogger e comece a gerar conteudo SEO com IA hoje. Setup em 48h, primeiros artigos no ar na mesma semana.",
  alternates: { canonical: "/signup" },
  openGraph: {
    title: "Criar conta gratis | AutoBlogger",
    description:
      "Crie sua conta e comece a gerar conteudo SEO com IA. Setup em 48h, artigos no ar na mesma semana.",
    url: "/signup",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Criar conta gratis | AutoBlogger",
    description:
      "Crie sua conta e comece a gerar conteudo SEO com IA. Setup em 48h, artigos no ar na mesma semana.",
  },
  robots: { index: true, follow: true },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}

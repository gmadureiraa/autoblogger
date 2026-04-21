import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre na sua conta do AutoBlogger pra gerenciar seus artigos e configuracoes.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Entrar | AutoBlogger",
    description: "Entre na sua conta do AutoBlogger.",
    url: "/login",
    type: "website",
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}

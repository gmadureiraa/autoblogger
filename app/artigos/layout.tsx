import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Meus artigos",
  description:
    "Gerencie, edite, publique e exporte os artigos gerados pelo AutoBlogger. Tudo versionado em Markdown, pronto pra alimentar seu blog.",
  alternates: { canonical: "/artigos" },
  openGraph: {
    title: "Meus artigos | AutoBlogger",
    description:
      "Gerencie, edite, publique e exporte os artigos gerados pelo AutoBlogger em um so painel.",
    url: "/artigos",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meus artigos | AutoBlogger",
    description:
      "Gerencie, edite, publique e exporte os artigos gerados pelo AutoBlogger em um so painel.",
  },
  robots: { index: false, follow: false },
}

export default function ArtigosLayout({ children }: { children: React.ReactNode }) {
  return children
}

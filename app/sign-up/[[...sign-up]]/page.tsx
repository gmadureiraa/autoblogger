import { SignUp } from "@clerk/nextjs"

export const metadata = {
  title: "Criar conta gratis",
  description:
    "Crie sua conta no AutoBlogger e comece a gerar conteudo SEO com IA hoje.",
  alternates: { canonical: "/sign-up" },
  openGraph: {
    title: "Criar conta gratis | AutoBlogger",
    description:
      "Crie sua conta e comece a gerar conteudo SEO com IA.",
    url: "/sign-up",
    type: "website",
  },
  robots: { index: true, follow: true },
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen dot-grid-bg flex items-center justify-center p-6">
      <SignUp
        // Usuario novo → manda pro onboarding (escolhe nicho, tom, handle, gera primeiro artigo)
        forceRedirectUrl="/onboarding"
        signInForceRedirectUrl="/artigos"
        appearance={{
          variables: {
            colorPrimary: "#10b981",
          },
        }}
      />
    </div>
  )
}

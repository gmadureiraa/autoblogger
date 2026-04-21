import { SignIn } from "@clerk/nextjs"

export const metadata = {
  title: "Entrar",
  description: "Entre na sua conta do AutoBlogger.",
  alternates: { canonical: "/sign-in" },
  robots: { index: false, follow: true },
}

export default function SignInPage() {
  return (
    <div className="min-h-screen dot-grid-bg flex items-center justify-center p-6">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#10b981",
          },
        }}
      />
    </div>
  )
}

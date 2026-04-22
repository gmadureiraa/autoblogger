import { Suspense } from "react"
import { OnboardingFlow } from "./onboarding-flow"

export const metadata = {
  title: "Configurar seu blog",
  description: "Setup rapido do AutoBlogger — nicho, tom de voz, handle publico e primeiro artigo.",
  alternates: { canonical: "/onboarding" },
  robots: { index: false, follow: false },
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen dot-grid-bg">
      <Suspense fallback={null}>
        <OnboardingFlow />
      </Suspense>
    </div>
  )
}

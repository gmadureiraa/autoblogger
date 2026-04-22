import { Navbar } from "@/components/navbar"
import { HeroV2 } from "@/components/landing/hero-v2"
import { IntegrationsRow } from "@/components/landing/integrations-row"
import { FeatureGridV2 } from "@/components/landing/feature-grid-v2"
import { SocialProof } from "@/components/landing/social-proof"
import { PricingSection } from "@/components/pricing-section"
import { FaqSection } from "@/components/faq-section"
import { GlitchMarquee } from "@/components/glitch-marquee"
import { Footer } from "@/components/footer"

export default function Page() {
  return (
    <div className="min-h-screen dot-grid-bg">
      <Navbar />
      <main>
        <HeroV2 />
        <IntegrationsRow />
        <FeatureGridV2 />
        <SocialProof />
        <PricingSection />
        <FaqSection />
        <GlitchMarquee />
      </main>
      <Footer />
    </div>
  )
}

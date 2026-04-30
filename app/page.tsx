import { Navbar } from "@/components/navbar"
import { AnimatedBg } from "@/components/landing/animated-bg"
import { HeroV2 } from "@/components/landing/hero-v2"
import { IntegrationsRow } from "@/components/landing/integrations-row"
import { StatsStrip } from "@/components/landing/stats-strip"
import { FeatureGridV2 } from "@/components/landing/feature-grid-v2"
import { HowItWorks } from "@/components/landing/how-it-works"
import { OutputPreview } from "@/components/landing/output-preview"
import { SocialProof } from "@/components/landing/social-proof"
import { PricingSection } from "@/components/pricing-section"
import { FaqSection } from "@/components/faq-section"
import { FinalCta } from "@/components/landing/final-cta"
import { GlitchMarquee } from "@/components/glitch-marquee"
import { AsciiWave } from "@/components/landing/ascii-wave"
import { Footer } from "@/components/footer"
import { SectionDivider } from "@/components/landing/section-divider"

export default function Page() {
  return (
    <div className="relative min-h-screen bg-background">
      <AnimatedBg />

      {/* Camada de conteudo acima do background */}
      <div className="relative z-10">
        <Navbar />
        <main>
          <HeroV2 />

          <SectionDivider label="INTEGRATIONS" index="001" />
          <IntegrationsRow />

          <StatsStrip />

          <SectionDivider label="HOW IT WORKS" index="002" />
          <HowItWorks />

          <SectionDivider label="OUTPUT PREVIEW" index="003" />
          <OutputPreview />

          <SectionDivider label="FEATURES" index="004" />
          <FeatureGridV2 />

          <SectionDivider label="SOCIAL PROOF" index="005" />
          <SocialProof />

          <SectionDivider label="PRICING" index="006" />
          <PricingSection />

          <SectionDivider label="FAQ" index="007" />
          <FaqSection />

          <FinalCta />

          {/* Wave discreta antes do marquee — mobile escondida */}
          <div
            aria-hidden="true"
            className="hidden md:flex justify-center px-6 py-6 pointer-events-none"
          >
            <AsciiWave width={120} height={6} fontSize={8} opacity={0.32} />
          </div>

          <GlitchMarquee />
        </main>
        <Footer />
      </div>
    </div>
  )
}

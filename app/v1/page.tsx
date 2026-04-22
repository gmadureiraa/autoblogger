import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { FeatureGrid } from "@/components/feature-grid"
import { AboutSection } from "@/components/about-section"
import { PricingSection } from "@/components/pricing-section"
import { FaqSection } from "@/components/faq-section"
import { GlitchMarquee } from "@/components/glitch-marquee"
import { Footer } from "@/components/footer"

/**
 * Landing antiga (v1) — mantida como fallback e link pelo footer novo.
 * A landing principal (/) foi reescrita no estilo automarticles em 2026-04-22.
 */
export const metadata = {
  title: "AutoBlogger v1 (landing antiga)",
  robots: { index: false },
}

export default function LandingV1() {
  return (
    <div className="min-h-screen dot-grid-bg">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeatureGrid />
        <AboutSection />
        <PricingSection />
        <FaqSection />
        <GlitchMarquee />
      </main>
      <Footer />
    </div>
  )
}

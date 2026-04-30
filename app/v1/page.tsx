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
 * Landing antiga (v1) — mantida como referencia/showcase dos componentes
 * brutalistas (Hero, HowItWorks, FeatureGrid, About, Pricing, FAQ, GlitchMarquee).
 *
 * Status: NAO indexada (robots: noindex), NAO incluida no sitemap.
 * Acessivel apenas por link direto. A landing principal (/) foi reescrita
 * no estilo automarticles em 2026-04-22.
 *
 * Nao remover sem antes mover/preservar os componentes em components/landing/
 * ou aceitar que esses bento/marquee/diagramas vao virar lixo morto.
 */
export const metadata = {
  title: "AutoBlogger v1 (landing antiga)",
  robots: { index: false, follow: false },
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

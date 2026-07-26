import { PublicShell } from "@/components/public-shell";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { StatsSection } from "@/components/landing/stats-section";
import { FinalCTASection } from "@/components/landing/final-cta-section";
import { FeaturedMarquee } from "@/components/featured-marquee";

export default function HomePage() {
  return (
    <PublicShell>
      <main className="pt-0">
        <HeroSection />
        {/* Marquee "À la une" — produits les plus scannés */}
        <FeaturedMarquee
          title="Produits à la une"
          subtitle="Les produits les plus scannés par les consommateurs sur VerifScan"
          variant="muted"
        />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <StatsSection />
        <FinalCTASection />
      </main>
    </PublicShell>
  );
}

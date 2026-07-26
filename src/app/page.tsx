import { PublicShell } from "@/components/public-shell";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { StatsSection } from "@/components/landing/stats-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { FinalCTASection } from "@/components/landing/final-cta-section";

export default function HomePage() {
  return (
    <PublicShell>
      <main className="pt-0">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <StatsSection />
        <PricingSection />
        <FinalCTASection />
      </main>
    </PublicShell>
  );
}

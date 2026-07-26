"use client";

import { Package, QrCode, TrendingUp, ArrowRight } from "lucide-react";
import { useReveal } from "@/lib/use-animations";

const steps = [
  {
    step: 1,
    icon: Package,
    title: "Créez votre produit",
    description:
      "Ajoutez les détails de vos produits : nom, ingrédients, dates de fabrication et péremption, logo, certifications. Tout est centralisé sur une fiche propre et professionnelle.",
    color: "#2563EB",
    bg: "#DBEAFE",
  },
  {
    step: 2,
    icon: QrCode,
    title: "Générez le QR code",
    description:
      "Un QR code unique est créé pour chaque lot, prêt à imprimer sur vos étiquettes. Chaque code est sécurisé et infalsifiable, lié à votre compte fabricant.",
    color: "#10B981",
    bg: "#D1FAE5",
  },
  {
    step: 3,
    icon: TrendingUp,
    title: "Partagez et suivez",
    description:
      "Vos clients scannent et accèdent à la fiche authenticité. Vous suivez en temps réel les scans, retours clients et zones de consommation.",
    color: "#F59E0B",
    bg: "#FEF3C7",
  },
];

export function HowItWorksSection() {
  const { ref, revealed } = useReveal({ threshold: 0.15, once: true });

  return (
    <section id="comment-ca-marche" className="py-24 bg-[#F9FAFB]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-[#D1FAE5] text-[#10B981] text-xs font-semibold uppercase tracking-wide mb-4">
            Simple & rapide
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#111827] leading-tight">
            3 étapes simples pour la confiance de vos clients
          </h2>
          <p className="mt-4 text-lg text-[#4B5563]">
            Commencez en moins de 5 minutes, sans formation technique.
          </p>
        </div>

        {/* Steps */}
        <div ref={ref} className="relative">
          {/* Connection line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-1 rounded-full vs-step-line opacity-30" />

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className={`relative flex flex-col items-center text-center transition-all duration-700 ${
                    revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                  }`}
                  style={{ transitionDelay: `${i * 200}ms` }}
                >
                  {/* Numbered circle */}
                  <div className="relative mb-6">
                    <div
                      className="relative z-10 size-24 rounded-full flex items-center justify-center shadow-lg border-4 border-white"
                      style={{ backgroundColor: s.bg }}
                    >
                      <Icon className="size-10" style={{ color: s.color }} strokeWidth={2} />
                    </div>
                    {/* Step number badge */}
                    <div
                      className="absolute -top-2 -right-2 z-20 size-9 rounded-full flex items-center justify-center text-white font-display font-bold text-sm shadow-md"
                      style={{ backgroundColor: s.color }}
                    >
                      {s.step}
                    </div>
                  </div>

                  <h3 className="font-display text-xl sm:text-2xl font-semibold text-[#111827] mb-3">
                    {s.title}
                  </h3>
                  <p className="text-[#4B5563] leading-relaxed max-w-sm">
                    {s.description}
                  </p>

                  {/* Arrow between steps (mobile) */}
                  {i < steps.length - 1 && (
                    <div className="md:hidden mt-6 mb-2">
                      <ArrowRight className="size-5 text-[#9CA3AF] rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-[#6B7280] mb-4">
            Prêt à commencer ?
          </p>
          <a
            href="/register"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold shadow-md shadow-blue-200 transition-all hover:scale-[1.02]"
          >
            Démarrer maintenant
            <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

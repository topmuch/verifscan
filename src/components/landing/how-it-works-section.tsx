"use client";

import Link from "next/link";
import { Package, QrCode, TrendingUp, ArrowRight, Zap, ScanLine, CheckCircle2, MapPin } from "lucide-react";
import { useReveal } from "@/lib/use-animations";

const steps = [
  {
    step: 1,
    icon: Package,
    title: "Créez votre produit",
    short: "Ajoutez les détails de vos produits",
    description:
      "Ajoutez les détails de vos produits : nom, ingrédients, dates de fabrication et péremption, logo, certifications. Tout est centralisé sur une fiche propre et professionnelle.",
    color: "#2563EB",
    bg: "#DBEAFE",
  },
  {
    step: 2,
    icon: QrCode,
    title: "Générez le QR code",
    short: "Un QR code unique est créé pour chaque lot",
    description:
      "Un QR code unique est créé pour chaque lot, prêt à imprimer sur vos étiquettes. Chaque code est sécurisé et infalsifiable, lié à votre compte fabricant.",
    color: "#10B981",
    bg: "#D1FAE5",
  },
  {
    step: 3,
    icon: TrendingUp,
    title: "Partagez et suivez",
    short: "Vos clients scannent et accèdent à la fiche authentique",
    description:
      "Vos clients scannent et accèdent à la fiche authenticité en temps réel. Vous suivez les scans, retours clients et zones de consommation.",
    color: "#F59E0B",
    bg: "#FEF3C7",
  },
];

export function HowItWorksSection() {
  const { ref, revealed } = useReveal({ threshold: 0.15, once: true });

  return (
    <section id="comment-ca-marche" className="py-24 bg-white">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#D1FAE5] text-[#10B981] text-xs font-semibold uppercase tracking-wide mb-4">
            <Zap className="size-3.5" />
            Simple & rapide
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#111827] leading-tight">
            Commencez en moins de{" "}
            <span className="vs-gradient-text">5 minutes</span>
          </h2>
          <p className="mt-4 text-lg text-[#4B5563]">
            Aucune formation technique requise. Trois étapes suffisent pour transformer vos produits en marques de confiance.
          </p>
        </div>

        {/* Timeline — horizontal, animated */}
        <div ref={ref} className="relative">
          {/* Animated horizontal connector (desktop only) */}
          <div
            className={`hidden md:block vs-timeline-h ${revealed ? "vs-revealed" : ""}`}
            aria-hidden
          />

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
                  {/* Step circle — numbered, gradient */}
                  <div className="vs-step-circle mb-6">
                    {s.step}
                  </div>

                  {/* Card under each step */}
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 vs-card-shadow vs-card-lift w-full max-w-sm">
                    {/* Icon row */}
                    <div className="flex items-center justify-center mb-4">
                      <div
                        className="size-14 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: s.bg }}
                      >
                        <Icon className="size-7" style={{ color: s.color }} strokeWidth={2} />
                      </div>
                    </div>

                    <h3 className="font-display text-xl font-semibold text-[#111827] mb-2">
                      {s.title}
                    </h3>
                    <p className="text-sm text-[#6B7280] mb-3 italic">
                      {s.short}
                    </p>
                    <p className="text-[#4B5563] leading-relaxed text-sm">
                      {s.description}
                    </p>
                  </div>

                  {/* Mobile arrow */}
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

        {/* Process illustration */}
        <ProcessIllustration />

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-[#6B7280] mb-4">
            Prêt à commencer ?
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold shadow-md shadow-blue-200 transition-all hover:scale-[1.02]"
          >
            Démarrer maintenant
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Visual flow: Product → QR Code → Scan
 */
function ProcessIllustration() {
  const { ref, revealed } = useReveal({ threshold: 0.2, once: true });
  return (
    <div
      ref={ref}
      className={`mt-16 transition-all duration-700 ${revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      <div className="rounded-3xl bg-gradient-to-br from-[#F9FAFB] to-white border border-[#E5E7EB] p-8 vs-card-shadow">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Product */}
          <div className="flex flex-col items-center text-center">
            <div className="size-20 rounded-2xl bg-gradient-to-br from-[#DC2626] to-[#F59E0B] flex items-center justify-center text-4xl shadow-lg mb-3">
              🧃
            </div>
            <div className="text-sm font-semibold text-[#111827]">Produit</div>
            <div className="text-xs text-[#6B7280]">Jus de Bissap</div>
          </div>

          {/* Arrow */}
          <div className="hidden md:block text-[#2563EB]">
            <ArrowRight className="size-6" />
          </div>
          <div className="md:hidden text-[#2563EB]">
            <ArrowRight className="size-6 rotate-90" />
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center text-center">
            <div className="size-20 rounded-2xl bg-white border-2 border-[#10B981] flex items-center justify-center shadow-lg mb-3 vs-qr-pulse">
              <QrCode className="size-10 text-[#10B981]" />
            </div>
            <div className="text-sm font-semibold text-[#111827]">QR Code</div>
            <div className="text-xs text-[#6B7280]">Unique par lot</div>
          </div>

          {/* Arrow */}
          <div className="hidden md:block text-[#10B981]">
            <ArrowRight className="size-6" />
          </div>
          <div className="md:hidden text-[#10B981]">
            <ArrowRight className="size-6 rotate-90" />
          </div>

          {/* Scan */}
          <div className="flex flex-col items-center text-center">
            <div className="size-20 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center shadow-lg mb-3">
              <ScanLine className="size-10 text-white" />
            </div>
            <div className="text-sm font-semibold text-[#111827]">Scan client</div>
            <div className="text-xs text-[#6B7280]">Vérification instantanée</div>
          </div>

          {/* Arrow */}
          <div className="hidden md:block text-[#F59E0B]">
            <ArrowRight className="size-6" />
          </div>
          <div className="md:hidden text-[#F59E0B]">
            <ArrowRight className="size-6 rotate-90" />
          </div>

          {/* Result */}
          <div className="flex flex-col items-center text-center">
            <div className="size-20 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#047857] flex items-center justify-center shadow-lg mb-3">
              <CheckCircle2 className="size-10 text-white" />
            </div>
            <div className="text-sm font-semibold text-[#111827]">Authentifié</div>
            <div className="text-xs text-[#6B7280]">Confiance accrue</div>
          </div>
        </div>

        {/* Geo track */}
        <div className="mt-6 pt-6 border-t border-[#E5E7EB] flex items-center justify-center gap-2 text-xs text-[#6B7280]">
          <MapPin className="size-3.5 text-[#2563EB]" />
          Géolocalisation des scans en temps réel · Dakar, Thiès, Saint-Louis, Abidjan...
        </div>
      </div>
    </div>
  );
}

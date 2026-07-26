"use client";

import Link from "next/link";
import { QrCode, Globe2, BarChart3, ArrowRight } from "lucide-react";
import { useReveal } from "@/lib/use-animations";

const features = [
  {
    icon: QrCode,
    title: "Traçabilité totale",
    description:
      "Chaque lot dispose d'un QR code unique lié à une fiche produit complète : ingrédients, dates, origine, certifications. Vos clients accèdent à la vérité en un scan.",
    color: "#2563EB",
    bg: "#DBEAFE",
    link: "Découvrir la traçabilité",
  },
  {
    icon: Globe2,
    title: "Export simplifié",
    description:
      "Préparez vos dossiers de conformité pour les marchés internationaux (CEDEAO, UE, USA) avec des documents normalisés générés automatiquement depuis vos lots.",
    color: "#10B981",
    bg: "#D1FAE5",
    link: "Découvrir l'export",
  },
  {
    icon: BarChart3,
    title: "Statistiques utiles",
    description:
      "Suivez en temps réel les scans par région, par produit, par période. Identifiez vos marchés les plus dynamiques et optimisez votre distribution.",
    color: "#F59E0B",
    bg: "#FEF3C7",
    link: "Découvrir les stats",
  },
];

export function FeaturesSection() {
  const { ref, revealed } = useReveal({ threshold: 0.15, once: true });

  return (
    <section id="fonctionnalites" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-[#DBEAFE] text-[#2563EB] text-xs font-semibold uppercase tracking-wide mb-4">
            Pourquoi VerifScan ?
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#111827] leading-tight">
            Des fonctionnalités conçues pour votre succès
          </h2>
          <p className="mt-4 text-lg text-[#4B5563]">
            Tout ce dont vous avez besoin pour renforcer la confiance de vos clients et
            développer votre marché en toute sérénité.
          </p>
        </div>

        {/* Grid */}
        <div ref={ref} className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className={`group relative bg-white rounded-2xl border border-[#E5E7EB] p-8 vs-card-shadow transition-all duration-500 hover:-translate-y-2 hover:vs-card-shadow-hover ${
                  revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                {/* Icon */}
                <div
                  className="size-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                  style={{ backgroundColor: f.bg }}
                >
                  <Icon className="size-7" style={{ color: f.color }} strokeWidth={2} />
                </div>

                <h3 className="font-display text-xl font-semibold text-[#111827] mb-3">
                  {f.title}
                </h3>
                <p className="text-[#4B5563] leading-relaxed mb-6">
                  {f.description}
                </p>

                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:gap-2.5 transition-all"
                >
                  {f.link}
                  <ArrowRight className="size-4" />
                </Link>

                {/* Subtle hover accent bar */}
                <div
                  className="absolute bottom-0 left-8 right-8 h-0.5 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                  style={{ background: `linear-gradient(90deg, ${f.color}, transparent)` }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

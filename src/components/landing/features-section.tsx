"use client";

import Link from "next/link";
import { QrCode, Globe2, BarChart3, ArrowRight, Sparkles, CheckCircle2, TrendingUp, ShieldCheck } from "lucide-react";
import { useReveal } from "@/lib/use-animations";

const features = [
  {
    icon: QrCode,
    title: "Traçabilité totale",
    short: "Chaque lot dispose d'un QR code unique",
    description:
      "Chaque lot dispose d'un QR code unique lié à une fiche produit complète : ingrédients, dates, origine, certifications. Vos clients accèdent à la vérité en un scan.",
    bullets: [
      "QR code unique par lot",
      "Fiche produit complète en 1 scan",
      "Ingrédients, dates, origine, certifications",
    ],
    color: "#2563EB",
    bg: "#DBEAFE",
    gradient: "vs-icon-circle-blue",
    link: "En savoir plus",
  },
  {
    icon: Globe2,
    title: "Export simplifié",
    short: "Préparez vos dossiers CEDEAO, UE, USA",
    description:
      "Préparez vos dossiers de conformité pour les marchés internationaux (CEDEAO, UE, USA) avec des documents normalisés générés automatiquement depuis vos lots.",
    bullets: [
      "Documents CEDEAO, UE, FDA générés auto",
      "Formats normalisés prêts à déposer",
      "Historique des exports conservé",
    ],
    color: "#10B981",
    bg: "#D1FAE5",
    gradient: "vs-icon-circle-green",
    link: "En savoir plus",
  },
  {
    icon: BarChart3,
    title: "Statistiques utiles",
    short: "Suivez en temps réel les scans",
    description:
      "Suivez en temps réel les scans par région, par produit, par période. Identifiez vos marchés les plus dynamiques et optimisez votre distribution.",
    bullets: [
      "Scans par région, produit, période",
      "Heatmap géographique en temps réel",
      "Identification des marchés dynamiques",
    ],
    color: "#F59E0B",
    bg: "#FEF3C7",
    gradient: "vs-icon-circle-orange",
    link: "En savoir plus",
  },
];

export function FeaturesSection() {
  const { ref, revealed } = useReveal({ threshold: 0.15, once: true });

  return (
    <section id="fonctionnalites" className="py-24 vs-section-soft">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#DBEAFE] text-[#2563EB] text-xs font-semibold uppercase tracking-wide mb-4">
            <Sparkles className="size-3.5" />
            Pourquoi VerifScan ?
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#111827] leading-tight">
            Tout ce dont vous avez besoin pour{" "}
            <span className="vs-gradient-text">renforcer la confiance</span>
          </h2>
          <p className="mt-4 text-lg text-[#4B5563]">
            Trois piliers pour transformer la traçabilité en avantage concurrentiel.
          </p>
        </div>

        {/* Grid — 3 columns */}
        <div ref={ref} className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className={`group relative bg-white rounded-3xl border border-[#E5E7EB] p-8 vs-card-lift vs-card-shadow transition-all duration-500 ${
                  revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                {/* Gradient icon circle */}
                <div className={`vs-icon-circle ${f.gradient} mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                  <Icon className="size-7" strokeWidth={2} />
                </div>

                <h3 className="font-display text-xl font-semibold text-[#111827] mb-3">
                  {f.title}
                </h3>
                <p className="text-[#4B5563] leading-relaxed mb-5">
                  {f.description}
                </p>

                {/* Bullet list */}
                <ul className="space-y-2 mb-6">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-[#374151]">
                      <CheckCircle2 className="size-4 text-[#10B981] mt-0.5 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                {/* "En savoir plus" link with animated arrow */}
                <Link
                  href="/register"
                  className={`vs-link-arrow text-sm ${f.color === "#2563EB" ? "text-[#2563EB]" : f.color === "#10B981" ? "text-[#10B981]" : "text-[#F59E0B]"}`}
                >
                  {f.link}
                  <ArrowRight className="size-4" />
                </Link>

                {/* Subtle hover accent bar at bottom */}
                <div
                  className="absolute bottom-0 left-8 right-8 h-0.5 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                  style={{ background: `linear-gradient(90deg, ${f.color}, transparent)` }}
                />
              </div>
            );
          })}
        </div>

        {/* Dashboard illustration */}
        <DashboardIllustration />
      </div>
    </section>
  );
}

/**
 * Mini dashboard mockup below the cards.
 * Pure CSS — no real chart lib needed.
 */
function DashboardIllustration() {
  const { ref, revealed } = useReveal({ threshold: 0.2, once: true });
  return (
    <div
      ref={ref}
      className={`mt-16 transition-all duration-700 ${revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      <div className="relative rounded-3xl bg-white border border-[#E5E7EB] vs-card-shadow-lg overflow-hidden">
        {/* Window chrome */}
        <div className="bg-[#F9FAFB] px-4 py-3 border-b border-[#E5E7EB] flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-red-400" />
            <div className="size-3 rounded-full bg-amber-400" />
            <div className="size-3 rounded-full bg-green-400" />
          </div>
          <div className="mx-auto text-xs text-[#6B7280] font-mono">
            verifscan.roomscan.pro/dashboard
          </div>
        </div>

        {/* Body — 3 KPI cards + chart */}
        <div className="p-6 grid md:grid-cols-4 gap-4">
          <div className="md:col-span-1 space-y-3">
            <div className="rounded-xl bg-gradient-to-br from-[#DBEAFE] to-white p-4 border border-[#2563EB]/20">
              <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-1">
                <QrCode className="size-3.5" />
                Scans totaux
              </div>
              <div className="font-mono text-2xl font-bold text-[#2563EB]">12 458</div>
              <div className="text-[10px] text-[#10B981] flex items-center gap-1 mt-1">
                <TrendingUp className="size-3" />
                +18% vs sem. dernière
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-[#D1FAE5] to-white p-4 border border-[#10B981]/20">
              <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-1">
                <ShieldCheck className="size-3.5" />
                Lots actifs
              </div>
              <div className="font-mono text-2xl font-bold text-[#10B981]">42</div>
              <div className="text-[10px] text-[#6B7280] mt-1">8 rappelés</div>
            </div>
          </div>

          {/* Mock bar chart */}
          <div className="md:col-span-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-sm text-[#111827]">Scans des 14 derniers jours</h4>
                <p className="text-xs text-[#6B7280]">Tous produits confondus</p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="inline-flex items-center gap-1 text-[#2563EB]">
                  <span className="size-2 rounded-full bg-[#2563EB]" /> Mobile
                </span>
                <span className="inline-flex items-center gap-1 text-[#10B981]">
                  <span className="size-2 rounded-full bg-[#10B981]" /> Desktop
                </span>
              </div>
            </div>
            <div className="flex items-end gap-2 h-32">
              {[40, 55, 45, 70, 60, 80, 65, 90, 75, 95, 85, 100, 88, 92].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col gap-0.5 justify-end">
                  <div
                    className="bg-[#10B981] rounded-t"
                    style={{ height: `${h * 0.4}%` }}
                  />
                  <div
                    className="bg-[#2563EB] rounded-b"
                    style={{ height: `${h * 0.6}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

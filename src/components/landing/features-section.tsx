"use client";

import Link from "next/link";
import { QrCode, Globe2, BarChart3, ArrowRight, Sparkles, CheckCircle2, TrendingUp, ShieldCheck } from "lucide-react";
import { useReveal } from "@/lib/use-animations";

type Feature = {
  icon: typeof QrCode;
  title: string;
  short: string;
  description: string;
  bullets: string[];
  /** Solid background color for the card (filled). */
  bg: string;
  /** Accent color (lighter tint) for the icon circle and decorative elements. */
  accent: string;
  /** Hover tint for icon circle background. */
  iconBg: string;
  link: string;
};

const features: Feature[] = [
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
    bg: "#0f4382",
    accent: "#FFFFFF",
    iconBg: "rgba(255, 255, 255, 0.15)",
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
    bg: "#2ebd5a",
    accent: "#FFFFFF",
    iconBg: "rgba(255, 255, 255, 0.18)",
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
    bg: "#0f4382",
    accent: "#FFFFFF",
    iconBg: "rgba(255, 255, 255, 0.15)",
    link: "En savoir plus",
  },
];

export function FeaturesSection() {
  const { ref, revealed } = useReveal({ threshold: 0.15, once: true });

  return (
    <section id="fonctionnalites" className="py-24 vs-section-soft">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#DBEAFE] text-[#0f4382] text-xs font-semibold uppercase tracking-wide mb-4">
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

        {/* Grid — 3 columns with alternating solid colors */}
        <div ref={ref} className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className={`group relative rounded-3xl p-8 vs-card-lift transition-all duration-500 overflow-hidden ${
                  revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{
                  backgroundColor: f.bg,
                  transitionDelay: `${i * 120}ms`,
                  boxShadow:
                    "0 12px 30px -8px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.08)",
                }}
              >
                {/* Decorative glow in top-right */}
                <div
                  className="absolute -top-12 -right-12 size-40 rounded-full opacity-25 blur-2xl pointer-events-none"
                  style={{ backgroundColor: f.bg === "#0f4382" ? "#2ebd5a" : "#0f4382" }}
                />

                {/* Icon circle (white-on-color) */}
                <div
                  className="relative mb-6 flex items-center justify-center size-14 rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                  style={{ backgroundColor: f.iconBg }}
                >
                  <Icon className="size-7 text-white" strokeWidth={2.2} />
                </div>

                <h3 className="font-display text-xl font-semibold text-white mb-3">
                  {f.title}
                </h3>
                <p className="text-white/85 leading-relaxed mb-5">
                  {f.description}
                </p>

                {/* Bullet list */}
                <ul className="space-y-2.5 mb-6">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-white/95">
                      <CheckCircle2 className="size-4 text-white/90 mt-0.5 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                {/* "En savoir plus" link */}
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:gap-3 transition-all"
                >
                  {f.link}
                  <ArrowRight className="size-4" />
                </Link>

                {/* Subtle hover accent bar at bottom */}
                <div
                  className="absolute bottom-0 left-8 right-8 h-1 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                  style={{
                    background:
                      f.bg === "#0f4382"
                        ? "linear-gradient(90deg, #2ebd5a, transparent)"
                        : "linear-gradient(90deg, #0f4382, transparent)",
                  }}
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
            <div className="rounded-xl bg-gradient-to-br from-[#DBEAFE] to-white p-4 border border-[#0f4382]/20">
              <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-1">
                <QrCode className="size-3.5" />
                Scans totaux
              </div>
              <div className="font-mono text-2xl font-bold text-[#0f4382]">12 458</div>
              <div className="text-[10px] text-[#2ebd5a] flex items-center gap-1 mt-1">
                <TrendingUp className="size-3" />
                +18% vs sem. dernière
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-[#DCFCE7] to-white p-4 border border-[#2ebd5a]/20">
              <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-1">
                <ShieldCheck className="size-3.5" />
                Lots actifs
              </div>
              <div className="font-mono text-2xl font-bold text-[#2ebd5a]">42</div>
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
                <span className="inline-flex items-center gap-1 text-[#0f4382]">
                  <span className="size-2 rounded-full bg-[#0f4382]" /> Mobile
                </span>
                <span className="inline-flex items-center gap-1 text-[#2ebd5a]">
                  <span className="size-2 rounded-full bg-[#2ebd5a]" /> Desktop
                </span>
              </div>
            </div>
            <div className="flex items-end gap-2 h-32">
              {[40, 55, 45, 70, 60, 80, 65, 90, 75, 95, 85, 100, 88, 92].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col gap-0.5 justify-end">
                  <div
                    className="bg-[#2ebd5a] rounded-t"
                    style={{ height: `${h * 0.4}%` }}
                  />
                  <div
                    className="bg-[#0f4382] rounded-b"
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

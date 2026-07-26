"use client";

import { Smartphone, Building2, ShieldCheck, TrendingUp, Calendar } from "lucide-react";
import { useRevealCounter } from "@/lib/use-animations";

const stats = [
  { icon: Smartphone, value: 12458, suffix: "", label: "Produits scannés cette semaine", color: "#FFFFFF" },
  { icon: Building2, value: 250, suffix: "+", label: "Fabricants actifs", color: "#FCD34D" },
  { icon: ShieldCheck, value: 98, suffix: "%", label: "De confiance accrue", color: "#6EE7B7" },
  { icon: TrendingUp, value: 35, suffix: "%", label: "D'augmentation des ventes", color: "#FCD34D" },
];

function StatCard({
  stat,
  index,
}: {
  stat: (typeof stats)[number];
  index: number;
}) {
  const { ref, count, revealed } = useRevealCounter(stat.value, 2000 + index * 200);
  const Icon = stat.icon;

  return (
    <div
      ref={ref}
      className="text-center transition-all duration-700"
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${index * 100}ms`,
      }}
    >
      <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
        <Icon className="size-7" style={{ color: stat.color }} strokeWidth={2} />
      </div>
      <div className="font-mono text-4xl sm:text-5xl font-bold text-white mb-2">
        {count.toLocaleString("fr-FR")}
        <span style={{ color: stat.color }}>{stat.suffix}</span>
      </div>
      <div className="text-sm sm:text-base text-blue-100 max-w-[180px] mx-auto leading-snug">
        {stat.label}
      </div>
    </div>
  );
}

export function StatsSection() {
  return (
    <section className="relative py-24 overflow-hidden vs-gradient-blue">
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>
      <div className="absolute -top-20 -right-20 size-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 size-80 rounded-full bg-[#10B981]/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold uppercase tracking-wide mb-4 backdrop-blur-sm">
            Impact réel
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-white leading-tight">
            Des chiffres qui parlent d&apos;eux-mêmes
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            VerifScan génère de la confiance mesurable, semaine après semaine.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {stats.map((s, i) => (
            <StatCard key={s.label} stat={s} index={i} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <Calendar className="size-5 text-[#FCD34D]" />
            <span className="text-white font-medium">
              14 jours d&apos;essai gratuit — sans carte bancaire
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

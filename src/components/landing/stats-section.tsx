"use client";

import { Smartphone, Building2, ShieldCheck, TrendingUp, Calendar, BarChart3, Globe2, Zap } from "lucide-react";
import { useRevealCounter } from "@/lib/use-animations";

const stats = [
  { icon: Smartphone, value: 12458, suffix: "", label: "Produits scannés cette semaine", color: "#FFFFFF", bgTint: "from-[#2563EB] to-[#1D4ED8]" },
  { icon: Building2, value: 250, suffix: "+", label: "Fabricants actifs", color: "#FCD34D", bgTint: "from-[#10B981] to-[#047857]" },
  { icon: ShieldCheck, value: 98, suffix: "%", label: "De confiance accrue", color: "#6EE7B7", bgTint: "from-[#F59E0B] to-[#D97706]" },
  { icon: TrendingUp, value: 35, suffix: "%", label: "D'augmentation des ventes", color: "#FCD34D", bgTint: "from-[#7C3AED] to-[#5B21B6]" },
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
      className="relative text-center transition-all duration-700"
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(24px)",
        transitionDelay: `${index * 120}ms`,
      }}
    >
      {/* Icon at the top — circle with white icon */}
      <div className="inline-flex items-center justify-center mb-5">
        <div className={`size-16 rounded-2xl bg-gradient-to-br ${stat.bgTint} flex items-center justify-center shadow-lg`}>
          <Icon className="size-8 text-white" strokeWidth={2} />
        </div>
      </div>

      {/* Big number — count-up animation */}
      <div className="vs-stat-number font-mono text-5xl sm:text-6xl font-bold text-white mb-3 leading-none">
        {count.toLocaleString("fr-FR")}
        <span style={{ color: stat.color }}>{stat.suffix}</span>
      </div>

      {/* Label */}
      <div className="text-sm sm:text-base text-blue-100 max-w-[180px] mx-auto leading-snug">
        {stat.label}
      </div>
    </div>
  );
}

export function StatsSection() {
  return (
    <section className="relative py-24 overflow-hidden vs-gradient-blue">
      {/* Decorative dot pattern */}
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

      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/15 text-white text-xs font-semibold uppercase tracking-wide mb-4 backdrop-blur-sm">
            <Zap className="size-3.5" />
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

        {/* Bottom badge — trial */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 vs-animate-pulse-soft">
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

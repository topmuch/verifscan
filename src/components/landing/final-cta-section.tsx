"use client";

import Link from "next/link";
import { ArrowRight, PlayCircle, CheckCircle2, Sparkles, Rocket, ShieldCheck, Clock, Headset, Settings2 } from "lucide-react";
import { useReveal } from "@/lib/use-animations";

const benefits = [
  { icon: Clock, label: "14 jours d'essai gratuit" },
  { icon: ShieldCheck, label: "Aucun engagement" },
  { icon: Headset, label: "Support client inclus" },
  { icon: Settings2, label: "Configuration en 5 minutes" },
];

export function FinalCTASection() {
  const { ref, revealed } = useReveal({ threshold: 0.2, once: true });

  return (
    <section className="py-24 relative overflow-hidden vs-hero-bg">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/4 size-72 rounded-full bg-[#0f4382]/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 size-72 rounded-full bg-[#2ebd5a]/8 blur-3xl pointer-events-none" />

      <div
        ref={ref}
        className={`relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
          revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        }`}
      >
        {/* Card with gradient border */}
        <div className="vs-popular-card p-10 sm:p-14 text-center">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#DBEAFE] text-[#0f4382] text-xs font-semibold uppercase tracking-wide mb-6">
            <Rocket className="size-3.5" />
            Démarrez aujourd&apos;hui
          </span>

          {/* Title */}
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111827] leading-tight">
            Prêt à renforcer la confiance de vos{" "}
            <span className="vs-gradient-text">clients</span> ?
          </h2>

          <p className="mt-5 text-lg sm:text-xl text-[#4B5563] max-w-2xl mx-auto">
            Rejoignez les 250+ fabricants qui font déjà confiance à VerifScan pour
            authentifier leurs produits et développer leurs marchés.
          </p>

          {/* Buttons — bigger, more visible */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="vs-cta-pulse inline-flex items-center gap-2 h-14 px-8 rounded-xl bg-gradient-to-r from-[#0f4382] to-[#0a3060] text-white text-base font-semibold shadow-xl transition-all hover:scale-[1.02]"
            >
              Créer votre compte gratuit
              <ArrowRight className="size-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 h-14 px-8 rounded-xl bg-white border-2 border-[#0f4382]/20 text-[#0f4382] hover:border-[#0f4382]/40 hover:bg-[#DBEAFE] text-base font-semibold transition-all hover:scale-[1.02]"
            >
              <PlayCircle className="size-5" />
              Voir une démo en direct
            </Link>
          </div>

          {/* Avantages — bigger list with icons */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.label}
                  className="flex flex-col items-center text-center gap-2 p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]"
                >
                  <div className="size-10 rounded-xl bg-gradient-to-br from-[#2ebd5a]/10 to-[#0f4382]/10 flex items-center justify-center">
                    <Icon className="size-5 text-[#2ebd5a]" />
                  </div>
                  <span className="text-xs sm:text-sm text-[#374151] font-medium leading-tight">
                    {b.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Social proof line */}
          <div className="mt-10 pt-8 border-t border-[#E5E7EB] flex items-center justify-center gap-3 text-sm text-[#6B7280]">
            <div className="flex -space-x-2">
              {["🧑🏾", "👩🏾", "👨🏾‍💼", "👩🏾‍🦱", "🧑🏾‍🌾"].map((emoji, i) => (
                <div
                  key={i}
                  className="size-8 rounded-full bg-gradient-to-br from-[#DBEAFE] to-[#DCFCE7] border-2 border-white flex items-center justify-center text-sm shadow-sm"
                >
                  {emoji}
                </div>
              ))}
            </div>
            <span>
              Rejoint par <strong className="text-[#111827]">12 nouveaux fabricants</strong> cette semaine
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

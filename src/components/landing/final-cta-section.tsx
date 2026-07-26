"use client";

import Link from "next/link";
import { ArrowRight, PlayCircle, CheckCircle2 } from "lucide-react";
import { useReveal } from "@/lib/use-animations";

export function FinalCTASection() {
  const { ref, revealed } = useReveal({ threshold: 0.2, once: true });

  return (
    <section className="py-24 bg-[#F9FAFB] relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/4 size-72 rounded-full bg-[#2563EB]/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 size-72 rounded-full bg-[#10B981]/8 blur-3xl pointer-events-none" />

      <div
        ref={ref}
        className={`relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center transition-all duration-700 ${
          revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        }`}
      >
        {/* Badge */}
        <span className="inline-block px-3 py-1 rounded-full bg-[#DBEAFE] text-[#2563EB] text-xs font-semibold uppercase tracking-wide mb-6">
          Démarrez aujourd&apos;hui
        </span>

        {/* Title */}
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111827] leading-tight">
          Prêt à renforcer la confiance de vos clients ?
        </h2>

        <p className="mt-5 text-lg sm:text-xl text-[#4B5563] max-w-2xl mx-auto">
          Commencez gratuitement dès maintenant, sans carte bancaire. Rejoignez les 250+
          fabricants qui font déjà confiance à VerifScan.
        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="vs-animate-pulse-soft inline-flex items-center gap-2 h-14 px-8 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-lg font-semibold shadow-xl shadow-blue-200 transition-all hover:scale-[1.02]"
          >
            Créer votre compte gratuit
            <ArrowRight className="size-5" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 h-14 px-8 rounded-xl bg-white border-2 border-[#2563EB] text-[#2563EB] hover:bg-[#DBEAFE] text-lg font-semibold transition-all hover:scale-[1.02]"
          >
            <PlayCircle className="size-5" />
            Voir une démo en direct
          </Link>
        </div>

        {/* Avantages */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-[#4B5563]">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="size-4 text-[#10B981]" />
            14 jours d&apos;essai gratuit
          </span>
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="size-4 text-[#10B981]" />
            Aucun engagement
          </span>
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="size-4 text-[#10B981]" />
            Support client inclus
          </span>
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="size-4 text-[#10B981]" />
            Configuration en 5 minutes
          </span>
        </div>
      </div>
    </section>
  );
}

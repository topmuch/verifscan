"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Lock,
  CheckCircle2,
  PlayCircle,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { useReveal } from "@/lib/use-animations";

export function HeroSection() {
  const { ref, revealed } = useReveal({ threshold: 0.1, once: true });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden vs-hero-bg pt-12 pb-20 lg:pt-16 lg:pb-28"
    >
      {/* Animated particles background */}
      <div className="vs-particles" aria-hidden />

      {/* Decorative blobs (kept for depth) */}
      <div className="absolute top-20 -left-20 size-72 rounded-full bg-[#2563EB]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 size-96 rounded-full bg-[#10B981]/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text column */}
          <div
            className={`space-y-7 transition-all duration-700 ${
              revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Trust badge — blockchain secured */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E5E7EB] shadow-sm">
              <Lock className="size-3.5 text-[#10B981]" />
              <span className="text-sm font-medium text-[#374151]">
                Sécurisé par blockchain
              </span>
              <span className="size-1.5 rounded-full bg-[#10B981] animate-pulse" />
            </div>

            {/* H1 — short, punchy */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[64px] leading-[1.05] font-bold tracking-tight text-[#111827]">
              La traçabilité alimentaire qui inspire{" "}
              <span className="vs-gradient-text">confiance</span>
            </h1>

            {/* Subtitle — passeport numérique */}
            <p className="text-lg sm:text-xl text-[#4B5563] max-w-xl leading-relaxed">
              Le passeport numérique qui protège votre marque et rassure vos
              clients en un simple scan.
            </p>

            {/* CTAs — principal + secondary */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 h-14 px-8 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-base font-semibold shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] hover:shadow-xl"
              >
                Essai gratuit 14 jours
                <ArrowRight className="size-5" />
              </Link>
              <Link
                href="/produits"
                className="inline-flex items-center gap-2 h-14 px-6 rounded-xl bg-white hover:bg-gray-50 text-[#2563EB] text-base font-semibold border-2 border-[#2563EB]/20 transition-all hover:border-[#2563EB]/40"
              >
                <PlayCircle className="size-5" />
                Voir une démo
              </Link>
            </div>

            {/* Reassurance row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#6B7280]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-[#10B981]" />
                Sans carte bancaire
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-[#10B981]" />
                Annulation libre
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-[#10B981]" />
                Configuration en 5 min
              </span>
            </div>
          </div>

          {/* Visual column — AI-generated hero illustration with floating cards */}
          <div
            className={`relative transition-all duration-1000 delay-150 ${
              revealed ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
            }`}
          >
            <div className="relative mx-auto max-w-2xl vs-card-shadow-lg">
              {/* Main hero image */}
              <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#EFF6FF] via-white to-[#ECFDF5] border border-white shadow-2xl shadow-blue-200/40">
                <Image
                  src="/hero/hero-main.png"
                  alt="VerifScan — smartphone scannant un QR code sur un produit alimentaire avec vérification blockchain"
                  width={1344}
                  height={768}
                  priority
                  className="w-full h-auto block"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                {/* Subtle inner glow */}
                <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/40 rounded-[2rem]" />
              </div>

              {/* Floating cards around the image */}
              <div className="absolute -top-6 -right-4 lg:-right-8 vs-animate-float">
                <div className="bg-white rounded-2xl shadow-xl p-4 border border-[#E5E7EB] flex items-center gap-3 max-w-[220px]">
                  <div className="size-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
                    <ShieldCheck className="size-5 text-[#10B981]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#111827]">Sécurisé blockchain</p>
                    <p className="text-[10px] text-[#6B7280]">Données immuables</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-4 lg:-left-8 vs-animate-float-delayed">
                <div className="bg-white rounded-2xl shadow-xl p-4 border border-[#E5E7EB] flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center">
                    <Smartphone className="size-5 text-[#2563EB]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#111827]">Scanné en 0.3s</p>
                    <p className="text-[10px] text-[#6B7280]">Vérification instantanée</p>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/3 -left-6 lg:-left-12 vs-animate-float">
                <div className="bg-[#F59E0B] rounded-2xl shadow-xl p-3 border border-[#F59E0B]">
                  <ScanLine className="size-6 text-white" />
                </div>
              </div>

              <div className="absolute bottom-1/4 -right-4 lg:-right-10 vs-animate-float-delayed">
                <div className="bg-white rounded-full shadow-xl px-3 py-2 border border-[#E5E7EB] flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#10B981]" />
                  <span className="text-xs font-semibold text-[#047857]">Authentique</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust strip — client logos */}
        <div className="mt-20 pt-10 border-t border-[#E5E7EB]">
          <p className="text-center text-xs uppercase tracking-widest text-[#6B7280] font-medium mb-6">
            Ils nous font confiance à travers le Sénégal et l&apos;Afrique de l&apos;Ouest
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
            {[
              { name: "Sarine Bio", icon: "🌿" },
              { name: "Téranga Foods", icon: "🍽️" },
              { name: "Bissap Premium", icon: "🧃" },
              { name: "Sénégal Agro", icon: "🌾" },
              { name: "Dakar Foods", icon: "🥫" },
              { name: "BioAfrica", icon: "🌍" },
            ].map((brand) => (
              <span
                key={brand.name}
                className="inline-flex items-center gap-2 font-display font-semibold text-lg text-[#374151] hover:text-[#2563EB] transition-colors"
              >
                <span className="text-2xl" aria-hidden>{brand.icon}</span>
                {brand.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

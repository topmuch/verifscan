"use client";

import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Sparkles,
  CheckCircle2,
  Calendar,
  ListChecks,
  ScanLine,
  MapPin,
} from "lucide-react";
import { useReveal } from "@/lib/use-animations";

export function HeroSection() {
  const { ref, revealed } = useReveal({ threshold: 0.1, once: true });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden vs-gradient-hero pt-12 pb-20 lg:pt-16 lg:pb-28"
    >
      {/* Decorative blobs */}
      <div className="absolute top-20 -left-20 size-72 rounded-full bg-[#2563EB]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 size-96 rounded-full bg-[#10B981]/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text */}
          <div
            className={`space-y-7 transition-all duration-700 ${
              revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Top badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E5E7EB] shadow-sm">
              <span className="flex size-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-sm font-medium text-[#374151]">
                <Sparkles className="inline size-3.5 mr-1 text-[#F59E0B]" />
                Passeport numérique pour vos produits
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[60px] leading-[1.1] font-bold tracking-tight text-[#111827]">
              Garantissez <span className="vs-gradient-text">l&apos;authenticité</span> de vos produits en un scan
            </h1>

            <p className="text-lg sm:text-xl text-[#4B5563] max-w-xl leading-relaxed">
              Le passeport numérique qui renforce la confiance de vos clients et
              protège votre marque contre la contrefaçon.
            </p>

            {/* CTAs */}
            <div className="space-y-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 h-14 px-8 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-lg font-semibold shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] hover:shadow-xl"
              >
                Créer votre compte gratuit
                <ArrowRight className="size-5" />
              </Link>
              <p className="text-sm text-[#6B7280] flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[#10B981]" />
                Aucune carte bancaire requise
                <span className="text-[#E5E7EB]">·</span>
                <CheckCircle2 className="size-4 text-[#10B981]" />
                14 jours d&apos;essai gratuit
              </p>
            </div>

            {/* Inline stats */}
            <div className="grid grid-cols-2 gap-4 pt-6 max-w-md">
              <div className="border-l-4 border-[#2563EB] pl-4">
                <div className="font-mono text-2xl sm:text-3xl font-bold text-[#111827]">
                  12 458
                </div>
                <div className="text-sm text-[#6B7280] font-medium">
                  produits scannés cette semaine
                </div>
              </div>
              <div className="border-l-4 border-[#10B981] pl-4">
                <div className="font-mono text-2xl sm:text-3xl font-bold text-[#111827]">
                  98%
                </div>
                <div className="text-sm text-[#6B7280] font-medium">
                  de confiance en plus avec VerifScan
                </div>
              </div>
            </div>
          </div>

          {/* Visual: phone mockup + floating cards */}
          <div
            className={`relative transition-all duration-1000 delay-150 ${
              revealed ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
            }`}
          >
            <div className="relative mx-auto max-w-sm">
              {/* Smartphone */}
              <div className="relative rounded-[2.5rem] bg-gray-900 shadow-2xl shadow-blue-200/60 border-8 border-gray-900 overflow-hidden vs-card-shadow-lg">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10" />

                {/* Status bar */}
                <div className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-6 pt-8 pb-3 flex items-center justify-between text-white text-xs">
                  <span className="font-medium">verifscan.sn</span>
                  <span className="opacity-80 font-mono">9:41</span>
                </div>

                {/* Body */}
                <div className="bg-white p-6 space-y-5">
                  {/* Verified badge */}
                  <div className="flex items-center justify-center gap-2 py-2 px-4 bg-[#D1FAE5] rounded-full">
                    <CheckCircle2 className="size-5 text-[#10B981]" />
                    <span className="text-sm font-semibold text-[#047857]">Produit authentique — Vérifié</span>
                  </div>

                  {/* Product illustration */}
                  <div className="flex justify-center">
                    <div className="relative size-32 rounded-2xl bg-gradient-to-br from-[#DC2626] to-[#F59E0B] flex items-center justify-center shadow-lg">
                      <span className="text-5xl">🧃</span>
                      <div className="absolute -top-2 -right-2 size-8 rounded-full bg-[#F59E0B] flex items-center justify-center text-white text-xs font-bold shadow">
                        BIO
                      </div>
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <h3 className="font-display font-bold text-xl text-[#111827]">Jus de Bissap</h3>
                    <p className="text-xs text-[#6B7280]">Sarine Bio · 500ml · Lot #BSC-2026-0142</p>
                  </div>

                  {/* Product details grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-[#F9FAFB] p-3 border border-[#E5E7EB]">
                      <div className="flex items-center gap-1.5 text-[#6B7280] mb-1">
                        <Calendar className="size-3.5" />
                        <span className="font-medium">Période</span>
                      </div>
                      <p className="font-semibold text-[#111827] font-mono">15/07 → 30/09/2026</p>
                    </div>
                    <div className="rounded-xl bg-[#F9FAFB] p-3 border border-[#E5E7EB]">
                      <div className="flex items-center gap-1.5 text-[#6B7280] mb-1">
                        <MapPin className="size-3.5" />
                        <span className="font-medium">Origine</span>
                      </div>
                      <p className="font-semibold text-[#111827]">Dakar, SN</p>
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div className="rounded-xl bg-[#FEF3C7] p-3 border border-[#F59E0B]/30">
                    <div className="flex items-center gap-1.5 text-[#92400E] mb-1.5">
                      <ListChecks className="size-3.5" />
                      <span className="text-xs font-semibold">Ingrédients</span>
                    </div>
                    <p className="text-xs text-[#78350F] leading-relaxed">
                      Bissap bio, sucre de canne, eau filtrée, citron naturel — sans conservateurs
                    </p>
                  </div>

                  {/* QR mini */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <div className="size-10 rounded-md vs-qr-pattern bg-[#111827]" />
                    <span className="text-[10px] text-[#6B7280] font-mono">SCAN OK · 0.3s</span>
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              <div className="absolute -top-6 -right-6 vs-animate-float">
                <div className="bg-white rounded-2xl shadow-xl p-4 border border-[#E5E7EB] flex items-center gap-3 max-w-[200px]">
                  <div className="size-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
                    <ShieldCheck className="size-5 text-[#10B981]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#111827]">Sécurisé blockchain</p>
                    <p className="text-[10px] text-[#6B7280]">Données immuables</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 vs-animate-float-delayed">
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

              <div className="absolute top-1/3 -left-10 vs-animate-float">
                <div className="bg-[#F59E0B] rounded-2xl shadow-xl p-3 border border-[#F59E0B]">
                  <ScanLine className="size-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust indicators strip */}
        <div className="mt-20 pt-10 border-t border-[#E5E7EB]">
          <p className="text-center text-xs uppercase tracking-widest text-[#6B7280] font-medium mb-6">
            Ils nous font confiance à travers le Sénégal et l&apos;Afrique de l&apos;Ouest
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-60">
            {["Sarine Bio", "Téranga Foods", "Bissap Premium", "Sénégal Agro", "Dakar Foods", "BioAfrica"].map(
              (brand) => (
                <span
                  key={brand}
                  className="font-display font-semibold text-lg text-[#374151]"
                >
                  {brand}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

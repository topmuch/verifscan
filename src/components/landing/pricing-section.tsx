"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Star, ArrowRight, Sparkles } from "lucide-react";
import { useReveal } from "@/lib/use-animations";

type Plan = {
  name: string;
  monthlyPrice: number; // FCFA
  description: string;
  features: string[];
  cta: string;
  href: string;
  popular: boolean;
  accentColor: string; // hex
};

const plans: Plan[] = [
  {
    name: "Starter",
    monthlyPrice: 10000,
    description: "Pour les petites entreprises qui démarrent",
    features: [
      "Jusqu'à 5 produits",
      "500 QR codes par mois",
      "Statistiques basiques",
      "Page produit publique",
      "Support email (48h)",
      "1 utilisateur",
    ],
    cta: "Choisir Starter",
    href: "/register?plan=starter",
    popular: false,
    accentColor: "#0f4382",
  },
  {
    name: "Pro",
    monthlyPrice: 25000,
    description: "Pour les PME en croissance",
    features: [
      "Produits illimités",
      "5 000 QR codes par mois",
      "Statistiques avancées + export",
      "Marketplace B2B intégrée",
      "Support prioritaire (24h)",
      "5 utilisateurs inclus",
      "Documents d'export CEDEAO",
      "API publique",
    ],
    cta: "Choisir Pro",
    href: "/register?plan=pro",
    popular: true,
    accentColor: "#2ebd5a",
  },
  {
    name: "Business",
    monthlyPrice: 75000,
    description: "Pour les grands groupes et exportateurs",
    features: [
      "Produits illimités",
      "QR codes illimités",
      "Statistiques temps réel + BI",
      "Multi-sociétés",
      "Support dédié (4h)",
      "Utilisateurs illimités",
      "Documents export UE / USA",
      "API + Webhooks",
      "SLA 99.9%",
    ],
    cta: "Choisir Business",
    href: "/register?plan=business",
    popular: false,
    accentColor: "#F59E0B",
  },
];

function formatPrice(n: number) {
  return n.toLocaleString("fr-FR").replace(/,/g, " ");
}

export function PricingSection() {
  const { ref, revealed } = useReveal({ threshold: 0.1, once: true });
  const [annual, setAnnual] = useState(false);

  // Annual price = monthly * 12 * 0.7 (30% off)
  const getPrice = (monthly: number) => {
    if (!annual) return monthly;
    return Math.round((monthly * 12 * 0.7) / 12); // monthly equivalent
  };

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#DBEAFE] text-[#0f4382] text-xs font-semibold uppercase tracking-wide mb-4">
            <Sparkles className="size-3.5" />
            Tarifs
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#111827] leading-tight">
            Des formules adaptées à votre <span className="vs-gradient-text">entreprise</span>
          </h2>
          <p className="mt-4 text-lg text-[#4B5563]">
            Aucun engagement, annulation à tout moment. 14 jours d&apos;essai gratuit.
          </p>
        </div>

        {/* Toggle Mensuel / Annuel */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setAnnual(false)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              !annual
                ? "bg-[#0f4382] text-white shadow-md"
                : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:bg-gray-50"
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all inline-flex items-center gap-2 ${
              annual
                ? "bg-[#2ebd5a] text-white shadow-md"
                : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:bg-gray-50"
            }`}
          >
            Annuel
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              annual ? "bg-white/20 text-white" : "bg-[#DCFCE7] text-[#1f8a42]"
            }`}>
              -30%
            </span>
          </button>
        </div>

        {/* Pricing cards */}
        <div ref={ref} className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {plans.map((plan, i) => {
            const price = getPrice(plan.monthlyPrice);
            return (
              <div
                key={plan.name}
                className={`relative rounded-3xl transition-all duration-500 ${
                  plan.popular
                    ? "vs-popular-card md:-mt-4 md:mb-4"
                    : "bg-white border-2 border-[#E5E7EB] vs-card-shadow vs-card-lift"
                } ${
                  revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                }`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white text-xs font-bold shadow-md">
                      <Star className="size-3.5" fill="currentColor" />
                      Le plus populaire
                    </div>
                  </div>
                )}

                <div className="p-8">
                  {/* Plan name */}
                  <h3
                    className="font-display text-xl font-semibold mb-2 text-[#111827]"
                  >
                    {plan.name}
                  </h3>
                  <p className="text-sm mb-6 text-[#6B7280]">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-2">
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-5xl font-bold vs-stat-number text-[#111827]">
                        {formatPrice(price)}
                      </span>
                      <span className="text-sm font-medium text-[#6B7280]">
                        FCFA/mois
                      </span>
                    </div>
                    {annual && (
                      <p className="text-xs mt-1 text-[#2ebd5a] font-semibold">
                        Économie de {formatPrice(plan.monthlyPrice * 12 * 0.3)} FCFA/an
                      </p>
                    )}
                    <p className="text-xs mt-1 text-[#9CA3AF]">
                      Soit ~{Math.round(price / 30).toLocaleString("fr-FR")} FCFA/jour
                    </p>
                  </div>

                  {/* CTA */}
                  <Link
                    href={plan.href}
                    className={`mt-6 block w-full text-center h-12 leading-[3rem] rounded-lg font-semibold transition-all hover:scale-[1.02] ${
                      plan.popular
                        ? "bg-gradient-to-r from-[#0f4382] to-[#0a3060] text-white shadow-lg vs-cta-pulse"
                        : "bg-white border-2 text-white"
                    }`}
                    style={!plan.popular ? { borderColor: plan.accentColor, color: plan.accentColor } : {}}
                  >
                    {plan.cta}
                  </Link>

                  {/* Features */}
                  <ul className="mt-8 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <div
                          className="mt-0.5 size-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${plan.accentColor}20` }}
                        >
                          <Check
                            className="size-3.5"
                            style={{ color: plan.accentColor }}
                            strokeWidth={3}
                          />
                        </div>
                        <span className="text-[#374151]">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom link */}
        <div className="mt-12 text-center">
          <Link
            href="/contact"
            className="vs-link-arrow text-sm font-semibold text-[#0f4382]"
          >
            Besoin d&apos;une formule sur mesure ? Parlons-en
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

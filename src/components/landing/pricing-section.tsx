"use client";

import Link from "next/link";
import { Check, Star, ArrowRight } from "lucide-react";
import { useReveal } from "@/lib/use-animations";

const plans = [
  {
    name: "Starter",
    price: "10 000",
    currency: "FCFA/mois",
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
    bg: "bg-white",
    textColor: "text-[#111827]",
    borderColor: "border-[#E5E7EB]",
    buttonStyle:
      "bg-white border-2 border-[#2563EB] text-[#2563EB] hover:bg-[#DBEAFE]",
  },
  {
    name: "Pro",
    price: "25 000",
    currency: "FCFA/mois",
    description: "Pour les PME en croissance",
    features: [
      "Jusqu'à 50 produits",
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
    bg: "bg-[#2563EB]",
    textColor: "text-white",
    borderColor: "border-[#2563EB]",
    buttonStyle: "bg-white text-[#2563EB] hover:bg-blue-50 font-semibold shadow-lg",
  },
  {
    name: "Business",
    price: "75 000",
    currency: "FCFA/mois",
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
    bg: "bg-white",
    textColor: "text-[#111827]",
    borderColor: "border-[#E5E7EB]",
    buttonStyle:
      "bg-white border-2 border-[#10B981] text-[#10B981] hover:bg-[#D1FAE5]",
  },
];

export function PricingSection() {
  const { ref, revealed } = useReveal({ threshold: 0.1, once: true });

  return (
    <section id="pricing" className="py-24 bg-[#F9FAFB]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-[#DBEAFE] text-[#2563EB] text-xs font-semibold uppercase tracking-wide mb-4">
            Tarifs
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#111827] leading-tight">
            Des formules adaptées à votre entreprise
          </h2>
          <p className="mt-4 text-lg text-[#4B5563]">
            Aucun engagement, annulation à tout moment. Économisez 30% avec le paiement annuel.
          </p>
        </div>

        {/* Pricing cards */}
        <div ref={ref} className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`relative ${plan.bg} ${plan.textColor} rounded-2xl border-2 ${
                plan.borderColor
              } ${plan.popular ? "vs-card-shadow-lg md:-mt-4 md:mb-4" : "vs-card-shadow"} transition-all duration-500 hover:-translate-y-1 ${
                revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-[#F59E0B] text-white text-xs font-bold shadow-md">
                    <Star className="size-3.5" fill="currentColor" />
                    Le plus populaire
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan name */}
                <h3
                  className={`font-display text-xl font-semibold mb-2 ${
                    plan.popular ? "text-white" : "text-[#111827]"
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm mb-6 ${
                    plan.popular ? "text-blue-100" : "text-[#6B7280]"
                  }`}
                >
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`font-mono text-4xl font-bold ${
                        plan.popular ? "text-white" : "text-[#111827]"
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        plan.popular ? "text-blue-100" : "text-[#6B7280]"
                      }`}
                    >
                      {plan.currency}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      plan.popular ? "text-blue-200" : "text-[#9CA3AF]"
                    }`}
                  >
                    Soit ~{(parseInt(plan.price.replace(/\s/g, "")) / 30).toFixed(0)} FCFA/jour
                  </p>
                </div>

                {/* CTA */}
                <Link
                  href={plan.href}
                  className={`block w-full text-center h-12 leading-[3rem] rounded-lg font-semibold transition-all hover:scale-[1.02] ${plan.buttonStyle}`}
                >
                  {plan.cta}
                </Link>

                {/* Features */}
                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <div
                        className={`mt-0.5 size-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          plan.popular ? "bg-white/20" : "bg-[#D1FAE5]"
                        }`}
                      >
                        <Check
                          className={`size-3.5 ${
                            plan.popular ? "text-white" : "text-[#10B981]"
                          }`}
                          strokeWidth={3}
                        />
                      </div>
                      <span
                        className={
                          plan.popular ? "text-blue-50" : "text-[#374151]"
                        }
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Annual savings note */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D1FAE5] text-[#047857] text-sm font-medium">
            <Check className="size-4" strokeWidth={3} />
            Économisez 30% avec le paiement annuel — Contactez-nous pour un devis
          </div>
        </div>

        {/* Bottom link */}
        <div className="mt-8 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:gap-2.5 transition-all"
          >
            Besoin d&apos;une formule sur mesure ? Parlons-en
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

"use client";

import { Star, Quote } from "lucide-react";
import { useReveal } from "@/lib/use-animations";

const testimonials = [
  {
    name: "Marième Diop",
    company: "Jus de Bissap Sénégal",
    role: "Fondatrice",
    rating: 5,
    testimonial:
      "Grâce à VerifScan, nos ventes ont augmenté de 35% en 3 mois ! Nos clients scannent le QR code et ont immédiatement confiance. C'est un vrai game-changer pour les petits producteurs comme nous.",
    initials: "MD",
    color: "#2563EB",
    bg: "#DBEAFE",
  },
  {
    name: "Ibrahima Ndiaye",
    company: "Téranga Foods",
    role: "Directeur Général",
    rating: 5,
    testimonial:
      "Nous exportons maintenant vers 4 pays de la CEDEAO sans aucune difficulté douanière. Les documents générés par VerifScan sont acceptés partout. Un outil indispensable pour tout agro-industriel sérieux.",
    initials: "IN",
    color: "#10B981",
    bg: "#D1FAE5",
  },
  {
    name: "Awa Sow",
    company: "BioAfrica Cosmetics",
    role: "Responsable Qualité",
    rating: 5,
    testimonial:
      "La traçabilité de nos produits cosmétiques était un cauchemar. Avec VerifScan, tout est centralisé et nos clients adorent pouvoir vérifier l'origine des ingrédients. Le support est en plus très réactif.",
    initials: "AS",
    color: "#F59E0B",
    bg: "#FEF3C7",
  },
];

export function TestimonialsSection() {
  const { ref, revealed } = useReveal({ threshold: 0.15, once: true });

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-[#FEF3C7] text-[#F59E0B] text-xs font-semibold uppercase tracking-wide mb-4">
            Témoignages
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#111827] leading-tight">
            Ce que disent nos fabricants
          </h2>
          <p className="mt-4 text-lg text-[#4B5563]">
            Plus de 250 entreprises nous font confiance pour authentifier leurs produits.
          </p>
        </div>

        {/* Grid */}
        <div ref={ref} className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`relative bg-white rounded-2xl border border-[#E5E7EB] p-6 vs-card-shadow transition-all duration-500 hover:-translate-y-1 hover:vs-card-shadow-hover ${
                revealed ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
              }`}
              style={{
                transitionDelay: `${i * 150}ms`,
                borderLeft: `4px solid ${t.color}`,
              }}
            >
              {/* Quote icon */}
              <Quote
                className="size-8 mb-4 opacity-20"
                style={{ color: t.color }}
                fill="currentColor"
              />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <Star
                    key={idx}
                    className="size-5 text-[#F59E0B]"
                    fill="currentColor"
                  />
                ))}
              </div>

              {/* Testimonial */}
              <p className="text-[#374151] leading-relaxed mb-6 italic">
                &ldquo;{t.testimonial}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-[#E5E7EB]">
                <div
                  className="size-12 rounded-full flex items-center justify-center font-display font-bold text-white"
                  style={{ backgroundColor: t.color }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="font-semibold text-[#111827]">{t.name}</div>
                  <div className="text-sm text-[#6B7280]">
                    {t.role} · {t.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges row */}
        <div className="mt-16 pt-10 border-t border-[#E5E7EB]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="font-mono text-3xl font-bold text-[#2563EB]">250+</div>
              <div className="text-sm text-[#6B7280] mt-1">Fabricants actifs</div>
            </div>
            <div>
              <div className="font-mono text-3xl font-bold text-[#10B981]">4.9/5</div>
              <div className="text-sm text-[#6B7280] mt-1">Note moyenne</div>
            </div>
            <div>
              <div className="font-mono text-3xl font-bold text-[#F59E0B]">12 458</div>
              <div className="text-sm text-[#6B7280] mt-1">Scans / semaine</div>
            </div>
            <div>
              <div className="font-mono text-3xl font-bold text-[#2563EB]">4 pays</div>
              <div className="text-sm text-[#6B7280] mt-1">CEDEAO couverts</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

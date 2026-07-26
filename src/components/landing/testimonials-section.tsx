"use client";

import { useState, useRef } from "react";
import { Star, Quote, ChevronLeft, ChevronRight, MessageSquareQuote } from "lucide-react";
import { useReveal } from "@/lib/use-animations";

const testimonials = [
  {
    name: "Marième Diop",
    company: "Jus de Bissap Sénégal",
    role: "Fondatrice",
    rating: 5,
    testimonial:
      "Grâce à VerifScan, nos ventes ont augmenté de 35% en 3 mois ! Nos clients scannent le QR code et ont immédiatement confiance. C'est un vrai game-changer pour les petits producteurs comme nous.",
    photo: "👩🏾‍🦱",
    color: "#2563EB",
    bg: "#DBEAFE",
    metric: "+35% de ventes en 3 mois",
  },
  {
    name: "Ibrahima Ndiaye",
    company: "Téranga Foods",
    role: "Directeur Général",
    rating: 5,
    testimonial:
      "Nous exportons maintenant vers 4 pays de la CEDEAO sans aucune difficulté douanière. Les documents générés par VerifScan sont acceptés partout. Un outil indispensable pour tout agro-industriel sérieux.",
    photo: "👨🏾",
    color: "#10B981",
    bg: "#D1FAE5",
    metric: "4 pays CEDEAO couverts",
  },
  {
    name: "Awa Sow",
    company: "BioAfrica Cosmetics",
    role: "Responsable Qualité",
    rating: 5,
    testimonial:
      "La traçabilité de nos produits cosmétiques était un cauchemar. Avec VerifScan, tout est centralisé et nos clients adorent pouvoir vérifier l'origine des ingrédients. Le support est en plus très réactif.",
    photo: "👩🏾",
    color: "#F59E0B",
    bg: "#FEF3C7",
    metric: "Traçabilité 100% centralisée",
  },
  {
    name: "Cheikh Fall",
    company: "Sarine Bio",
    role: "CEO",
    rating: 5,
    testimonial:
      "VerifScan nous a permis de différencier nos produits bio des contrefaçons. Depuis que nous apposons le QR code VerifScan, plus aucun retour pour doute sur l'authenticité. Indispensable.",
    photo: "🧑🏾",
    color: "#047857",
    bg: "#D1FAE5",
    metric: "0 retour pour contrefaçon",
  },
  {
    name: "Fatou Mbaye",
    company: "Dakar Foods",
    role: "Directrice Marketing",
    rating: 5,
    testimonial:
      "Les statistiques de scans nous ont révélé des marchés insoupçonnés à Saint-Louis. Nous y avons ouvert un point de vente qui représente déjà 12% de notre chiffre d'affaires.",
    photo: "👩🏾‍💼",
    color: "#1D4ED8",
    bg: "#DBEAFE",
    metric: "12% CA sur nouveau marché",
  },
  {
    name: "Moussa Camara",
    company: "Bissap Premium",
    role: "Fondateur",
    rating: 5,
    testimonial:
      "La fonction rappel de lot m'a sauvé la mise. J'ai pu identifier précisément les lots affectés et contacter les distributeurs en moins d'une heure. Avant, c'était impossible.",
    photo: "👨🏾‍💼",
    color: "#D97706",
    bg: "#FEF3C7",
    metric: "Rappel en < 1h vs jours avant",
  },
];

export function TestimonialsSection() {
  const { ref, revealed } = useReveal({ threshold: 0.15, once: true });
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const scrollBy = (dir: 1 | -1) => {
    if (!carouselRef.current) return;
    const card = carouselRef.current.querySelector("[data-testimonial]");
    if (!card) return;
    const cardWidth = (card as HTMLElement).offsetWidth + 32; // +gap
    carouselRef.current.scrollBy({ left: dir * cardWidth, behavior: "smooth" });
    setActiveIdx((prev) => {
      const next = prev + dir;
      if (next < 0) return testimonials.length - 1;
      if (next >= testimonials.length) return 0;
      return next;
    });
  };

  return (
    <section className="py-24 vs-section-soft">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FEF3C7] text-[#F59E0B] text-xs font-semibold uppercase tracking-wide mb-4">
            <MessageSquareQuote className="size-3.5" />
            Témoignages
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#111827] leading-tight">
            Plus de <span className="vs-gradient-text">250 entreprises</span> nous font confiance
          </h2>
          <p className="mt-4 text-lg text-[#4B5563]">
            Des fabricants agro-alimentaires qui transforment la traçabilité en croissance.
          </p>
        </div>

        {/* Carousel */}
        <div ref={ref} className="relative">
          {/* Carousel viewport */}
          <div
            ref={carouselRef}
            className="vs-carousel flex gap-8 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4"
          >
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                data-testimonial
                className={`snap-center shrink-0 w-[85%] sm:w-[60%] lg:w-[31%] relative bg-white rounded-3xl border border-[#E5E7EB] p-8 vs-card-shadow vs-card-lift transition-all duration-500 ${
                  revealed ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
                }`}
                style={{
                  transitionDelay: `${(i % 3) * 150}ms`,
                  borderLeft: `6px solid ${t.color}`,
                }}
              >
                {/* Decorative quote mark */}
                <div className="vs-quote-mark absolute top-4 right-6 select-none">
                  &ldquo;
                </div>

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, idx) => (
                    <Star
                      key={idx}
                      className="size-5 text-[#F59E0B] vs-star-pop"
                      fill="currentColor"
                      style={{ animationDelay: `${idx * 60}ms` }}
                    />
                  ))}
                </div>

                {/* Testimonial */}
                <p className="text-[#374151] leading-relaxed mb-6 italic">
                  &ldquo;{t.testimonial}&rdquo;
                </p>

                {/* Metric badge */}
                <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: t.bg, color: t.color }}
                >
                  📈 {t.metric}
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-[#E5E7EB]">
                  {/* Photo (emoji avatar in colored circle) */}
                  <div
                    className="size-12 rounded-full flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: t.bg }}
                  >
                    {t.photo}
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

          {/* Carousel nav arrows */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => scrollBy(-1)}
              className="size-11 rounded-full bg-white border border-[#E5E7EB] shadow-sm hover:bg-gray-50 hover:border-[#2563EB]/40 flex items-center justify-center transition-all"
              aria-label="Témoignage précédent"
            >
              <ChevronLeft className="size-5 text-[#374151]" />
            </button>
            {/* Dots indicator */}
            <div className="flex items-center gap-1.5">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (!carouselRef.current) return;
                    const card = carouselRef.current.querySelector("[data-testimonial]") as HTMLElement;
                    if (!card) return;
                    const cardWidth = card.offsetWidth + 32;
                    carouselRef.current.scrollTo({ left: i * cardWidth, behavior: "smooth" });
                    setActiveIdx(i);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    activeIdx === i
                      ? "w-6 bg-[#2563EB]"
                      : "w-2 bg-[#D1D5DB] hover:bg-[#9CA3AF]"
                  }`}
                  aria-label={`Aller au témoignage ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => scrollBy(1)}
              className="size-11 rounded-full bg-white border border-[#E5E7EB] shadow-sm hover:bg-gray-50 hover:border-[#2563EB]/40 flex items-center justify-center transition-all"
              aria-label="Témoignage suivant"
            >
              <ChevronRight className="size-5 text-[#374151]" />
            </button>
          </div>
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

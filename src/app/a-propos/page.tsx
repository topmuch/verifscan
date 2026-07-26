"use client";

import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Target,
  Eye,
  Heart,
  Users,
  Globe2,
  Leaf,
  Sparkles,
  ArrowRight,
  Award,
  Lock,
  TrendingUp,
} from "lucide-react";
import { FeaturedMarquee } from "@/components/featured-marquee";

const BLUE = "#0f4382";
const BLUE_DARK = "#0a3060";
const BLUE_LIGHT = "#E6EEF7";
const GREEN = "#2ebd5a";
const GREEN_DARK = "#1f8a42";
const GREEN_LIGHT = "#E0F5E6";
const ORANGE = "#F59E0B";

export default function AProposPage() {
  return (
    <PublicShell>
      {/* ============ HERO ============ */}
      <section className="vs-gradient-hero border-b border-emerald-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <Sparkles className="size-3 mr-1" />
            À propos de VerifScan
          </Badge>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Nous rendons la traçabilité alimentaire{" "}
            <span className="vs-gradient-text">accessible et transparente</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            VerifScan est né d&apos;un constat simple : en Afrique de l&apos;Ouest, des milliers de
            fabricants produisent des produits de qualité, mais souffrent d&apos;un déficit de
            visibilité et de confiance. Notre mission est de combler ce fossé grâce à la technologie
            du QR code et de la blockchain.
          </p>
        </div>
      </section>

      {/* ============ MISSION / VISION / VALEURS ============ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Mission */}
          <div
            className="rounded-3xl p-8 border-2 shadow-sm"
            style={{
              borderColor: `${BLUE}33`,
              background: `linear-gradient(135deg, ${BLUE_LIGHT} 0%, #FFFFFF 100%)`,
            }}
          >
            <div
              className="size-12 rounded-2xl flex items-center justify-center shadow-md mb-5"
              style={{ backgroundColor: BLUE }}
            >
              <Target className="size-6 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-3" style={{ color: BLUE }}>
              Notre mission
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Doter chaque produit alimentaire africain d&apos;un passeport numérique infalsifiable,
              accessible en un scan, qui protège les marques, rassure les consommateurs et facilite
              l&apos;export. Nous voulons que la traçabilité ne soit plus un luxe réservé aux
              multinationales, mais un outil au service de tous les producteurs locaux.
            </p>
          </div>

          {/* Vision */}
          <div
            className="rounded-3xl p-8 border-2 shadow-sm"
            style={{
              borderColor: `${GREEN}33`,
              background: `linear-gradient(135deg, ${GREEN_LIGHT} 0%, #FFFFFF 100%)`,
            }}
          >
            <div
              className="size-12 rounded-2xl flex items-center justify-center shadow-md mb-5"
              style={{ backgroundColor: GREEN }}
            >
              <Eye className="size-6 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-3" style={{ color: GREEN_DARK }}>
              Notre vision
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Construire un écosystème de confiance où chaque acteur — fabricant, distributeur,
              consommateur, autorité — accède en temps réel à la vérité d&apos;un produit. À
              horizon 2030, nous visons 100 000 produits tracés et 10 millions de consommateurs
              équipés implicitement, de Dakar à Abidjan, de Bamako à Cotonou.
            </p>
          </div>

          {/* Valeurs */}
          <div
            className="rounded-3xl p-8 border-2 shadow-sm"
            style={{
              borderColor: `${ORANGE}33`,
              background: `linear-gradient(135deg, #FEF3C7 0%, #FFFFFF 100%)`,
            }}
          >
            <div
              className="size-12 rounded-2xl flex items-center justify-center shadow-md mb-5"
              style={{ backgroundColor: ORANGE }}
            >
              <Heart className="size-6 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-3" style={{ color: "#92400E" }}>
              Nos valeurs
            </h2>
            <ul className="text-sm text-gray-700 space-y-1.5 leading-relaxed">
              <li>• Transparence radicale</li>
              <li>• Souveraineté technologique africaine</li>
              <li>• Impact socio-économique mesurable</li>
              <li>• Inclusion des petits producteurs</li>
              <li>• Excellence technique et design</li>
              <li>• Confidentialité et sécurité par défaut</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============ HISTOIRE ============ */}
      <section className="bg-white border-y border-gray-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
              Notre histoire
            </Badge>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight">
              D&apos;une idée sénégalaise à un standard ouest-africain
            </h2>
          </div>

          <div className="space-y-8 relative before:absolute before:left-4 sm:before:left-1/2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-[#0f4382] before:to-[#2ebd5a]">
            {[
              {
                year: "2024",
                title: "Le constat",
                desc: "Constatant l&apos;absence d&apos;outil de traçabilité abordable pour les PME agroalimentaires sénégalaises, une équipe pluridisciplinaire se réunit autour d&apos;une idée : utiliser le QR code, déjà ubiquitaire, comme vecteur de confiance.",
              },
              {
                year: "2025",
                title: "Le MVP",
                desc: "Première version de VerifScan déployée à Dakar avec 5 fabricants pilotes. Les premiers scans démontrent l&apos;appétit des consommateurs pour la transparence. La blockchain est intégrée pour rendre les lots infalsifiables.",
              },
              {
                year: "2026",
                title: "L&apos;expansion",
                desc: "VerifScan s&apos;étend au Mali, à la Côte d&apos;Ivoire et au Bénin. Module B2B, marketplace et IA prédictive lancés. Plus de 100 000 scans enregistrés sur la plateforme.",
              },
              {
                year: "2027+",
                title: "L&apos;ambition",
                desc: "Devenir le standard de traçabilité alimentaire de la CEDEAO, intégrer les chaînes d&apos;export vers l&apos;UE et le Moyen-Orient, et étendre le modèle à la pharmacie et aux cosmétiques.",
              },
            ].map((step, i) => (
              <div
                key={i}
                className={`relative pl-12 sm:pl-0 sm:grid sm:grid-cols-2 sm:gap-8 sm:items-center ${
                  i % 2 === 0 ? "" : "sm:[&>*:first-child]:order-2"
                }`}
              >
                <div
                  className={`sm:text-right ${i % 2 === 0 ? "" : "sm:text-left"}`}
                >
                  <div
                    className="inline-flex items-center px-4 py-1.5 rounded-full text-white text-sm font-bold shadow-md mb-2"
                    style={{ backgroundColor: i % 2 === 0 ? BLUE : GREEN }}
                  >
                    {step.year}
                  </div>
                  <h3 className="font-display text-xl font-bold text-gray-900">{step.title}</h3>
                </div>
                <div
                  className="absolute left-0 sm:left-1/2 top-1 size-8 rounded-full -translate-x-0 sm:-translate-x-1/2 flex items-center justify-center border-4 border-white shadow-md"
                  style={{ backgroundColor: i % 2 === 0 ? BLUE : GREEN }}
                >
                  <span className="size-2 rounded-full bg-white" />
                </div>
                <div className="sm:col-span-1 mt-2 sm:mt-0">
                  <p
                    className="text-sm text-gray-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: step.desc }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ MARQUEE PRODUITS ============ */}
      <FeaturedMarquee
        title="Notre impact en chiffres"
        subtitle="Les produits qui font la démonstration de notre savoir-faire"
        speed="slow"
        hideHeading={false}
      />

      {/* ============ STATISTIQUES ============ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { value: "100K+", label: "Scans cumulés sur la plateforme", icon: TrendingUp, color: BLUE },
            { value: "500+", label: "Fabricants actifs en Afrique de l&apos;Ouest", icon: Users, color: GREEN_DARK },
            { value: "5", label: "Pays couverts (Sénégal, Mali, CI, Bénin, Togo)", icon: Globe2, color: ORANGE },
            { value: "99,9%", label: "Disponibilité de l&apos;API de vérification", icon: Lock, color: BLUE_DARK },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="rounded-2xl p-6 text-center bg-white border border-gray-200 shadow-sm"
              >
                <Icon className="mx-auto size-7 mb-3" style={{ color: s.color }} />
                <p className="font-display text-3xl font-bold" style={{ color: s.color }}>
                  {s.value.replace(/&apos;/g, "'")}
                </p>
                <p
                  className="mt-1 text-xs text-gray-600 leading-tight"
                  dangerouslySetInnerHTML={{ __html: s.label }}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ ÉQUIPE ============ */}
      <section
        className="border-y"
        style={{
          background: `linear-gradient(135deg, ${BLUE_LIGHT} 0%, ${GREEN_LIGHT} 100%)`,
          borderColor: `${BLUE}22`,
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="secondary" className="bg-white text-blue-700 border-blue-200">
              <Users className="size-3 mr-1" />
              L&apos;équipe
            </Badge>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Une équipe pluridisciplinaire au service de l&apos;impact
            </h2>
            <p className="mt-3 text-gray-600">
              Ingénieurs, agronomes, designers et experts en commerce international réunis par une
              vision commune : faire émerger un standard africain de la confiance alimentaire.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Aminata Diop", role: "CEO & Co-fondatrice", color: BLUE, initials: "AD" },
              { name: "Mamadou Sow", role: "CTO & Co-fondateur", color: GREEN_DARK, initials: "MS" },
              { name: "Fatou Ndiaye", role: "Head of Product", color: ORANGE, initials: "FN" },
              { name: "Ibrahima Fall", role: "Head of Operations", color: BLUE_DARK, initials: "IF" },
            ].map((member, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm text-center"
              >
                <div
                  className="mx-auto size-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md mb-4"
                  style={{ backgroundColor: member.color }}
                >
                  {member.initials}
                </div>
                <h3 className="font-bold text-gray-900">{member.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ENGAGEMENTS ============ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <Leaf className="size-3 mr-1" />
            Nos engagements
          </Badge>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Au-delà de la technologie, un impact concret
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: Leaf,
              title: "Souveraineté alimentaire",
              desc: "Nous soutenons les producteurs locaux en valorisant leur savoir-faire et en leur donnant les outils pour rivaliser avec les importations.",
            },
            {
              icon: Award,
              title: "Qualité et sécurité",
              desc: "Chaque produit tracé est soumis à un référentiel strict. Les anomalies détectées par notre IA sont signalées et résolues rapidement.",
            },
            {
              icon: Globe2,
              title: "Impact environnemental",
              desc: "En luttant contre la contrefaçon, nous réduisons les gaspillages et orientons les consommateurs vers des choix responsables.",
            },
          ].map((e, i) => {
            const Icon = e.icon;
            return (
              <div
                key={i}
                className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm"
              >
                <div
                  className="size-12 rounded-xl flex items-center justify-center shadow-md mb-4"
                  style={{ backgroundColor: BLUE }}
                >
                  <Icon className="size-6 text-white" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{e.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{e.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-20">
        <div
          className="rounded-3xl p-10 sm:p-14 text-center text-white shadow-2xl"
          style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${GREEN} 100%)` }}
        >
          <ShieldCheck className="mx-auto size-12 mb-4 opacity-90" />
          <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
            Rejoignez l&apos;aventure VerifScan
          </h2>
          <p className="mt-3 text-white/90 max-w-xl mx-auto">
            Que vous soyez fabricant, distributeur ou simplement curieux, il y a une place pour vous
            dans notre écosystème.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/devenir-partenaire"
              className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-white text-sm font-semibold shadow-lg transition-all hover:scale-[1.02]"
              style={{ color: BLUE }}
            >
              Devenir partenaire
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-white/10 text-white text-sm font-semibold border-2 border-white/30 transition-all hover:bg-white/20"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

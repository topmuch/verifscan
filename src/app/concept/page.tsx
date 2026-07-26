"use client";

import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  QrCode,
  Smartphone,
  Lock,
  BarChart3,
  Globe2,
  Leaf,
  Factory,
  Truck,
  Store,
  AlertTriangle,
  TrendingUp,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Boxes,
} from "lucide-react";
import { FeaturedMarquee } from "@/components/featured-marquee";

const BLUE = "#0f4382";
const BLUE_DARK = "#0a3060";
const BLUE_LIGHT = "#E6EEF7";
const GREEN = "#2ebd5a";
const GREEN_DARK = "#1f8a42";
const GREEN_LIGHT = "#E0F5E6";
const ORANGE = "#F59E0B";
const ORANGE_LIGHT = "#FEF3C7";

export default function ConceptPage() {
  return (
    <PublicShell>
      {/* ============ HERO ============ */}
      <section className="vs-gradient-hero border-b border-emerald-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <Sparkles className="size-3 mr-1" />
            Le concept VerifScan
          </Badge>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            La traçabilité alimentaire{" "}
            <span className="vs-gradient-text">au service de la confiance</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            VerifScan est un passeport numérique pour vos produits. En un simple scan de QR code,
            le consommateur accède à toute l&apos;histoire du produit — de la matière première
            jusqu&apos;à l&apos;emballage — et le fabricant protège sa marque contre la contrefaçon.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl text-white text-sm font-semibold shadow-lg transition-all hover:scale-[1.02]"
              style={{ backgroundColor: BLUE }}
            >
              Démarrer l&apos;essai gratuit
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/produits"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-white text-sm font-semibold border-2 transition-all hover:bg-gray-50"
              style={{ color: BLUE, borderColor: `${BLUE}33` }}
            >
              Voir les produits vérifiés
            </Link>
          </div>
        </div>
      </section>

      {/* ============ LE PROBLÈME / LA SOLUTION ============ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-stretch">
          {/* Le problème */}
          <div className="rounded-3xl p-8 border-2 border-red-200 bg-gradient-to-br from-red-50 to-white">
            <div className="flex items-center gap-3 mb-5">
              <div className="size-11 rounded-2xl bg-red-500 flex items-center justify-center shadow-md">
                <AlertTriangle className="size-6 text-white" />
              </div>
              <h2 className="font-display text-2xl font-bold text-red-900">
                Le problème aujourd&apos;hui
              </h2>
            </div>
            <ul className="space-y-3">
              {[
                "Contrefaçon : des produits imités circulent sur les marchés, sans contrôle sur leur composition.",
                "Opacité : le consommateur ne connaît ni l&apos;origine, ni la fraîcheur, ni le trajet du produit.",
                "Rappels inefficaces : en cas de problème sanitaire, identifier et prévenir les acheteurs est quasi impossible.",
                "Perte de confiance : sans visibilité, les marques locales pâtissent d&apos;un déficit de crédibilité.",
                "Conformité complexe : les exportations exigent une documentation traçable que peu d&apos;artisans peuvent produire.",
              ].map((p, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-red-900 leading-relaxed">
                  <span className="flex-shrink-0 mt-0.5 size-5 rounded-full bg-red-200 text-red-800 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: p }} />
                </li>
              ))}
            </ul>
          </div>

          {/* La solution */}
          <div
            className="rounded-3xl p-8 border-2 shadow-lg"
            style={{
              borderColor: GREEN,
              background: `linear-gradient(135deg, ${GREEN_LIGHT} 0%, #FFFFFF 100%)`,
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="size-11 rounded-2xl flex items-center justify-center shadow-md"
                style={{ backgroundColor: GREEN }}
              >
                <ShieldCheck className="size-6 text-white" />
              </div>
              <h2 className="font-display text-2xl font-bold" style={{ color: GREEN_DARK }}>
                La solution VerifScan
              </h2>
            </div>
            <ul className="space-y-3">
              {[
                "QR code unique par lot, infalsifiable, lié à un identifiant blockchain.",
                "Page produit officielle avec photo, composition, certifications et dates de péremption.",
                "Alertes automatiques en cas de rappel, de péremption proche ou d&apos;anomalie détectée.",
                "Statistiques de scans en temps réel : qui, où, quand — pour piloter votre marché.",
                "Documentation export conforme aux exigences internationales (UE, FDA, CEDEAO).",
              ].map((p, i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: "#166534" }}>
                  <CheckCircle2 className="flex-shrink-0 mt-0.5 size-5" style={{ color: GREEN }} />
                  <span dangerouslySetInnerHTML={{ __html: p }} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============ COMMENT ÇA MARCHE ============ */}
      <section className="bg-white border-y border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
              <QrCode className="size-3 mr-1" />
              Comment ça marche
            </Badge>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight">
              De la chaîne de production au consommateur final
            </h2>
            <p className="mt-3 text-gray-600">
              Cinq étapes simples qui transforment chaque produit en actif numérique traçable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                icon: Factory,
                title: "1. Production",
                desc: "Le fabricant crée son produit et son lot dans VerifScan avec ingrédients et dates.",
                color: BLUE,
                bg: BLUE_LIGHT,
              },
              {
                icon: QrCode,
                title: "2. QR code",
                desc: "Un QR code unique est généré et imprimé sur l&apos;emballage du produit.",
                color: GREEN_DARK,
                bg: GREEN_LIGHT,
              },
              {
                icon: Truck,
                title: "3. Distribution",
                desc: "Le produit part en distribution. Chaque étape peut être documentée.",
                color: "#92400E",
                bg: ORANGE_LIGHT,
              },
              {
                icon: Smartphone,
                title: "4. Scan",
                desc: "Le consommateur scanne le QR code avec son téléphone avant l&apos;achat.",
                color: BLUE_DARK,
                bg: BLUE_LIGHT,
              },
              {
                icon: ShieldCheck,
                title: "5. Vérification",
                desc: "La page officielle s&apos;affiche avec toutes les infos : authenticité garantie.",
                color: GREEN_DARK,
                bg: GREEN_LIGHT,
              },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl p-6 text-center shadow-sm border transition-all hover:-translate-y-1 hover:shadow-lg"
                  style={{ background: step.bg, borderColor: `${step.color}33` }}
                >
                  <div
                    className="mx-auto size-14 rounded-2xl flex items-center justify-center shadow-md mb-4"
                    style={{ backgroundColor: step.color }}
                  >
                    <Icon className="size-7 text-white" />
                  </div>
                  <h3 className="font-bold text-base mb-1.5" style={{ color: step.color }}>
                    {step.title.replace(/&apos;/g, "'")}
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: step.color }}
                    dangerouslySetInnerHTML={{ __html: step.desc }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ MARQUEE PRODUITS ============ */}
      <FeaturedMarquee
        title="Ils sont déjà sur VerifScan"
        subtitle="Découvrez les produits authentiques tracés via notre plateforme"
        speed="slow"
      />

      {/* ============ AVANTAGES POUR LE FABRICANT ============ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <TrendingUp className="size-3 mr-1" />
            Pour les fabricants
          </Badge>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Les avantages pour votre entreprise
          </h2>
          <p className="mt-3 text-gray-600">
            VerifScan n&apos;est pas qu&apos;un outil de traçabilité — c&apos;est un levier de
            croissance pour les marques alimentaires africaines.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: ShieldCheck,
              title: "Protection de la marque",
              desc: "Chaque produit est lié à un identifiant unique infalsifiable. Les contrefaçons sont immédiatement détectées par les consommateurs lors du scan.",
              color: BLUE,
            },
            {
              icon: BarChart3,
              title: "Données de marché en temps réel",
              desc: "Suivez le nombre de scans, la géolocalisation des acheteurs et les pics de consommation. Identifiez vos régions les plus dynamiques.",
              color: GREEN_DARK,
            },
            {
              icon: AlertTriangle,
              title: "Rappels ciblés et instantanés",
              desc: "En cas de défaut produit, marquez un lot comme rappelé. Tous les futurs scans afficheront l&apos;alerte — fini les rappels aveugles.",
              color: "#DC2626",
            },
            {
              icon: FileCheck,
              title: "Conformité export simplifiée",
              desc: "Générez en un clic la documentation requise pour les marchés internationaux : UE, FDA, CEDEAO. Gagnez des semaines de travail administratif.",
              color: "#7C3AED",
            },
            {
              icon: Users,
              title: "Confiance et fidélisation",
              desc: "Vos clients accèdent à une fiche produit officielle avec certifications et avis. La transparence construit la préférence de marque.",
              color: ORANGE,
            },
            {
              icon: Globe2,
              title: "Visibilité internationale",
              desc: "Vos produits apparaissent dans le répertoire public VerifScan. Distributeurs et importateurs peuvent vous découvrir facilement.",
              color: BLUE_DARK,
            },
          ].map((adv, i) => {
            const Icon = adv.icon;
            return (
              <div
                key={i}
                className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className="size-12 rounded-xl flex items-center justify-center shadow-md mb-4"
                  style={{ backgroundColor: adv.color }}
                >
                  <Icon className="size-6 text-white" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{adv.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{adv.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ AVANTAGES POUR LE CONSOMMATEUR ============ */}
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
              <Smartphone className="size-3 mr-1" />
              Pour les consommateurs
            </Badge>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Le pouvoir de savoir en un scan
            </h2>
            <p className="mt-3 text-gray-600">
              Le consommateur n&apos;a rien à installer — il scanne, il sait.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: ShieldCheck,
                title: "Authenticité garantie",
                desc: "Vérifiez en 0,3 seconde que le produit est authentique et non contrefait.",
              },
              {
                icon: Leaf,
                title: "Composition transparente",
                desc: "Ingrédients, allergènes, certifications bio — tout est affiché clairement.",
              },
              {
                icon: AlertTriangle,
                title: "Alertes de sécurité",
                desc: "Soyez prévenu en temps réel si le lot est rappelé ou proche de péremption.",
              },
              {
                icon: Globe2,
                title: "Origine et trajet",
                desc: "Découvrez où le produit a été fabriqué, transformé et dans quels pays il est vendu.",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm text-center"
                >
                  <div
                    className="mx-auto size-12 rounded-xl flex items-center justify-center shadow-md mb-4"
                    style={{ backgroundColor: BLUE }}
                  >
                    <Icon className="size-6 text-white" />
                  </div>
                  <h3 className="font-bold text-base text-gray-900 mb-1.5">{item.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ STATISTIQUES ============ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { value: "0,3s", label: "Temps de vérification au scan", icon: Smartphone, color: BLUE },
            { value: "100%", label: "Lots tracés individuellement", icon: Boxes, color: GREEN_DARK },
            { value: "24/7", label: "Disponibilité des informations", icon: Globe2, color: ORANGE },
            { value: "+5", label: "Pays couverts en Afrique de l&apos;Ouest", icon: Lock, color: BLUE_DARK },
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

      {/* ============ CTA FINAL ============ */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-20">
        <div
          className="rounded-3xl p-10 sm:p-14 text-center text-white shadow-2xl"
          style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${GREEN} 100%)` }}
        >
          <Store className="mx-auto size-12 mb-4 opacity-90" />
          <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
            Prêt à protéger vos produits et conquérir vos clients ?
          </h2>
          <p className="mt-3 text-white/90 max-w-xl mx-auto">
            Démarrez gratuitement. Sans carte bancaire, sans engagement, en 5 minutes.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-white text-sm font-semibold shadow-lg transition-all hover:scale-[1.02]"
              style={{ color: BLUE }}
            >
              Créer mon compte fabricant
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-white/10 text-white text-sm font-semibold border-2 border-white/30 transition-all hover:bg-white/20"
            >
              Parler à un conseiller
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

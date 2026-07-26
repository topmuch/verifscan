"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Handshake,
  Truck,
  Code2,
  Store,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Globe2,
  Users,
} from "lucide-react";

const BLUE = "#0f4382";
const BLUE_DARK = "#0a3060";
const BLUE_LIGHT = "#E6EEF7";
const GREEN = "#2ebd5a";
const GREEN_DARK = "#1f8a42";
const GREEN_LIGHT = "#E0F5E6";
const ORANGE = "#F59E0B";
const ORANGE_LIGHT = "#FEF3C7";

const partnerTypes = [
  {
    id: "distributeur",
    label: "Distributeur",
    icon: Truck,
    color: BLUE,
    bg: BLUE_LIGHT,
    short: "Diffusez VerifScan auprès de vos clients fabricants.",
    benefits: [
      "Commission de 20% sur chaque abonnement récurrent",
      "Kit marketing prêt à l&apos;emploi (plaquettes, démos)",
      "Tableau de bord partenaire dédié",
      "Accès à une équipe support dédiée (réponse < 24h)",
    ],
  },
  {
    id: "integrateur",
    label: "Intégrateur technique",
    icon: Code2,
    color: GREEN_DARK,
    bg: GREEN_LIGHT,
    short: "Implémentez VerifScan dans des systèmes existants (ERP, e-commerce).",
    benefits: [
      "Accès complet à l&apos;API REST + webhooks",
      "Bibliothèques SDK (JavaScript, Python, PHP)",
      "Sandbox de test gratuite",
      "Reversement de 30% sur chaque intégration facturée",
    ],
  },
  {
    id: "revendeur",
    label: "Revendeur blanc",
    icon: Store,
    color: "#92400E",
    bg: ORANGE_LIGHT,
    short: "Revendez VerifScan sous votre marque (white label).",
    benefits: [
      "Plateforme personnalisée à votre charte graphique",
      "Domaine personnalisé (votre-sous-domaine.com)",
      "Politique de prix libre sur votre marché",
      "Volume minimum : 50 fabricants actifs",
    ],
  },
  {
    id: "formation",
    label: "Organisme de formation",
    icon: GraduationCap,
    color: BLUE_DARK,
    bg: BLUE_LIGHT,
    short: "Formez les PME agroalimentaires à la traçabilité numérique.",
    benefits: [
      "Programme pédagogique certifiant (12h)",
      "Supports de cours et exercices pratiques",
      "Co-animaton possible par nos experts",
      "Certificat VerifScan délivré aux participants",
    ],
  },
];

export default function DevenirPartenairePage() {
  const [selectedType, setSelectedType] = useState<string>("distributeur");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Simulated submission — replace with real API endpoint when ready
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Demande envoyée ! Notre équipe partenaire vous recontacte sous 48h.");
      (e.target as HTMLFormElement).reset();
    } catch {
      toast.error("Une erreur est survenue. Réessayez ou écrivez à partenariat@verifscan.sn");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicShell>
      {/* Hero */}
      <section className="vs-gradient-hero border-b border-emerald-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <Handshake className="size-3 mr-1" />
            Devenir partenaire VerifScan
          </Badge>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Construisons ensemble la traçabilité{" "}
            <span className="vs-gradient-text">de l&apos;Afrique de l&apos;Ouest</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Vous êtes distributeur, intégrateur, revendeur ou organisme de formation ? Rejoignez
            l&apos;écosystème VerifScan et bénéficiez d&apos;un modèle économique éprouvé, d&apos;un
            support dédié et d&apos;une technologie de pointe.
          </p>
        </div>
      </section>

      {/* Pourquoi devenir partenaire */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
            <TrendingUp className="size-3 mr-1" />
            Pourquoi nous choisir
          </Badge>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Un partenariat gagnant-gagnant
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: TrendingUp, title: "Revenus récurrents", desc: "Jusqu&apos;à 30% de commission sur chaque abonnement, versée mensuellement à vie du client.", color: BLUE },
            { icon: ShieldCheck, title: "Produit fiable", desc: "Une plateforme éprouvée, sécurisée blockchain, utilisée par 500+ fabricants en Afrique de l&apos;Ouest.", color: GREEN_DARK },
            { icon: Users, title: "Support dédié", desc: "Un chef de compte partenaire, une équipe technique joignable, des formations régulières.", color: ORANGE },
            { icon: Globe2, title: "Marché en croissance", desc: "Le marché de la traçabilité africaine explose. Positionnez-vous dès maintenant.", color: BLUE_DARK },
          ].map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm">
                <div
                  className="size-12 rounded-xl flex items-center justify-center shadow-md mb-4"
                  style={{ backgroundColor: b.color }}
                >
                  <Icon className="size-6 text-white" />
                </div>
                <h3 className="font-bold text-base text-gray-900 mb-2">{b.title}</h3>
                <p
                  className="text-xs text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: b.desc }}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Types de partenariats */}
      <section className="bg-white border-y border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
              <Sparkles className="size-3 mr-1" />
              Nos programmes
            </Badge>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight">
              Choisissez le partenariat qui vous correspond
            </h2>
            <p className="mt-3 text-gray-600">
              Quatre formats adaptés à votre métier et à vos objectifs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {partnerTypes.map((p) => {
              const Icon = p.icon;
              const isActive = selectedType === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedType(p.id)}
                  className="text-left rounded-2xl p-6 border-2 transition-all hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    background: p.bg,
                    borderColor: isActive ? p.color : "transparent",
                    boxShadow: isActive ? `0 0 0 3px ${p.color}` : undefined,
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="size-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                      style={{ backgroundColor: p.color }}
                    >
                      <Icon className="size-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display text-xl font-bold" style={{ color: p.color }}>
                          {p.label}
                        </h3>
                        {isActive && <CheckCircle2 className="size-5" style={{ color: p.color }} />}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">{p.short}</p>
                      <ul className="space-y-1.5">
                        {p.benefits.map((b, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs text-gray-700"
                          >
                            <CheckCircle2
                              className="flex-shrink-0 mt-0.5 size-3.5"
                              style={{ color: p.color }}
                            />
                            <span dangerouslySetInnerHTML={{ __html: b }} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Processus */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
            Processus
          </Badge>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Comment devenir partenaire
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {[
            { n: "1", title: "Candidature", desc: "Remplissez le formulaire ci-dessous. Notre équipe vous recontacte sous 48h." },
            { n: "2", title: "Entretien", desc: "Visio de 30 min pour comprendre votre activité et valider l&apos;adéquation." },
            { n: "3", title: "Contrat", desc: "Signature du contrat de partenariat et onboarding technique (1 semaine)." },
            { n: "4", title: "Lancement", desc: "Accès au kit partenaire, formation, et démarrage de votre activité." },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 text-center bg-white border border-gray-200 shadow-sm"
            >
              <div
                className="mx-auto size-12 rounded-2xl flex items-center justify-center shadow-md mb-4 text-white font-bold text-lg"
                style={{ backgroundColor: i % 2 === 0 ? BLUE : GREEN }}
              >
                {s.n}
              </div>
              <h3 className="font-bold text-base text-gray-900 mb-1.5">{s.title}</h3>
              <p
                className="text-xs text-gray-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: s.desc }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Formulaire */}
      <section
        className="border-y"
        style={{
          background: `linear-gradient(135deg, ${BLUE_LIGHT} 0%, ${GREEN_LIGHT} 100%)`,
          borderColor: `${BLUE}22`,
        }}
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="bg-white text-blue-700 border-blue-200">
              <Handshake className="size-3 mr-1" />
              Candidature partenaire
            </Badge>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Déposez votre demande
            </h2>
            <p className="mt-3 text-gray-600">
              Type de partenariat sélectionné : <strong>{partnerTypes.find((p) => p.id === selectedType)?.label}</strong>
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-3xl bg-white border border-gray-200 shadow-xl p-8 space-y-5"
          >
            <input type="hidden" name="partnerType" value={selectedType} />

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input id="firstName" name="firstName" required placeholder="Aminata" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Nom *</Label>
                <Input id="lastName" name="lastName" required placeholder="Diop" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email professionnel *</Label>
              <Input id="email" name="email" type="email" required placeholder="aminata@entreprise.sn" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Téléphone / WhatsApp *</Label>
                <Input id="phone" name="phone" required placeholder="+221 77 123 45 67" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="country">Pays *</Label>
                <Select name="country" required defaultValue="SN">
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SN">Sénégal</SelectItem>
                    <SelectItem value="CI">Côte d&apos;Ivoire</SelectItem>
                    <SelectItem value="ML">Mali</SelectItem>
                    <SelectItem value="BJ">Bénin</SelectItem>
                    <SelectItem value="TG">Togo</SelectItem>
                    <SelectItem value="BF">Burkina Faso</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company">Société / Organisation *</Label>
              <Input id="company" name="company" required placeholder="Ma Société SARL" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">Votre projet en quelques lignes *</Label>
              <Textarea
                id="message"
                name="message"
                required
                rows={4}
                placeholder="Décrivez votre activité, vos clients cibles, et pourquoi vous souhaitez devenir partenaire VerifScan."
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto h-12 px-7 text-white font-semibold shadow-lg"
                style={{ backgroundColor: BLUE }}
              >
                {submitting ? "Envoi en cours..." : "Envoyer ma candidature"}
                <ArrowRight className="size-4 ml-2" />
              </Button>
              <p className="text-xs text-gray-500">
                Réponse sous 48h ouvrées. Vos données ne sont jamais partagées.
              </p>
            </div>
          </form>
        </div>
      </section>

      {/* CTA secondaire */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-sm text-gray-500">
          Vous voulez d&apos;abord en discuter avant de candidater ?
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-white border-2 text-sm font-semibold transition-all hover:bg-gray-50"
            style={{ color: BLUE, borderColor: `${BLUE}33` }}
          >
            Parler à un conseiller
          </Link>
          <a
            href="mailto:partenariat@verifscan.sn"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold transition-all hover:opacity-90 text-white"
            style={{ backgroundColor: GREEN }}
          >
            partenariat@verifscan.sn
          </a>
        </div>
      </section>
    </PublicShell>
  );
}

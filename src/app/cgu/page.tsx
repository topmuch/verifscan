"use client";

import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { Badge } from "@/components/ui/badge";
import { ScrollText, User, ShieldCheck, CreditCard, AlertTriangle, Scale } from "lucide-react";

const BLUE = "#0f4382";
const GREEN = "#2ebd5a";

export default function CGUPage() {
  return (
    <PublicShell>
      {/* Hero */}
      <section className="vs-gradient-hero border-b border-emerald-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <ScrollText className="size-3 mr-1" />
            Conditions générales d&apos;utilisation
          </Badge>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
            CGU de la plateforme VerifScan
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Dernière mise à jour : 27 juillet 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-10">
          <article>
            <div className="flex items-center gap-2 mb-3">
              <ScrollText className="size-5" style={{ color: BLUE }} />
              <h2 className="font-display text-2xl font-bold">Article 1 — Objet</h2>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-700 leading-relaxed">
                Les présentes conditions générales d&apos;utilisation (ci-après « CGU ») régissent
                l&apos;utilisation de la plateforme VerifScan (ci-après « la Plateforme »), accessible
                à l&apos;adresse <Link href="https://verifscan.sn" className="hover:underline" style={{ color: BLUE }}>https://verifscan.sn</Link>,
                éditée par VerifScan SARL. En accédant à la Plateforme, vous acceptez sans réserve
                les présentes CGU. Si vous n&apos;êtes pas d&apos;accord avec l&apos;une de leurs
                dispositions, veuillez ne pas utiliser la Plateforme.
              </p>
            </div>
          </article>

          <article>
            <div className="flex items-center gap-2 mb-3">
              <User className="size-5" style={{ color: BLUE }} />
              <h2 className="font-display text-2xl font-bold">Article 2 — Comptes &amp; accès</h2>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                La création d&apos;un compte fabricant est gratuite et nécessite la communication
                d&apos;informations exactes sur l&apos;entreprise (raison sociale, RCCM, contact).
                VerifScan se réserve le droit de refuser ou suspendre un compte en cas
                d&apos;informations fausses, de fraude ou de violation des présentes CGU.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                L&apos;utilisateur est responsable de la confidentialité de ses identifiants. Toute
                activité réalisée depuis son compte est réputée effectuée par lui. En cas de perte
                ou de vol, il doit notifier VerifScan sans délai.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                L&apos;accès à la page produit publique lors d&apos;un scan QR ne nécessite pas de
                compte.
              </p>
            </div>
          </article>

          <article>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="size-5" style={{ color: BLUE }} />
              <h2 className="font-display text-2xl font-bold">Article 3 — Responsabilités du fabricant</h2>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                Le fabricant s&apos;engage à :
              </p>
              <ul className="text-sm text-gray-700 leading-relaxed ml-4 list-disc space-y-1">
                <li>Renseigner des informations exactes et à jour sur ses produits, lots et certifications.</li>
                <li>Ne pas créer de faux lots ni tenter de manipuler les identifiants blockchain.</li>
                <li>Respecter les réglementations locales et internationales applicables à ses produits (étiquetage, dates de péremption, allergènes).</li>
                <li>Marquer un lot comme « rappelé » dès qu&apos;il a connaissance d&apos;un défaut.</li>
                <li>Ne pas scanner ses propres QR codes à des fins de manipulation statistique.</li>
              </ul>
              <p className="text-sm text-gray-700 leading-relaxed mt-3">
                VerifScan décline toute responsabilité quant aux informations fournies par les
                fabricants. En cas de manquement grave, le compte peut être suspendu sans préavis.
              </p>
            </div>
          </article>

          <article>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="size-5" style={{ color: BLUE }} />
              <h2 className="font-display text-2xl font-bold">Article 4 — Abonnements &amp; paiement</h2>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                VerifScan propose 3 plans : <strong>Starter</strong> (gratuit, 500 QR/mois),
                <strong> Pro</strong> (10 000 FCFA/mois, 5 000 QR/mois) et
                <strong> Enterprise</strong> (sur devis). Un essai gratuit de 14 jours est offert
                sur les plans payants, sans carte bancaire.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Les paiements sont traités par CinetPay (mobile money, carte bancaire) et Stripe
                (carte internationale). Les factures sont disponibles dans le tableau de bord.
                Le remboursement est possible sous 14 jours si aucun QR code n&apos;a été généré
                au-delà du quota gratuit.
              </p>
            </div>
          </article>

          <article>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="size-5" style={{ color: BLUE }} />
              <h2 className="font-display text-2xl font-bold">Article 5 — Limitation de responsabilité</h2>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                VerifScan est un fournisseur de services techniques. La plateforme ne saurait être
                tenue responsable : (a) de la qualité, de la salubrité ou de la conformité des
                produits tracés ; (b) des déclarations des fabricants ; (c) des dysfonctionnements
                imputables à l&apos;utilisateur ou à un cas de force majeure.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                La responsabilité de VerifScan est en tout état de cause plafonnée au montant des
                sommes versées par le fabricant au cours des 12 derniers mois.
              </p>
            </div>
          </article>

          <article>
            <div className="flex items-center gap-2 mb-3">
              <Scale className="size-5" style={{ color: BLUE }} />
              <h2 className="font-display text-2xl font-bold">Article 6 — Droit applicable &amp; litiges</h2>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-700 leading-relaxed">
                Les présentes CGU sont régies par le droit sénégalais. En cas de litige, une
                solution amiable sera recherchée en priorité. À défaut, les tribunaux de Dakar
                seront seuls compétents. Pour les partenaires hors Sénégal, un arbitrage CEDEAO
                peut être saisi.
              </p>
            </div>
          </article>

          <div className="rounded-2xl p-6 text-center bg-gray-50 border border-gray-200">
            <p className="text-sm text-gray-600">
              Voir aussi : <Link href="/mentions-legales" className="hover:underline font-medium" style={{ color: BLUE }}>Mentions légales &amp; politique de confidentialité</Link>
              {" • "}
              <Link href="/contact" className="hover:underline font-medium" style={{ color: BLUE }}>Nous contacter</Link>
            </p>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

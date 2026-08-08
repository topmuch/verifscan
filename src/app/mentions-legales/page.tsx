"use client";

import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { Badge } from "@/components/ui/badge";
import { FileText, Building2, Server, Lock, Cookie, ShieldCheck, Mail } from "lucide-react";

const BLUE = "#0f4382";
const GREEN = "#2ebd5a";

export default function MentionsLegalesPage() {
  return (
    <PublicShell>
      {/* Hero */}
      <section className="vs-gradient-hero border-b border-emerald-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <FileText className="size-3 mr-1" />
            Mentions légales
          </Badge>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
            Mentions légales & politique de confidentialité
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Dernière mise à jour : 27 juillet 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-10">
          {/* Éditeur */}
          <article>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="size-5" style={{ color: BLUE }} />
              <h2 className="font-display text-2xl font-bold">1. Éditeur de la plateforme</h2>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                VerifScan est édité par <strong>VerifScan SARL</strong>, société de droit sénégalais,
                immatriculée au RCCM de Dakar sous le numéro SN-DKR-2024-12345, dont le siège social
                est situé :
              </p>
              <address className="not-italic text-sm text-gray-700 ml-4 border-l-2 pl-4" style={{ borderColor: GREEN }}>
                Rue MZ 12, Zone Industrielle<br />
                Dakar, Sénégal<br />
                Email : <a href="mailto:contact@verifscan.sn" className="hover:underline" style={{ color: BLUE }}>contact@verifscan.sn</a><br />
                Téléphone : +221 33 800 00 00
              </address>
              <p className="text-sm text-gray-700 leading-relaxed mt-3">
                Directeur de la publication : Aminata Diop, Présidente.
              </p>
            </div>
          </article>

          {/* Hébergeur */}
          <article>
            <div className="flex items-center gap-2 mb-3">
              <Server className="size-5" style={{ color: BLUE }} />
              <h2 className="font-display text-2xl font-bold">2. Hébergement</h2>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-700 leading-relaxed">
                La plateforme VerifScan est hébergée par <strong>Coolify / Hetzner Online GmbH</strong>,
                dont le siège social est situé Industriestr. 25, 91710 Gunzenhausen, Allemagne. Les
                serveurs sont situés dans l&apos;Union Européenne (Frankfurt, DE) conformément aux
                exigences du RGPD européen. Le contrat d&apos;hébergement garantit la
                confidentialité, l&apos;intégrité et la disponibilité des données traitées.
              </p>
            </div>
          </article>

          {/* Propriété intellectuelle */}
          <article>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="size-5" style={{ color: BLUE }} />
              <h2 className="font-display text-2xl font-bold">3. Propriété intellectuelle</h2>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                L&apos;ensemble des éléments présents sur ce site (textes, logos, images, vidéos,
                éléments graphiques, design, code source, marque « VerifScan ») est la propriété
                exclusive de VerifScan SARL, sauf mention contraire. Toute reproduction, représentation,
                modification ou diffusion, totale ou partielle, sans autorisation écrite préalable,
                est interdite et constitue une contrefaçon sanctionnée par les articles L.335-2 et
                suivants du Code de la propriété intellectuelle.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Les marques, noms commerciaux et logos des fabricants partenaires affichés sur
                VerifScan restent la propriété de leurs détenteurs respectifs. Leur présence sur la
                plateforme résulte d&apos;un accord contractuel.
              </p>
            </div>
          </article>

          {/* Données personnelles */}
          <article>
            <div className="flex items-center gap-2 mb-3">
              <Lock className="size-5" style={{ color: BLUE }} />
              <h2 className="font-display text-2xl font-bold">4. Données personnelles &amp; RGPD</h2>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-gray-900 mb-1">4.1 Responsable du traitement</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  VerifScan SARL est responsable du traitement des données personnelles collectées
                  sur la plateforme. Le Délégué à la Protection des Données est joignable à
                  <a href="mailto:dpo@verifscan.sn" className="hover:underline ml-1" style={{ color: BLUE }}>dpo@verifscan.sn</a>.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-gray-900 mb-1">4.2 Données collectées</h3>
                <ul className="text-sm text-gray-700 leading-relaxed ml-4 list-disc space-y-1">
                  <li><strong>Compte fabricant</strong> : email, nom de l&apos;entreprise, logo, téléphone, adresse.</li>
                  <li><strong>Scans QR</strong> : adresse IP (anonymisée), pays, ville, type d&apos;appareil, user-agent — collectés à des fins statistiques agrégées uniquement.</li>
                  <li><strong>Avis produits</strong> : nom (facultatif), contenu du commentaire, note.</li>
                  <li><strong>Paiements</strong> : traités par CinetPay / Stripe ; VerifScan ne stocke jamais les données bancaires.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-gray-900 mb-1">4.3 Finalités</h3>
                <ul className="text-sm text-gray-700 leading-relaxed ml-4 list-disc space-y-1">
                  <li>Authentifier les fabricants et sécuriser leur compte.</li>
                  <li>Permettre la traçabilité des produits et la détection d&apos;anomalies.</li>
                  <li>Produire des statistiques agrégées et anonymisées pour les fabricants.</li>
                  <li>Envoyer des notifications (rappel de lot, alerte de péremption, etc.).</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-gray-900 mb-1">4.4 Durée de conservation</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Les données de compte sont conservées pendant la durée de vie du compte + 3 ans.
                  Les logs de scans sont anonymisés après 90 jours puis agrégés. Les données de
                  paiement sont conservées 10 ans pour respecter les obligations comptables.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-gray-900 mb-1">4.5 Vos droits</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Conformément à la Loi sénégalaise n°2008-12 sur la protection des données à
                  caractère personnel et au RGPD européen, vous disposez des droits
                  d&apos;accès, de rectification, d&apos;effacement, d&apos;opposition, de
                  limitation et de portabilité. Pour les exercer, écrivez à
                  <a href="mailto:dpo@verifscan.sn" className="hover:underline ml-1" style={{ color: BLUE }}>dpo@verifscan.sn</a>.
                  Vous pouvez également déposer une réclamation auprès de la CDP (Commission de
                  Protection des Données Personnelles) du Sénégal.
                </p>
              </div>
            </div>
          </article>

          {/* Cookies */}
          <article>
            <div className="flex items-center gap-2 mb-3">
              <Cookie className="size-5" style={{ color: BLUE }} />
              <h2 className="font-display text-2xl font-bold">5. Politique cookies</h2>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                VerifScan utilise deux catégories de cookies :
              </p>
              <ul className="text-sm text-gray-700 leading-relaxed ml-4 list-disc space-y-1">
                <li><strong>Cookies essentiels</strong> : nécessaires à l&apos;authentification et au fonctionnement (session NextAuth). Aucun consentement requis.</li>
                <li><strong>Cookies de mesure d&apos;audience</strong> : anonymisés, utilisés pour comprendre l&apos;usage du site. Consentement demandé via bandeau.</li>
              </ul>
              <p className="text-sm text-gray-700 leading-relaxed">
                Aucun cookie publicitaire ou de tracking tiers n&apos;est déposé. Vous pouvez
                retirer votre consentement à tout moment via le bouton « Gérer mes cookies » en
                bas de page.
              </p>
            </div>
          </article>

          {/* Blockchain & sécurité */}
          <article>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="size-5" style={{ color: BLUE }} />
              <h2 className="font-display text-2xl font-bold">6. Sécurité &amp; blockchain</h2>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                Les identifiants de lots sont certifiés par une signature cryptographique déposée
                sur une blockchain publique. Cette signature est immuable et permet à tout
                tiers indépendant de vérifier l&apos;authenticité d&apos;un lot sans dépendre de
                VerifScan.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Les mots de passe sont hachés avec bcrypt (10 rounds). Les communications sont
                chiffrées en TLS 1.3. L&apos;accès aux comptes est journalisé et des alertes
                anti-fraude détectent les connexions suspectes.
              </p>
            </div>
          </article>

          {/* Contact */}
          <article>
            <div className="flex items-center gap-2 mb-3">
              <Mail className="size-5" style={{ color: BLUE }} />
              <h2 className="font-display text-2xl font-bold">7. Contact</h2>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-700 leading-relaxed">
                Pour toute question relative aux présentes mentions légales, vous pouvez nous
                contacter par email à
                <a href="mailto:legal@verifscan.sn" className="hover:underline ml-1 font-medium" style={{ color: BLUE }}>legal@verifscan.sn</a>
                ou par courrier postal à l&apos;adresse du siège social indiquée ci-dessus. Une
                réponse vous sera apportée sous 15 jours ouvrés.
              </p>
            </div>
          </article>

          {/* Liens */}
          <div className="rounded-2xl p-6 text-center bg-gray-50 border border-gray-200">
            <p className="text-sm text-gray-600">
              Voir aussi : <Link href="/cgu" className="hover:underline font-medium" style={{ color: BLUE }}>Conditions générales d&apos;utilisation</Link>
              {" • "}
              <Link href="/contact" className="hover:underline font-medium" style={{ color: BLUE }}>Nous contacter</Link>
            </p>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

"use client";

/**
 * ExportProduceView
 *
 * Vue alternative de la page produit, utilisée quand la catégorie du produit
 * a `pageTemplate === "export_produce"`. Conçue pour les exportateurs
 * (mangues, crevettes, fonio, etc.) qui ont besoin d'afficher plus d'infos
 * qu'un fabricant de jus classique :
 *
 *   🍋 Présentation (variété, origine, région, producteur)
 *   🌍 Traçabilité (récolte, conditionnement, station, pays)
 *   📄 Certifications (PDFs téléchargeables)
 *   🧪 Contrôle qualité (calibre, Brix, poids, température)
 *   📦 Logistique (conteneur, palette, expédition, destination)
 *   📅 Dates importantes (récolte, emballage, DLC)
 *   👨🏿‍🌾 Producteur (photo, histoire, contacts, site)
 *   🎥 Médias (photos du verger, vidéos YouTube/Vimeo)
 *   📍 Localisation (Google Maps du verger / station)
 *   📞 Contact (bouton WhatsApp / email)
 *
 * Le bandeau de statut de consommation commun est calculé ici (même logique
 * que sur le template standard pour rester cohérent).
 */

import { useState } from "react";
import {
  Calendar,
  Factory,
  Ship,
  Package,
  MapPin,
  Thermometer,
  Scale,
  Droplets,
  FileText,
  ExternalLink,
  Phone,
  MessageCircle,
  Mail,
  Globe,
  Play,
  Image as ImageIcon,
  Award,
  Leaf,
  CheckCircle2,
  Clock,
  Truck,
} from "lucide-react";
import {
  formatDate,
  isExpired,
  daysUntil,
} from "../_lib/product-helpers";

/* ============ Brand colors ============ */
const BLUE = "#0f4382";
const BLUE_DARK = "#0a3060";
const GREEN = "#2ebd5a";
const GREEN_DARK = "#065f46";
const ORANGE = "#F59E0B";
const ORANGE_DARK = "#92400E";

/* ============ Types ============ */
type Certification = {
  id: string;
  type: string;
  issuer: string;
  certificateNumber: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  verified: boolean;
  documentUrl: string | null;
};

type LotMedia = {
  id: string;
  type: string; // 'photo' | 'video'
  url: string;
  caption: string | null;
};

type ExportLot = {
  id: string;
  lotNumber: string;
  manufacturingDate: string;
  expirationDate: string;
  ingredients: string | null;
  manufacturingLocation: string | null;
  transformationLocation: string | null;
  salesCountries: string | null;
  status: string;
  recallReason: string | null;
  recalledAt: string | null;
  createdAt: string;

  // Champs export_produce
  harvestDate: string | null;
  packagingDate: string | null;
  packagingStation: string | null;
  containerNumber: string | null;
  palletNumber: string | null;
  shipDate: string | null;
  destination: string | null;
  carrier: string | null;
  caliber: string | null;
  avgWeightGram: number | null;
  brix: number | null;
  storageTempC: number | null;
  shelfLifeDays: number | null;

  product: {
    id: string;
    name: string;
    brand: string;
    description: string | null;
    photoUrl: string | null;
    weight: string | null;
    variety: string | null;
    regionOfProduction: string | null;
    producerStory: string | null;
    producerPhotoUrl: string | null;
    gpsLat: number | null;
    gpsLng: number | null;
    category: { name: string; icon: string | null; pageTemplate: string };
    user: {
      id: string;
      companyName: string;
      logoUrl: string | null;
      phone: string | null;
      whatsapp: string | null;
      emailContact: string | null;
      address: string | null;
      socialFacebook: string | null;
      socialTwitter: string | null;
      socialLinkedin: string | null;
      socialInstagram: string | null;
      createdAt: string;
    };
  };

  certifications: Certification[];
  lotMedia: LotMedia[];
};

/* ============ Helpers ============ */

// Convert any URL (YouTube watch / youtu.be / Vimeo) to an embeddable URL.
function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    // YouTube
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
    if (u.hostname === "youtu.be" || u.hostname === "www.youtu.be") {
      const v = u.pathname.replace("/", "");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    // Vimeo
    if (u.hostname.includes("vimeo.com")) {
      const v = u.pathname.split("/").filter(Boolean)[0];
      if (v) return `https://player.vimeo.com/video/${v}`;
    }
    // Direct video file
    if (/\.(mp4|webm|ogg)$/i.test(u.pathname)) return url;
    return null;
  } catch {
    return null;
  }
}

// Returns {label, color, icon} for a certification type.
function certMeta(type: string): { label: string; color: string; icon: typeof Award } {
  const map: Record<string, { label: string; color: string; icon: typeof Award }> = {
    phytosanitaire: { label: "Certificat phytosanitaire", color: "#0f4382", icon: FileText },
    globalgap:      { label: "GlobalG.A.P.",            color: "#2ebd5a", icon: Leaf },
    bio:            { label: "Agriculture Biologique",   color: "#16a34a", icon: Leaf },
    haccp:          { label: "HACCP",                    color: "#F59E0B", icon: CheckCircle2 },
    iso:            { label: "ISO",                      color: "#0ea5e9", icon: Award },
    origine:        { label: "Certificat d'origine",    color: "#7c3aed", icon: FileText },
    fda:            { label: "FDA",                      color: "#dc2626", icon: Award },
    halal:          { label: "Halal",                    color: "#16a34a", icon: CheckCircle2 },
    iso22000:       { label: "ISO 22000",                color: "#0ea5e9", icon: Award },
    nsf:            { label: "NSF",                      color: "#7c3aed", icon: Award },
    cedeao:         { label: "CEDEAO",                   color: "#F59E0B", icon: Award },
  };
  return map[type.toLowerCase()] ?? { label: type, color: "#6b7280", icon: Award };
}

/* ============ Sub-components ============ */

function SectionCard({
  title,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  icon: typeof Award;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 overflow-hidden shadow-sm">
      <header
        className="px-5 sm:px-6 py-4 flex items-center gap-3 text-white"
        style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}dd 100%)` }}
      >
        <div className="size-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
          <Icon className="size-5" />
        </div>
        <h2 className="font-display text-lg sm:text-xl font-semibold tracking-tight">
          {title}
        </h2>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: typeof Calendar;
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      {Icon && (
        <div className="size-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
          <Icon className="size-4 text-gray-500 dark:text-gray-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">
          {label}
        </div>
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
          {value}
        </div>
      </div>
    </div>
  );
}

/* ============ Main component ============ */

export function ExportProduceView({ lot }: { lot: ExportLot }) {
  const [activeMedia, setActiveMedia] = useState<LotMedia | null>(null);

  const expired = isExpired(lot.expirationDate);
  const remainingDays = daysUntil(lot.expirationDate);
  const isRecalled = lot.status === "recalled";

  const product = lot.product;
  const producer = product.user;
  const hasGps = product.gpsLat != null && product.gpsLng != null;
  const videos = lot.lotMedia.filter((m) => m.type === "video");
  const photos = lot.lotMedia.filter((m) => m.type === "photo");

  return (
    <div className="space-y-6">
      {/* ===== HERO ===== */}
      <section className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md">
        <div className="grid lg:grid-cols-[420px_1fr]">
          {/* Photo HD */}
          <div className="aspect-square lg:aspect-auto relative">
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${GREEN} 100%)` }}
            >
              {product.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.photoUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-9xl">{product.category?.icon || "🥭"}</span>
              )}
            </div>
            {product.variety && (
              <div
                className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg"
                style={{ backgroundColor: GREEN }}
              >
                Variété {product.variety}
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{product.category?.icon}</span>
              <span>{product.category?.name}</span>
              {producer.logoUrl && (
                <>
                  <span className="mx-2">•</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={producer.logoUrl} alt={producer.companyName} className="h-5 w-auto object-contain" />
                </>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {product.name}
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Marque : <span className="font-semibold" style={{ color: GREEN_DARK }}>{product.brand}</span>
            </p>

            {product.description && (
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {product.description}
              </p>
            )}

            <div className="grid sm:grid-cols-2 gap-2 pt-2">
              {product.variety && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-sm">
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">Variété :</span>{" "}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{product.variety}</span>
                </div>
              )}
              {product.regionOfProduction && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 px-3 py-2 text-sm">
                  <span className="text-blue-700 dark:text-blue-400 font-medium">Région :</span>{" "}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{product.regionOfProduction}</span>
                </div>
              )}
              {product.weight && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-sm">
                  <span className="text-amber-700 dark:text-amber-400 font-medium">Conditionnement :</span>{" "}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{product.weight}</span>
                </div>
              )}
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm">
                <span className="text-gray-500 font-medium">Origine :</span>{" "}
                <span className="font-semibold text-gray-900 dark:text-gray-100">Sénégal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATUT DE CONSOMMATION (commun à tous les templates) ===== */}
      {!isRecalled && (() => {
        const expiredSinceDays = expired ? Math.abs(remainingDays) : 0;
        const isGreen = !expired && remainingDays > 10;
        const isOrange = !expired && remainingDays > 5 && remainingDays <= 10;
        const isRedLight = !expired && remainingDays > 0 && remainingDays <= 5;

        const cfg = expired
          ? { bg: "#FEE2E2", border: "#B91C1C", chipBg: "#991B1B", title: "Produit expiré", titleColor: "#7F1D1D", textColor: "#991B1B", emoji: "🚫" }
          : isRedLight
            ? { bg: "#FECACA", border: "#DC2626", chipBg: "#DC2626", title: "À consommer urgemment", titleColor: "#991B1B", textColor: "#991B1B", emoji: "⚠️" }
            : isOrange
              ? { bg: "#FED7AA", border: "#F59E0B", chipBg: "#F59E0B", title: "À consommer prochainement", titleColor: "#92400E", textColor: "#92400E", emoji: "⏳" }
              : { bg: "#D1FAE5", border: "#2EBD5A", chipBg: "#2EBD5A", title: "Conforme à la consommation", titleColor: "#065F46", textColor: "#065F46", emoji: "🟢" };

        const conseil = expired
          ? `Produit expiré depuis ${expiredSinceDays} jour${expiredSinceDays > 1 ? "s" : ""}. Nous déconseillons sa consommation.`
          : isRedLight
            ? `Ce produit expire dans ${remainingDays} jour${remainingDays > 1 ? "s" : ""}. Vérifiez l'emballage et consommez-le rapidement.`
            : isOrange
              ? `Ce produit expire dans ${remainingDays} jours. Pensez à le consommer avant cette date.`
              : `Produit authentifié et conforme. À consommer avant le ${formatDate(lot.expirationDate)} pour une qualité optimale.`;

        return (
          <div
            className="rounded-2xl p-5 sm:p-6 flex items-start gap-4 shadow-sm"
            style={{ background: `linear-gradient(135deg, ${cfg.bg} 0%, #FFFFFF 100%)`, border: `2px solid ${cfg.border}` }}
            role="status"
          >
            <div
              className="flex-shrink-0 size-14 rounded-xl flex items-center justify-center text-2xl shadow-md"
              style={{ backgroundColor: cfg.chipBg }}
              aria-hidden="true"
            >
              <span className="text-white">{cfg.emoji}</span>
            </div>
            <div className="flex-1">
              <p className="font-display text-xl font-bold uppercase tracking-wide" style={{ color: cfg.titleColor }}>
                {cfg.emoji} {cfg.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: cfg.textColor }}>{conseil}</p>
              <div className="mt-3 grid sm:grid-cols-3 gap-2 text-xs">
                <div className="rounded-md bg-white/70 px-3 py-2" style={{ color: cfg.textColor }}>
                  <span className="opacity-70">Fabriqué le :</span> <strong>{formatDate(lot.manufacturingDate)}</strong>
                </div>
                <div className="rounded-md bg-white/70 px-3 py-2" style={{ color: cfg.textColor }}>
                  <span className="opacity-70">Péremption :</span> <strong>{formatDate(lot.expirationDate)}</strong>
                </div>
                <div className="rounded-md bg-white/70 px-3 py-2" style={{ color: cfg.textColor }}>
                  <span className="opacity-70">Temps restant :</span>{" "}
                  <strong>{expired ? `Expiré (${expiredSinceDays} j)` : `${remainingDays} jour${remainingDays > 1 ? "s" : ""}`}</strong>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== RAPPEL ===== */}
      {isRecalled && (
        <div className="rounded-2xl p-5 sm:p-6 bg-red-50 border-2 border-red-600" role="alert">
          <p className="font-display text-xl font-bold uppercase text-red-700">⚠️ Lot rappelé</p>
          {lot.recallReason && <p className="mt-1 text-sm text-red-700">{lot.recallReason}</p>}
        </div>
      )}

      {/* === GRID 2 colonnes === */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ===== TRAÇABILITÉ ===== */}
        <SectionCard title="Traçabilité" icon={Factory} accent={BLUE}>
          <InfoRow label="Numéro de lot" value={lot.lotNumber} icon={Package} />
          {lot.harvestDate && (
            <InfoRow label="Date de récolte" value={formatDate(lot.harvestDate)} icon={Calendar} />
          )}
          {lot.packagingDate && (
            <InfoRow label="Date de conditionnement" value={formatDate(lot.packagingDate)} icon={Calendar} />
          )}
          {lot.packagingStation && (
            <InfoRow label="Station de conditionnement" value={lot.packagingStation} icon={Factory} />
          )}
          <InfoRow label="Pays d'origine" value="Sénégal" icon={MapPin} />
          {product.regionOfProduction && (
            <InfoRow label="Région de production" value={product.regionOfProduction} icon={MapPin} />
          )}
          {lot.salesCountries && (
            <InfoRow label="Pays de vente" value={lot.salesCountries} icon={Globe} />
          )}
        </SectionCard>

        {/* ===== CONTRÔLE QUALITÉ ===== */}
        <SectionCard title="Contrôle qualité" icon={Scale} accent={GREEN}>
          {lot.caliber && <InfoRow label="Calibre" value={lot.caliber} icon={Scale} />}
          {lot.avgWeightGram != null && (
            <InfoRow label="Poids moyen" value={`${lot.avgWeightGram} g`} icon={Scale} />
          )}
          {lot.brix != null && (
            <InfoRow label="Taux de sucre" value={`${lot.brix} °Brix`} icon={Droplets} />
          )}
          {lot.storageTempC != null && (
            <InfoRow
              label="Température de conservation"
              value={`${lot.storageTempC} °C`}
              icon={Thermometer}
            />
          )}
          {lot.shelfLifeDays != null && (
            <InfoRow
              label="Durée de conservation"
              value={`${lot.shelfLifeDays} jours`}
              icon={Clock}
            />
          )}
          {product.weight && <InfoRow label="Conditionnement" value={product.weight} icon={Package} />}
          {!lot.caliber && !lot.avgWeightGram && lot.brix == null && lot.storageTempC == null && lot.shelfLifeDays == null && (
            <p className="text-sm text-gray-500 italic">Aucune donnée de contrôle qualité renseignée pour ce lot.</p>
          )}
        </SectionCard>

        {/* ===== LOGISTIQUE ===== */}
        <SectionCard title="Logistique & Export" icon={Ship} accent={ORANGE}>
          {lot.containerNumber && <InfoRow label="Conteneur" value={lot.containerNumber} icon={Package} />}
          {lot.palletNumber && <InfoRow label="Palette" value={lot.palletNumber} icon={Package} />}
          {lot.shipDate && <InfoRow label="Date d'expédition" value={formatDate(lot.shipDate)} icon={Calendar} />}
          {lot.destination && <InfoRow label="Destination" value={lot.destination} icon={MapPin} />}
          {lot.carrier && <InfoRow label="Transporteur" value={lot.carrier} icon={Truck} />}
          {!lot.containerNumber && !lot.palletNumber && !lot.shipDate && !lot.destination && !lot.carrier && (
            <p className="text-sm text-gray-500 italic">Aucune donnée logistique renseignée pour ce lot.</p>
          )}
        </SectionCard>

        {/* ===== DATES IMPORTANTES ===== */}
        <SectionCard title="Dates importantes" icon={Calendar} accent={BLUE_DARK}>
          <InfoRow label="Date de récolte" value={lot.harvestDate ? formatDate(lot.harvestDate) : null} icon={Calendar} />
          <InfoRow label="Date de fabrication" value={formatDate(lot.manufacturingDate)} icon={Factory} />
          {lot.packagingDate && (
            <InfoRow label="Date d'emballage" value={formatDate(lot.packagingDate)} icon={Package} />
          )}
          <InfoRow
            label="Date limite de consommation"
            value={formatDate(lot.expirationDate)}
            icon={Calendar}
          />
          {lot.shelfLifeDays != null && (
            <InfoRow label="Durée de conservation totale" value={`${lot.shelfLifeDays} jours`} icon={Clock} />
          )}
        </SectionCard>
      </div>

      {/* ===== CERTIFICATIONS ===== */}
      <SectionCard title="Certifications & Documents" icon={Award} accent={BLUE}>
        {lot.certifications.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Aucune certification renseignée pour ce producteur.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {lot.certifications.map((cert) => {
              const meta = certMeta(cert.type);
              const Icon = meta.icon;
              return (
                <div
                  key={cert.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-start gap-3 hover:shadow-md transition-shadow"
                  style={{ borderLeftWidth: "4px", borderLeftColor: meta.color }}
                >
                  <div
                    className="size-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${meta.color}15` }}
                  >
                    <Icon className="size-5" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{meta.label}</p>
                      {cert.verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                          <CheckCircle2 className="size-3" /> Vérifié
                        </span>
                      )}
                    </div>
                    {cert.issuer && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Émetteur : {cert.issuer}</p>
                    )}
                    {cert.certificateNumber && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">N° : {cert.certificateNumber}</p>
                    )}
                    {cert.expiresAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Valable jusqu'au : {formatDate(cert.expiresAt)}
                      </p>
                    )}
                    {cert.documentUrl && (
                      <a
                        href={cert.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium mt-2 hover:underline"
                        style={{ color: meta.color }}
                      >
                        <ExternalLink className="size-3" />
                        Consulter / Télécharger le PDF
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* ===== PRODUCTEUR ===== */}
      <SectionCard title="Producteur" icon={Leaf} accent={GREEN_DARK}>
        <div className="grid md:grid-cols-[160px_1fr] gap-5">
          <div>
            {product.producerPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.producerPhotoUrl}
                alt={producer.companyName}
                className="w-full aspect-square rounded-xl object-cover border-2 border-emerald-100 dark:border-emerald-900"
              />
            ) : (
              <div className="w-full aspect-square rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40">
                <span className="text-5xl">👨🏿‍🌾</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Entreprise</p>
                <p className="text-xl font-display font-bold" style={{ color: GREEN_DARK }}>
                  {producer.companyName}
                </p>
              </div>
              <a
                href={`/producteur/${producer.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-sm hover:shadow-md transition-all flex-shrink-0"
                style={{ backgroundColor: BLUE }}
              >
                <ExternalLink className="size-3.5" />
                Voir la fiche producteur
              </a>
            </div>
            {product.producerStory && (
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-line">
                {product.producerStory}
              </p>
            )}
            <div className="grid sm:grid-cols-2 gap-2 pt-2 text-sm">
              {producer.address && <InfoRow label="Adresse" value={producer.address} icon={MapPin} />}
              {producer.phone && <InfoRow label="Téléphone" value={producer.phone} icon={Phone} />}
              {producer.whatsapp && <InfoRow label="WhatsApp" value={producer.whatsapp} icon={MessageCircle} />}
              {producer.emailContact && <InfoRow label="E-mail" value={producer.emailContact} icon={Mail} />}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ===== MÉDIAS ===== */}
      {(videos.length > 0 || photos.length > 0) && (
        <SectionCard title="Médias" icon={Play} accent={ORANGE_DARK}>
          {videos.length > 0 && (
            <div className="mb-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-2">
                Vidéos
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {videos.map((v) => {
                  const embed = toEmbedUrl(v.url);
                  // Vidéo locale (uploads/ ou .mp4/.webm/.ogg direct)
                  const isLocalVideo =
                    v.url.startsWith("/uploads/") ||
                    /\.(mp4|webm|ogg)$/i.test(v.url);
                  return (
                    <div key={v.id} className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                      {isLocalVideo ? (
                        // eslint-disable-next-line jsx-a11y/media-has-caption
                        <video
                          src={v.url}
                          controls
                          className="w-full aspect-video bg-black"
                          preload="metadata"
                        />
                      ) : embed ? (
                        <div className="aspect-video">
                          <iframe
                            src={embed}
                            title={v.caption || "Vidéo"}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <a
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-video flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition-colors"
                        >
                          <Play className="size-12 text-gray-500" />
                        </a>
                      )}
                      {v.caption && (
                        <p className="p-2 text-xs text-gray-600 dark:text-gray-400">{v.caption}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {photos.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-2">
                Photos du verger / de l'atelier
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {photos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActiveMedia(p)}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 hover:ring-2 hover:ring-emerald-500 transition-all"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.caption || ""} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <ImageIcon className="size-6 text-white opacity-0 group-hover:opacity-100" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* ===== LOCALISATION GPS ===== */}
      {hasGps && (
        <SectionCard title="Localisation" icon={MapPin} accent={BLUE}>
          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <iframe
              title="Carte du verger / de la station"
              src={`https://www.google.com/maps?q=${product.gpsLat},${product.gpsLng}&z=14&output=embed`}
              className="w-full h-80"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Coordonnées : {product.gpsLat?.toFixed(5)}, {product.gpsLng?.toFixed(5)}
          </p>
        </SectionCard>
      )}

      {/* ===== CONTACT ===== */}
      <SectionCard title="Contacter le producteur" icon={Phone} accent={GREEN}>
        <div className="flex flex-wrap gap-3">
          {producer.whatsapp && (
            <a
              href={`https://wa.me/${producer.whatsapp.replace(/[^\d]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium shadow-sm hover:shadow-md transition-shadow"
              style={{ backgroundColor: "#25D366" }}
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          )}
          {producer.phone && (
            <a
              href={`tel:${producer.phone}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium shadow-sm hover:shadow-md transition-shadow"
              style={{ backgroundColor: BLUE }}
            >
              <Phone className="size-4" />
              Appeler
            </a>
          )}
          {producer.emailContact && (
            <a
              href={`mailto:${producer.emailContact}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium shadow-sm hover:shadow-md transition-shadow"
              style={{ backgroundColor: GREEN_DARK }}
            >
              <Mail className="size-4" />
              E-mail
            </a>
          )}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Le producteur répond généralement sous 24 à 48 heures.
        </p>
      </SectionCard>

      {/* ===== LIGHTBOX PHOTO ===== */}
      {activeMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setActiveMedia(null)}
        >
          <div className="max-w-4xl max-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeMedia.url} alt={activeMedia.caption || ""} className="max-w-full max-h-[85vh] rounded-lg" />
            {activeMedia.caption && (
              <p className="text-center text-white text-sm mt-3">{activeMedia.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Package,
  MapPin,
  Globe2,
  Scale,
  Leaf,
  Factory,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MessageCircle,
  QrCode,
  AlertTriangle,
  Info,
  ShieldCheck,
  Sun,
  Moon,
  Printer,
  Copy,
  Check,
  Twitter,
  Linkedin,
  Eye,
  ThumbsUp,
  Clock,
  Star,
  Sparkles,
  Award,
  Microscope,
  Box,
  Share2,
} from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ChatbotWidget } from "@/components/chatbot-widget";
import { BlockchainBadge } from "@/components/blockchain-badge";
import {
  detectAllergens,
  ALLERGEN_TONE_CLASSES,
  getCertificationMeta,
  CERT_TONE_CLASSES,
  formatDate,
  formatDateTime,
  formatRelative,
  isExpired,
  daysUntil,
  cn,
  starArray,
} from "../_lib/product-helpers";
import { useDarkMode } from "../_lib/use-dark-mode";

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

type Review = {
  id: string;
  reliabilityScore: number;
  qualityScore: number;
  professionalismScore: number;
  comment: string | null;
  createdAt: string;
  reviewer: { companyName: string };
};

type SimilarProduct = {
  id: string;
  name: string;
  brand: string;
  photoUrl: string | null;
  weight: string | null;
  category: { name: string; icon: string | null };
  user: { companyName: string };
  lotId: string | null;
};

type Anomaly = {
  id: string;
  type: string;
  severity: string;
  description: string;
  status: string;
  detectedAt: string;
};

type Lot = {
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
  product: {
    id: string;
    name: string;
    brand: string;
    description: string | null;
    photoUrl: string | null;
    weight: string | null;
    category: { name: string; icon: string | null };
    user: {
      id: string;
      companyName: string;
      logoUrl: string | null;
      phone: string | null;
      whatsapp: string | null;
      emailContact: string | null;
      address: string | null;
      createdAt: string;
    };
  };
  qrCodes: { id: string; qrCodeImageUrl: string | null }[];
  certifications: Certification[];
  scanCount: number;
  lastScanAt: string | null;
  fabricantSince: string;
  similarProducts: SimilarProduct[];
  reviews: Review[];
  reviewAggregates: {
    reliability: number;
    quality: number;
    professionalism: number;
    overall: number;
    count: number;
  };
  anomalies: Anomaly[];
};

/* ============ Brand colors (harmonized) ============ */
const BLUE = "#0f4382";
const BLUE_DARK = "#0a3060";
const BLUE_LIGHT = "#E6EEF7";
const GREEN = "#2ebd5a";
const GREEN_DARK = "#1f8a42";
const GREEN_LIGHT = "#E0F5E6";
const ORANGE = "#F59E0B";
const ORANGE_LIGHT = "#FEF3C7";

/* ============ Page ============ */

export default function PublicLotPage({ params }: { params: Promise<{ lotId: string }> }) {
  const { lotId } = use(params);
  const router = useRouter();

  const [lot, setLot] = useState<Lot | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { theme, toggle, mounted: themeMounted } = useDarkMode();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/lots/${lotId}`);
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setLot(data);

        if (data.qrCodes?.[0]?.id) {
          const ua = navigator.userAgent;
          const isMobile = /Mobile|Android|iPhone/i.test(ua);
          let location: string | undefined;
          try {
            const ipRes = await fetch("https://ipapi.co/json/");
            if (ipRes.ok) {
              const ipData = await ipRes.json();
              location = [ipData.city, ipData.country_name].filter(Boolean).join(", ");
            }
          } catch {}
          fetch("/api/scans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              qrCodeId: data.qrCodes[0].id,
              location,
              deviceType: isMobile ? "mobile" : "desktop",
              userAgent: ua,
            }),
          }).catch(() => {});
        }

        setLoading(false);
      } catch {
        setLoading(false);
        setNotFound(true);
      }
    })();
  }, [lotId]);

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Lien copié dans le presse-papiers");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  if (loading) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </PublicShell>
    );
  }

  if (notFound || !lot) {
    const scannedUrl = typeof window !== "undefined" ? window.location.href : "";
    return (
      <PublicShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <AlertTriangle className="mx-auto size-12 text-amber-500" />
          <h1 className="mt-4 text-2xl font-bold">Produit introuvable</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Ce QR code ne correspond à aucun produit enregistré. Il peut s&apos;agir d&apos;une
            contrefaçon ou d&apos;un code expiré.
          </p>

          <div className="mt-6 mx-auto max-w-md text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 text-xs space-y-1">
            <div className="flex justify-between gap-2">
              <span className="text-gray-500 dark:text-gray-400">URL scannée :</span>
              <code className="font-mono text-gray-700 dark:text-gray-200 break-all">{scannedUrl}</code>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-500 dark:text-gray-400">Lot ID :</span>
              <code className="font-mono text-gray-700 dark:text-gray-200 break-all">{lotId}</code>
            </div>
            <p className="pt-2 text-gray-500 dark:text-gray-400">
              Si vous êtes le fabricant, vérifiez que ce lot existe dans votre tableau de bord.
              Si le QR a été imprimé avant une migration, régénérez-le depuis la page QR Codes.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Button asChild style={{ backgroundColor: GREEN }}>
              <Link href="/produits">Voir les produits authentiques</Link>
            </Button>
            {scannedUrl && (
              <Button
                variant="outline"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    navigator.clipboard
                      .writeText(scannedUrl)
                      .then(() => toast.success("URL copiée"))
                      .catch(() => toast.error("Impossible de copier"));
                  }
                }}
              >
                <Copy className="mr-1 size-4" />
                Copier l&apos;URL
              </Button>
            )}
          </div>
        </div>
      </PublicShell>
    );
  }

  const isRecalled = lot.status === "recalled";
  const expired = isExpired(lot.expirationDate);
  const remainingDays = daysUntil(lot.expirationDate);
  const isNew = daysUntil(lot.createdAt) > -7;
  const allergens = detectAllergens(lot.ingredients);
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `Découvrez ce produit vérifié sur VerifScan : ${lot.product.name} (${lot.product.brand})`;

  return (
    <PublicShell>
      {/* Top toolbar — sticky, hidden in print */}
      <div className="sticky top-16 z-30 vs-no-print bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-100 dark:border-gray-800">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-500 dark:text-gray-400"
          >
            <ArrowLeft className="mr-1 size-4" />
            Retour
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggle}
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
              className="text-gray-500 dark:text-gray-400"
            >
              {themeMounted && theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              title="Imprimer cette fiche"
              className="text-gray-500 dark:text-gray-400"
            >
              <Printer className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShareOpen((s) => !s)}
              title="Partager"
              className="text-gray-500 dark:text-gray-400"
            >
              <Share2 className="size-4" />
            </Button>
          </div>
        </div>

        {/* Share panel */}
        {shareOpen && (
          <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">Partager :</span>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-medium hover:opacity-90"
              >
                <MessageCircle className="size-3.5" />
                WhatsApp
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1877F2] text-white text-xs font-medium hover:opacity-90"
              >
                <svg className="size-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-xs font-medium hover:opacity-90"
              >
                <Twitter className="size-3.5" />
                Twitter / X
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A66C2] text-white text-xs font-medium hover:opacity-90"
              >
                <Linkedin className="size-3.5" />
                LinkedIn
              </a>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium hover:opacity-90"
                style={{ backgroundColor: GREEN }}
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copié !" : "Copier le lien"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* === 1. HEADER AUTHENTIFICATION — gradient banner === */}
        <Reveal>
          {isRecalled ? (
            <div
              className="rounded-2xl p-6 sm:p-8 flex items-start gap-4 shadow-lg"
              style={{ background: "linear-gradient(135deg, #FEE2E2 0%, #FFFFFF 100%)", border: `2px solid #DC2626` }}
            >
              <div className="flex-shrink-0 size-14 rounded-2xl bg-red-500 flex items-center justify-center shadow-md">
                <XCircle className="size-8 text-white" />
              </div>
              <div>
                <p className="font-display text-xl font-bold text-red-900 uppercase tracking-wide">
                  Produit rappelé
                </p>
                <p className="mt-1 text-sm text-red-700 leading-relaxed">
                  Ce lot a été rappelé par le fabricant. Il est déconseillé de le consommer.
                  Contactez le fabricant pour plus d&apos;informations.
                </p>
                {lot.recallReason && (
                  <p className="mt-2 text-xs text-red-700 italic">Motif : {lot.recallReason}</p>
                )}
              </div>
            </div>
          ) : expired ? (
            <div
              className="rounded-2xl p-6 sm:p-8 flex items-start gap-4 shadow-lg"
              style={{ background: "linear-gradient(135deg, #FEF3C7 0%, #FFFFFF 100%)", border: `2px solid ${ORANGE}` }}
            >
              <div className="flex-shrink-0 size-14 rounded-2xl flex items-center justify-center shadow-md" style={{ backgroundColor: ORANGE }}>
                <AlertTriangle className="size-8 text-white" />
              </div>
              <div>
                <p className="font-display text-xl font-bold uppercase tracking-wide" style={{ color: "#92400E" }}>
                  Date de péremption dépassée
                </p>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "#B45309" }}>
                  La date de péremption de ce lot est dépassée. Vérifiez auprès du fabricant.
                </p>
              </div>
            </div>
          ) : (
            <div
              className="rounded-2xl p-6 sm:p-8 flex items-start gap-4 shadow-lg vs-animate-pulse-soft"
              style={{ background: `linear-gradient(135deg, ${GREEN_LIGHT} 0%, #FFFFFF 100%)`, border: `2px solid ${GREEN}` }}
            >
              <div className="flex-shrink-0 size-14 rounded-2xl flex items-center justify-center shadow-md" style={{ backgroundColor: GREEN }}>
                <CheckCircle2 className="size-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-display text-xl font-bold uppercase tracking-wide" style={{ color: GREEN_DARK }}>
                  Produit authentique et vérifié
                </p>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "#166534" }}>
                  Ce produit a été authentifié par{" "}
                  <span className="font-semibold">{lot.product.user.companyName}</span>. Les informations
                  ci-dessous sont officielles et vérifiables.
                </p>
                {remainingDays > 0 && remainingDays <= 30 && (
                  <p className="mt-2 text-xs font-medium" style={{ color: "#B45309" }}>
                    ⏳ À consommer dans les {remainingDays} jours
                  </p>
                )}
              </div>
            </div>
          )}
        </Reveal>

        {/* === 2. STATS RAPIDES — 4 cards colorées (style QRTags) === */}
        <Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickStat
              icon={Eye}
              value={lot.scanCount.toLocaleString("fr-FR")}
              label="Scans effectués"
              bg={BLUE}
              bgLight={BLUE_LIGHT}
            />
            <QuickStat
              icon={ShieldCheck}
              value="Vérifié"
              label="Par VerifScan"
              bg={GREEN}
              bgLight={GREEN_LIGHT}
            />
            <QuickStat
              icon={Clock}
              value={formatRelative(lot.lastScanAt || lot.createdAt)}
              label="Dernier scan"
              bg={BLUE}
              bgLight={BLUE_LIGHT}
            />
            <QuickStat
              icon={Award}
              value={lot.certifications.length.toString()}
              label="Fabricant inscrit"
              bg={GREEN}
              bgLight={GREEN_LIGHT}
            />
          </div>
        </Reveal>

        {/* === 3. CARTE PRODUIT PRINCIPALE === */}
        <Reveal>
          <div
            className="rounded-2xl bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 overflow-hidden shadow-md"
            style={{ borderWidth: "2px" }}
          >
            <div className="grid sm:grid-cols-[300px_1fr] gap-6 p-6 sm:p-8">
              {/* Product photo 300x300 */}
              <div className="relative">
                <div
                  className="aspect-square rounded-xl flex items-center justify-center overflow-hidden vs-img-zoom shadow-md"
                  style={{ background: `linear-gradient(135deg, ${BLUE_LIGHT} 0%, ${GREEN_LIGHT} 100%)` }}
                >
                  {lot.product.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={lot.product.photoUrl} alt={lot.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-8xl">{lot.product.category?.icon || "📦"}</span>
                  )}
                </div>
                {isNew && !isRecalled && !expired && (
                  <div className="absolute -top-2 -right-2 px-3 py-1 rounded-full text-white text-xs font-bold shadow-lg" style={{ backgroundColor: GREEN }}>
                    <Sparkles className="size-3 mr-1 inline" />
                    Nouveau
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className="space-y-3">
                <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                  {lot.product.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Marque : <span className="font-semibold text-gray-900 dark:text-gray-100">{lot.product.brand}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Fabricant :{" "}
                  <span className="font-semibold" style={{ color: GREEN_DARK }}>
                    {lot.product.user.companyName}
                  </span>
                </p>
                {lot.product.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed pt-2 border-t border-gray-100 dark:border-gray-800">
                    {lot.product.description}
                  </p>
                )}

                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Badge variant="outline" className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                    {lot.product.category?.icon} {lot.product.category?.name}
                  </Badge>
                  {lot.product.weight && (
                    <Badge variant="outline" className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                      <Scale className="size-3 mr-1" />
                      {lot.product.weight}
                    </Badge>
                  )}
                  {isNew && !isRecalled && !expired && (
                    <Badge className="text-white" style={{ backgroundColor: GREEN }}>
                      <Sparkles className="size-3 mr-1" />
                      Nouveau
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* === 4. INFORMATIONS DE TRAÇABILITÉ — grille colorée === */}
        <Reveal>
          <div className="rounded-2xl bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 p-6 sm:p-8 shadow-md">
            <h2 className="font-display text-xl font-semibold mb-5 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Info className="size-5" style={{ color: BLUE }} />
              Informations de traçabilité
            </h2>

            {/* Numéro de lot — jaune clair */}
            <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: ORANGE_LIGHT }}>
              <div className="text-xs uppercase tracking-wide font-medium text-amber-800 mb-1">
                Numéro de lot
              </div>
              <code className="text-lg font-mono font-bold text-amber-900">{lot.lotNumber}</code>
            </div>

            {/* Dates — fabrication (vert) / péremption (orange) */}
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <ColorBlock
                icon={Calendar}
                label="Date de fabrication"
                value={formatDate(lot.manufacturingDate)}
                bg={GREEN_LIGHT}
                color={GREEN_DARK}
              />
              <ColorBlock
                icon={Calendar}
                label="Date de péremption"
                value={formatDate(lot.expirationDate)}
                bg={ORANGE_LIGHT}
                color={expired ? "#DC2626" : "#92400E"}
                bold={expired}
              />
            </div>

            {/* Lieux — fabrication (bleu) / transformation (vert) */}
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              {lot.manufacturingLocation && (
                <ColorBlock
                  icon={Factory}
                  label="Lieu de fabrication"
                  value={lot.manufacturingLocation}
                  bg={BLUE_LIGHT}
                  color={BLUE}
                />
              )}
              {lot.transformationLocation && (
                <ColorBlock
                  icon={MapPin}
                  label="Lieu de transformation"
                  value={lot.transformationLocation}
                  bg={GREEN_LIGHT}
                  color={GREEN_DARK}
                />
              )}
            </div>

            {/* Pays de vente — jaune */}
            {lot.salesCountries && (
              <ColorBlock
                icon={Globe2}
                label="Pays de vente"
                value={lot.salesCountries}
                bg={ORANGE_LIGHT}
                color="#92400E"
                full
              />
            )}

            {/* Ingrédients */}
            {lot.ingredients && (
              <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Leaf className="size-5" style={{ color: GREEN }} />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Ingrédients</h3>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {lot.ingredients}
                </p>
              </div>
            )}
          </div>
        </Reveal>

        {/* === 5. HISTORIQUE DU LOT — Timeline améliorée === */}
        <Reveal>
          <div className="rounded-2xl bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 p-6 sm:p-8 shadow-md">
            <h2 className="font-display text-xl font-semibold mb-5 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Clock className="size-5" style={{ color: BLUE }} />
              Historique du lot
            </h2>
            <Timeline items={buildTimeline(lot)} />
          </div>
        </Reveal>

        {/* === ANOMALIES (si présentes) === */}
        {lot.anomalies && lot.anomalies.length > 0 && (
          <Reveal>
            <div className="rounded-2xl bg-white border-2 border-red-200 dark:bg-gray-900 dark:border-red-900/60 p-6 sm:p-8 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <AlertTriangle className="size-5 text-red-600" />
                  Anomalies détectées
                </h2>
                <Badge className="bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 hover:bg-red-100">
                  {lot.anomalies.filter((a) => a.status === "open").length} ouverte(s) ·{" "}
                  {lot.anomalies.length} au total
                </Badge>
              </div>
              <div className="space-y-2">
                {lot.anomalies.map((a) => {
                  const sev = a.severity === "critical" ? "red" : a.severity === "warning" ? "amber" : "blue";
                  const sevClasses = {
                    red: "border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900",
                    amber: "border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900",
                    blue: "border-blue-200 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-900",
                  };
                  const sevIcon = {
                    red: <XCircle className="size-4 text-red-600" />,
                    amber: <AlertTriangle className="size-4 text-amber-600" />,
                    blue: <Info className="size-4 text-blue-600" />,
                  };
                  const typeLabels: Record<string, string> = {
                    allergen: "Allergène",
                    dlc: "Date de péremption",
                    counterfeit: "Contrefaçon",
                    ingredient: "Ingrédient",
                    cert_expiring: "Certification expirant",
                  };
                  return (
                    <div key={a.id} className={`rounded-lg border p-3 flex items-start gap-3 ${sevClasses[sev]}`}>
                      <div className="flex-shrink-0 mt-0.5">{sevIcon[sev]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] border-current">
                            {typeLabels[a.type] || a.type}
                          </Badge>
                          {a.status === "open" ? (
                            <Badge className="bg-red-600 hover:bg-red-700 text-white text-[10px]">Ouverte</Badge>
                          ) : a.status === "resolved" ? (
                            <Badge className="text-white text-[10px]" style={{ backgroundColor: GREEN }}>Résolue</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Ignorée</Badge>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formatRelative(a.detectedAt)}</span>
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">{a.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 italic">
                Ces anomalies sont détectées automatiquement par le module IA VerifScan à partir
                des données du lot, des ingrédients et des signaux du marché. En cas de doute,
                contactez le fabricant.
              </p>
            </div>
          </Reveal>
        )}

        {/* === 6. CERTIFICATIONS & QUALITÉ === */}
        <Reveal>
          <div className="rounded-2xl bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 p-6 sm:p-8 shadow-md">
            <h2 className="font-display text-xl font-semibold mb-5 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Award className="size-5" style={{ color: GREEN }} />
              Certifications & Qualité
            </h2>
            {lot.certifications.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Aucune certification enregistrée pour ce fabricant.
              </p>
            ) : (
              <div className="grid sm:grid-cols-3 gap-3">
                {lot.certifications.map((cert) => {
                  const meta = getCertificationMeta(cert.type);
                  return (
                    <div
                      key={cert.id}
                      className={cn(
                        "rounded-xl border-2 p-4 text-center transition-all hover:shadow-md hover:-translate-y-1",
                        CERT_TONE_CLASSES[meta.tone]
                      )}
                    >
                      <div className="text-5xl mb-2">{meta.icon}</div>
                      <p className="font-display font-bold text-lg">{meta.label}</p>
                      {cert.verified && (
                        <Badge className="text-white text-[10px] mt-1" style={{ backgroundColor: GREEN }}>
                          <CheckCircle2 className="size-3 mr-0.5" /> Vérifié
                        </Badge>
                      )}
                      <p className="text-xs opacity-80 mt-2">{meta.description}</p>
                      <p className="text-[10px] mt-1 opacity-70">Émetteur : {cert.issuer}</p>
                      {cert.expiresAt && (
                        <p className="text-[10px] mt-0.5 opacity-70">Expire le {formatDate(cert.expiresAt)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Reveal>

        {/* === 7. ALLERGÈNES & INFOS SANITAIRES === */}
        <Reveal>
          <div
            className="rounded-2xl p-6 sm:p-8 shadow-md"
            style={{ backgroundColor: ORANGE_LIGHT, border: `2px solid ${ORANGE}` }}
          >
            <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: "#92400E" }}>
              <AlertTriangle className="size-5" />
              Allergènes & Informations sanitaires
            </h2>
            {allergens.length > 0 ? (
              <>
                <p className="text-sm text-amber-900 mb-3">
                  Ce produit contient ou peut contenir les allergènes suivants :
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {allergens.map((a) => (
                    <span
                      key={a.key}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium",
                        ALLERGEN_TONE_CLASSES[a.tone]
                      )}
                    >
                      <span>{a.icon}</span>
                      {a.label}
                    </span>
                  ))}
                </div>
                <div className="rounded-lg bg-white/60 p-3 text-xs" style={{ color: "#92400E" }}>
                  <p className="font-medium mb-1">⚠️ Avertissement sanitaire</p>
                  <p>
                    Les personnes souffrant d&apos;allergies ou d&apos;intolérances alimentaires
                    doivent consulter la liste complète des ingrédients ci-dessus. En cas de
                    doute, contactez le fabricant avant consommation.
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm" style={{ color: "#92400E" }}>
                Aucun allergène majeur détecté dans les ingrédients renseignés. Les informations
                nutritionnelles détaillées ne sont pas disponibles pour ce produit.
              </p>
            )}
          </div>
        </Reveal>

        {/* === 8. QR CODE & CONTACT === */}
        <div className="grid sm:grid-cols-2 gap-4">
          {lot.qrCodes[0]?.qrCodeImageUrl && (
            <Reveal>
              <div className="rounded-2xl bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 p-6 sm:p-8 text-center shadow-md h-full">
                <h3 className="font-display font-semibold mb-4 flex items-center justify-center gap-2 text-gray-900 dark:text-gray-100">
                  <QrCode className="size-5" style={{ color: BLUE }} />
                  QR code officiel
                </h3>
                <div className="inline-block p-3 bg-white rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={lot.qrCodes[0].qrCodeImageUrl}
                    alt="QR code"
                    className="w-40 h-40"
                  />
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Scannez ce code pour vérifier l&apos;authenticité à tout moment
                </p>
              </div>
            </Reveal>
          )}

          <Reveal>
            <div className="rounded-2xl bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 p-6 sm:p-8 shadow-md h-full">
              <h3 className="font-display font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Phone className="size-5" style={{ color: GREEN }} />
                Contacter le fabricant
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Une question sur ce produit ? Contactez directement{" "}
                <span className="font-semibold" style={{ color: GREEN_DARK }}>
                  {lot.product.user.companyName}
                </span>.
              </p>
              <div className="space-y-2">
                {lot.product.user.whatsapp && (
                  <Button asChild className="w-full text-white" style={{ backgroundColor: "#25D366" }}>
                    <a
                      href={`https://wa.me/${lot.product.user.whatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 size-4" />
                      WhatsApp
                    </a>
                  </Button>
                )}
                {lot.product.user.phone && (
                  <Button asChild variant="outline" className="w-full" style={{ borderColor: GREEN, color: GREEN_DARK }}>
                    <a href={`tel:${lot.product.user.phone}`}>
                      <Phone className="mr-2 size-4" />
                      {lot.product.user.phone}
                    </a>
                  </Button>
                )}
                {lot.product.user.emailContact && (
                  <Button asChild variant="outline" className="w-full" style={{ borderColor: BLUE, color: BLUE }}>
                    <a href={`mailto:${lot.product.user.emailContact}`}>
                      <Mail className="mr-2 size-4" />
                      Email
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </Reveal>
        </div>

        {/* === 9. AVIS & NOTES === */}
        <Reveal>
          <div className="rounded-2xl bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 p-6 sm:p-8 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Star className="size-5 text-amber-500" />
                Avis & Notes
              </h2>
              {lot.reviewAggregates.count > 0 && (
                <Badge variant="outline" className="border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400">
                  {lot.reviewAggregates.count} avis
                </Badge>
              )}
            </div>
            {lot.reviewAggregates.count === 0 ? (
              <div className="text-center py-8">
                <ThumbsUp className="mx-auto size-12 text-gray-300 dark:text-gray-700" />
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Aucun avis pour le moment. Soyez le premier à partager votre expérience avec ce
                  fabricant.
                </p>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-[180px_1fr] gap-6 mb-5">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-amber-500">
                      {lot.reviewAggregates.overall.toFixed(1)}
                    </div>
                    <div className="flex justify-center mt-2">
                      {starArray(lot.reviewAggregates.overall).map((filled, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-5 vs-star-pop",
                            filled ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-gray-700"
                          )}
                          style={{ animationDelay: `${i * 60}ms` }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Basé sur {lot.reviewAggregates.count} avis
                    </p>
                  </div>
                  <div className="space-y-3">
                    <RatingBar label="Fiabilité" value={lot.reviewAggregates.reliability} />
                    <RatingBar label="Qualité" value={lot.reviewAggregates.quality} />
                    <RatingBar label="Professionnalisme" value={lot.reviewAggregates.professionalism} />
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  {lot.reviews.slice(0, 3).map((r) => {
                    const avg = (r.reliabilityScore + r.qualityScore + r.professionalismScore) / 3;
                    return (
                      <div key={r.id} className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {r.reviewer.companyName}
                          </p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(r.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {starArray(avg).map((filled, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "size-3",
                                filled ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-gray-700"
                              )}
                            />
                          ))}
                        </div>
                        {r.comment && (
                          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 italic">
                            &ldquo;{r.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </Reveal>

        {/* === SIMILAR PRODUCTS (bonus, kept for context) === */}
        {lot.similarProducts.length > 0 && (
          <Reveal>
            <div className="rounded-2xl bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 p-6 sm:p-8 shadow-md">
              <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Package className="size-5" style={{ color: BLUE }} />
                Produits similaires
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {lot.similarProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={p.lotId ? `/p/${p.lotId}` : `/produit/${p.id}`}
                    className="group rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all hover:-translate-y-1 bg-white dark:bg-gray-800/50"
                  >
                    <div
                      className="aspect-square flex items-center justify-center overflow-hidden vs-img-zoom"
                      style={{ background: `linear-gradient(135deg, ${BLUE_LIGHT} 0%, ${GREEN_LIGHT} 100%)` }}
                    >
                      {p.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">{p.category?.icon || "📦"}</span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.brand}</p>
                      <p className="text-xs mt-1 truncate" style={{ color: GREEN_DARK }}>
                        {p.user.companyName}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
        )}

        {/* === 10. BADGE FINAL — Vérifié par VerifScan === */}
        {!isRecalled && (
          <Reveal>
            <div
              className="rounded-2xl p-6 sm:p-8 text-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_DARK} 100%)` }}
            >
              <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-white/20 mb-3">
                <ShieldCheck className="size-8 text-white" />
              </div>
              <p className="font-display text-2xl font-bold text-white uppercase tracking-wide">
                Vérifié par VerifScan
              </p>
              <p className="mt-1 text-sm text-white/90">
                Lot authentique · Informations vérifiées et garanties par VerifScan
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setShareOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-sm font-semibold hover:bg-white/95 transition-colors"
                  style={{ color: GREEN_DARK }}
                >
                  <Share2 className="size-4" />
                  Partager
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/15 text-white text-sm font-semibold hover:bg-white/25 transition-colors"
                >
                  <MessageCircle className="size-4" />
                  WhatsApp
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/15 text-white text-sm font-semibold hover:bg-white/25 transition-colors"
                >
                  <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </a>
              </div>
              <Link
                href="/"
                className="inline-block mt-4 text-xs text-white/80 hover:text-white underline underline-offset-2"
              >
                En savoir plus sur VerifScan
              </Link>
            </div>
          </Reveal>
        )}

        {/* Blockchain certificate */}
        <Reveal>
          <BlockchainBadge lotId={lot.id} />
        </Reveal>

        {/* Footer note */}
        <p className="pt-2 text-center text-xs text-gray-400 dark:text-gray-500">
          Informations vérifiées et garanties par VerifScan ·{" "}
          <Link href="/" className="underline" style={{ color: GREEN_DARK }}>
            En savoir plus
          </Link>
        </p>
      </div>

      <ChatbotWidget productId={lot.product.id} />
    </PublicShell>
  );
}

/* ============ Sub-components ============ */

function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("vs-section-reveal", visible && "vs-revealed")}>
      {children}
    </div>
  );
}

/** Quick stat card — colored background (alternating blue / green) */
function QuickStat({
  icon: Icon,
  value,
  label,
  bg,
  bgLight,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  bg: string;
  bgLight: string;
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ backgroundColor: bgLight, border: `2px solid ${bg}30` }}
    >
      <div
        className="size-10 rounded-xl flex items-center justify-center text-white shadow-sm mb-2"
        style={{ backgroundColor: bg }}
      >
        <Icon className="size-5" />
      </div>
      <p className="text-lg font-bold leading-tight" style={{ color: bg }}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wide font-medium text-gray-600 dark:text-gray-300 mt-0.5">
        {label}
      </p>
    </div>
  );
}

/** Colored info block for traceability grid */
function ColorBlock({
  icon: Icon,
  label,
  value,
  bg,
  color,
  full = false,
  bold = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  bg: string;
  color: string;
  full?: boolean;
  bold?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl p-4 flex items-start gap-3 transition-all hover:shadow-md",
        full && "sm:col-span-2"
      )}
      style={{ backgroundColor: bg }}
    >
      <div
        className="flex-shrink-0 size-10 rounded-lg flex items-center justify-center text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide font-medium opacity-80" style={{ color }}>
          {label}
        </p>
        <p className={cn("text-sm mt-0.5", bold ? "font-bold" : "font-medium")} style={{ color }}>
          {value}
        </p>
      </div>
    </div>
  );
}

type TimelineItem = {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  date: string;
  tone: "green" | "blue" | "amber" | "red" | "violet";
  done: boolean;
};

function buildTimeline(lot: Lot): TimelineItem[] {
  const items: TimelineItem[] = [];

  items.push({
    icon: Factory,
    title: "Fabrication",
    subtitle: lot.manufacturingLocation || "Site de production",
    date: formatDate(lot.manufacturingDate),
    tone: "green",
    done: true,
  });

  items.push({
    icon: Microscope,
    title: "Contrôle qualité",
    subtitle: "Tests et vérification conformité",
    date: formatDate(lot.createdAt),
    tone: "violet",
    done: true,
  });

  items.push({
    icon: Box,
    title: "Mise sur le marché",
    subtitle: "Lot enregistré sur VerifScan",
    date: formatDateTime(lot.createdAt),
    tone: "blue",
    done: true,
  });

  if (lot.status === "recalled") {
    items.push({
      icon: XCircle,
      title: "Rappel produit",
      subtitle: lot.recallReason || "Rappelé par le fabricant",
      date: lot.recalledAt ? formatDateTime(lot.recalledAt) : "—",
      tone: "red",
      done: true,
    });
  } else if (isExpired(lot.expirationDate)) {
    items.push({
      icon: AlertTriangle,
      title: "Date de péremption dépassée",
      subtitle: "Ne plus consommer",
      date: formatDate(lot.expirationDate),
      tone: "red",
      done: true,
    });
  } else {
    items.push({
      icon: Clock,
      title: "Statut actuel : Actif",
      subtitle: `Péremption dans ${daysUntil(lot.expirationDate)} jours`,
      date: formatDate(lot.expirationDate),
      tone: "amber",
      done: false,
    });
  }

  return items;
}

function Timeline({ items }: { items: TimelineItem[] }) {
  const toneBg: Record<TimelineItem["tone"], string> = {
    green: GREEN,
    blue: BLUE,
    amber: ORANGE,
    red: "#DC2626",
    violet: "#8B5CF6",
  };
  const toneBgLight: Record<TimelineItem["tone"], string> = {
    green: GREEN_LIGHT,
    blue: BLUE_LIGHT,
    amber: ORANGE_LIGHT,
    red: "#FEE2E2",
    violet: "#F3E8FF",
  };
  return (
    <div className="relative pl-10">
      {/* Vertical connecting line */}
      <div
        className="absolute left-4 top-3 bottom-3 w-0.5"
        style={{ background: `linear-gradient(180deg, ${GREEN}, ${BLUE}, ${ORANGE})` }}
      />
      <div className="space-y-5">
        {items.map((item, i) => (
          <div key={i} className="relative">
            {/* Colored circle */}
            <div
              className="absolute -left-10 top-0 size-8 rounded-full flex items-center justify-center text-white shadow-md ring-4 ring-white dark:ring-gray-900"
              style={{ backgroundColor: toneBg[item.tone] }}
            >
              <item.icon className="size-4" />
            </div>
            {/* Card with colored background */}
            <div
              className="rounded-xl p-4 transition-all hover:shadow-md"
              style={{ backgroundColor: toneBgLight[item.tone] }}
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                {item.title}
                {!item.done && (
                  <span className="inline-flex items-center gap-1 text-xs font-normal" style={{ color: "#B45309" }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ORANGE }} />
                    En cours
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{item.subtitle}</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 font-medium">{item.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RatingBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, (value / 5) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-600 dark:text-gray-300">{label}</span>
        <span className="font-semibold text-gray-900 dark:text-gray-100">{value.toFixed(1)} / 5</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${BLUE}, ${GREEN})` }}
        />
      </div>
    </div>
  );
}

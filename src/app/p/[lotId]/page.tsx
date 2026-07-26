"use client";

import { useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
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
  Flame,
  Eye,
  ThumbsUp,
  Clock,
  Star,
  ChevronRight,
  Sparkles,
  Award,
  Microscope,
  Truck,
  Box,
  FileText,
  Share2,
} from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  // V4 enrichment fields
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
};

export default function PublicLotPage({ params }: { params: Promise<{ lotId: string }> }) {
  const { lotId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [lot, setLot] = useState<Lot | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { theme, toggle, mounted: themeMounted } = useDarkMode();

  // Record scan on mount (best-effort)
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

  // Print handler
  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  // Copy link handler
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

  // Loading state
  if (loading) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </PublicShell>
    );
  }

  if (notFound || !lot) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <AlertTriangle className="mx-auto size-12 text-amber-500" />
          <h1 className="mt-4 text-2xl font-bold">Produit introuvable</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Ce QR code ne correspond à aucun produit enregistré. Il peut s&apos;agir d&apos;une
            contrefaçon ou d&apos;un code expiré.
          </p>
          <Button asChild className="mt-6 bg-emerald-600 hover:bg-emerald-700">
            <Link href="/produits">Voir les produits authentiques</Link>
          </Button>
        </div>
      </PublicShell>
    );
  }

  const isRecalled = lot.status === "recalled";
  const expired = isExpired(lot.expirationDate);
  const remainingDays = daysUntil(lot.expirationDate);
  const isNew = daysUntil(lot.createdAt) > -7; // created within last 7 days
  const allergens = detectAllergens(lot.ingredients);
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `Découvrez ce produit vérifié sur VerifScan : ${lot.product.name} (${lot.product.brand})`;

  return (
    <PublicShell>
      {/* Top toolbar — sticky, hidden in print */}
      <div className="sticky top-16 z-30 vs-no-print bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-100 dark:border-gray-800">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-2">
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
              {themeMounted && theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
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
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">
                Partager :
              </span>
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
              <a
                href={`mailto:?subject=${encodeURIComponent(`Produit vérifié : ${lot.product.name}`)}&body=${encodeURIComponent(`${shareText}\n\n${currentUrl}`)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-600 text-white text-xs font-medium hover:bg-gray-700"
              >
                <Mail className="size-3.5" />
                Email
              </a>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copié !" : "Copier le lien"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Status banner */}
        {isRecalled ? (
          <Reveal>
            <div className="rounded-xl border-2 border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 p-4 flex items-start gap-3">
              <XCircle className="size-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-300">Produit rappelé</p>
                <p className="text-sm text-red-700 dark:text-red-400">
                  Ce lot a été rappelé par le fabricant. Il est déconseillé de le consommer.
                  Contactez le fabricant pour plus d&apos;informations.
                </p>
                {lot.recallReason && (
                  <p className="mt-2 text-xs text-red-700 dark:text-red-400 italic">
                    Motif : {lot.recallReason}
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        ) : expired ? (
          <Reveal>
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900 p-4 flex items-start gap-3">
              <AlertTriangle className="size-6 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-300">
                  Date de péremption dépassée
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  La date de péremption de ce lot est dépassée. Vérifiez auprès du fabricant.
                </p>
              </div>
            </div>
          </Reveal>
        ) : (
          <Reveal>
            <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-900 p-4 flex items-start gap-3">
              <CheckCircle2 className="size-6 text-emerald-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                  Produit authentique et vérifié
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  Ce produit a été authentifié par {lot.product.user.companyName}. Les informations
                  ci-dessous sont officielles et vérifiables.
                </p>
                {remainingDays > 0 && remainingDays <= 30 && (
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-400 font-medium">
                    ⏳ À consommer dans les {remainingDays} jours
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        )}

        {/* === Product header === */}
        <Reveal>
          <Card className="overflow-hidden vs-card-shadow border-emerald-100 dark:border-emerald-900/50 dark:bg-gray-900">
            <div className="grid sm:grid-cols-[240px_1fr] gap-4 p-4 sm:p-6">
              <div className="aspect-square rounded-xl bg-gradient-to-br from-emerald-100 to-amber-100 dark:from-emerald-900/40 dark:to-amber-900/40 flex items-center justify-center overflow-hidden vs-img-zoom">
                {lot.product.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={lot.product.photoUrl}
                    alt={lot.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-7xl">{lot.product.category?.icon || "📦"}</span>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400">
                    {lot.product.category?.icon} {lot.product.category?.name}
                  </Badge>
                  {lot.product.weight && (
                    <Badge variant="outline" className="border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400">
                      <Scale className="size-3 mr-1" />
                      {lot.product.weight}
                    </Badge>
                  )}
                  {isNew && !isRecalled && !expired && (
                    <Badge className="bg-rose-500 hover:bg-rose-600 text-white">
                      <Sparkles className="size-3 mr-1" />
                      Nouveau
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {lot.product.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Marque : <span className="font-semibold text-gray-900 dark:text-gray-100">{lot.product.brand}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Fabricant :{" "}
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {lot.product.user.companyName}
                  </span>
                </p>
                {lot.product.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed pt-2 border-t border-gray-100 dark:border-gray-800">
                    {lot.product.description}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </Reveal>

        {/* === Trust stats === */}
        <Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <TrustStat
              icon={Eye}
              value={lot.scanCount.toLocaleString("fr-FR")}
              label="Scans effectués"
              tone="blue"
            />
            <TrustStat
              icon={ShieldCheck}
              value="Vérifié"
              label="Par VerifScan"
              tone="emerald"
            />
            <TrustStat
              icon={Clock}
              value={formatRelative(lot.fabricantSince)}
              label="Fabricant inscrit"
              tone="amber"
            />
            <TrustStat
              icon={Award}
              value={lot.certifications.length.toString()}
              label="Certifications"
              tone="violet"
            />
          </div>
        </Reveal>

        {/* === Traceability === */}
        <Reveal>
          <Card className="vs-card-shadow border-emerald-100 dark:border-emerald-900/50 dark:bg-gray-900">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Info className="size-5 text-emerald-600" />
                Informations de traçabilité
              </h2>

              <div className="space-y-1 mb-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">Numéro de lot</div>
                <code className="text-sm font-mono bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-2 py-1 rounded">
                  {lot.lotNumber}
                </code>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <InfoRow icon={Calendar} label="Date de fabrication" value={formatDate(lot.manufacturingDate)} color="emerald" />
                <InfoRow
                  icon={Calendar}
                  label="Date de péremption"
                  value={formatDate(lot.expirationDate)}
                  color={expired ? "red" : "amber"}
                  valueClass={expired ? "text-red-600 font-semibold" : ""}
                />
                {lot.manufacturingLocation && (
                  <InfoRow icon={Factory} label="Lieu de fabrication" value={lot.manufacturingLocation} color="emerald" />
                )}
                {lot.transformationLocation && (
                  <InfoRow icon={MapPin} label="Lieu de transformation" value={lot.transformationLocation} color="emerald" />
                )}
                {lot.salesCountries && (
                  <InfoRow icon={Globe2} label="Pays de vente" value={lot.salesCountries} color="amber" full />
                )}
              </div>

              {lot.ingredients && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Leaf className="size-5 text-emerald-600" />
                    <h3 className="font-semibold">Ingrédients</h3>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {lot.ingredients}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </Reveal>

        {/* === Lot history timeline === */}
        <Reveal>
          <Card className="vs-card-shadow border-emerald-100 dark:border-emerald-900/50 dark:bg-gray-900">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                <Clock className="size-5 text-emerald-600" />
                Historique du lot
              </h2>
              <Timeline items={buildTimeline(lot)} />
            </CardContent>
          </Card>
        </Reveal>

        {/* === Certifications === */}
        <Reveal>
          <Card className="vs-card-shadow border-emerald-100 dark:border-emerald-900/50 dark:bg-gray-900">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Award className="size-5 text-emerald-600" />
                Certifications & Qualité
              </h2>
              {lot.certifications.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Aucune certification enregistrée pour ce fabricant.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {lot.certifications.map((cert) => {
                    const meta = getCertificationMeta(cert.type);
                    return (
                      <div
                        key={cert.id}
                        className={cn(
                          "rounded-xl border p-3 flex items-start gap-3 transition-shadow hover:shadow-md",
                          CERT_TONE_CLASSES[meta.tone]
                        )}
                      >
                        <div className="text-3xl flex-shrink-0">{meta.icon}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{meta.label}</p>
                            {cert.verified && (
                              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-1.5 py-0">
                                <CheckCircle2 className="size-3 mr-0.5" /> Vérifié
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs opacity-80 mt-0.5">{meta.description}</p>
                          <p className="text-xs mt-1 opacity-70">
                            Émetteur : {cert.issuer}
                          </p>
                          {cert.expiresAt && (
                            <p className="text-xs mt-0.5 opacity-70">
                              Expire le {formatDate(cert.expiresAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </Reveal>

        {/* === Allergens === */}
        <Reveal>
          <Card className="vs-card-shadow border-emerald-100 dark:border-emerald-900/50 dark:bg-gray-900">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-600" />
                Allergènes & Informations sanitaires
              </h2>
              {allergens.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
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
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-medium mb-1">⚠️ Avertissement sanitaire</p>
                    <p>
                      Les personnes souffrant d&apos;allergies ou d&apos;intolérances alimentaires
                      doivent consulter la liste complète des ingrédients ci-dessus. En cas de
                      doute, contactez le fabricant avant consommation.
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Aucun allergène majeur détecté dans les ingrédients renseignés. Les informations
                  nutritionnelles détaillées ne sont pas disponibles pour ce produit.
                </p>
              )}
            </CardContent>
          </Card>
        </Reveal>

        {/* === QR code + Contact === */}
        <div className="grid sm:grid-cols-2 gap-4">
          {lot.qrCodes[0]?.qrCodeImageUrl && (
            <Reveal>
              <Card className="vs-card-shadow border-emerald-100 dark:border-emerald-900/50 dark:bg-gray-900">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold mb-3 flex items-center justify-center gap-2">
                    <QrCode className="size-5 text-emerald-600" />
                    QR code officiel
                  </h3>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={lot.qrCodes[0].qrCodeImageUrl}
                    alt="QR code"
                    className="mx-auto w-40 h-40 rounded-lg border border-emerald-100 dark:border-emerald-900"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Scannez ce code pour vérifier l&apos;authenticité à tout moment
                  </p>
                </CardContent>
              </Card>
            </Reveal>
          )}

          <Reveal>
            <Card className="vs-card-shadow border-emerald-100 dark:border-emerald-900/50 dark:bg-gray-900">
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Phone className="size-5 text-emerald-600" />
                  Contacter le fabricant
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Une question sur ce produit ? Contactez directement {lot.product.user.companyName}.
                </p>
                <div className="space-y-2">
                  {lot.product.user.whatsapp && (
                    <Button asChild className="w-full bg-green-500 hover:bg-green-600 text-white">
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
                    <Button asChild variant="outline" className="w-full border-emerald-200 dark:border-emerald-800">
                      <a href={`tel:${lot.product.user.phone}`}>
                        <Phone className="mr-2 size-4" />
                        {lot.product.user.phone}
                      </a>
                    </Button>
                  )}
                  {lot.product.user.emailContact && (
                    <Button asChild variant="outline" className="w-full border-emerald-200 dark:border-emerald-800">
                      <a href={`mailto:${lot.product.user.emailContact}`}>
                        <Mail className="mr-2 size-4" />
                        Email
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>

        {/* === Reviews & ratings === */}
        <Reveal>
          <Card className="vs-card-shadow border-emerald-100 dark:border-emerald-900/50 dark:bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
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
                <div className="text-center py-6">
                  <ThumbsUp className="mx-auto size-10 text-gray-300 dark:text-gray-700" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Aucun avis pour le moment. Soyez le premier à partager votre expérience avec ce
                    fabricant.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-[160px_1fr] gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-amber-500">
                        {lot.reviewAggregates.overall.toFixed(1)}
                      </div>
                      <div className="flex justify-center mt-1">
                        {starArray(lot.reviewAggregates.overall).map((filled, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "size-4 vs-star-pop",
                              filled ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-gray-700"
                            )}
                            style={{ animationDelay: `${i * 60}ms` }}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Basé sur {lot.reviewAggregates.count} avis
                      </p>
                    </div>
                    <div className="space-y-2">
                      <RatingBar label="Fiabilité" value={lot.reviewAggregates.reliability} />
                      <RatingBar label="Qualité" value={lot.reviewAggregates.quality} />
                      <RatingBar label="Professionnalisme" value={lot.reviewAggregates.professionalism} />
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    {lot.reviews.slice(0, 3).map((r) => {
                      const avg = (r.reliabilityScore + r.qualityScore + r.professionalismScore) / 3;
                      return (
                        <div key={r.id} className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
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
            </CardContent>
          </Card>
        </Reveal>

        {/* === Similar products === */}
        {lot.similarProducts.length > 0 && (
          <Reveal>
            <Card className="vs-card-shadow border-emerald-100 dark:border-emerald-900/50 dark:bg-gray-900">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Package className="size-5 text-emerald-600" />
                  Produits similaires
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {lot.similarProducts.map((p) => (
                    <Link
                      key={p.id}
                      href={p.lotId ? `/p/${p.lotId}` : `/produit/${p.id}`}
                      className="group rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-gray-800/50"
                    >
                      <div className="aspect-square bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-950/40 dark:to-amber-950/40 flex items-center justify-center overflow-hidden vs-img-zoom">
                        {p.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl">{p.category?.icon || "📦"}</span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.brand}</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 truncate">
                          {p.user.companyName}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Reveal>
        )}

        {/* === Verified badge === */}
        {!isRecalled && (
          <Reveal>
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg">
                <ShieldCheck className="size-4" />
                <span className="text-sm font-semibold">Vérifié par VerifScan</span>
                <span className="text-xs opacity-80">· Lot authentique</span>
              </div>
            </div>
          </Reveal>
        )}

        {/* === Blockchain certificate === */}
        <Reveal>
          <BlockchainBadge lotId={lot.id} />
        </Reveal>

        {/* === Footer note === */}
        <p className="pt-2 text-center text-xs text-gray-400 dark:text-gray-500">
          Informations vérifiées et garanties par VerifScan ·{" "}
          <Link href="/" className="text-emerald-600 dark:text-emerald-400 hover:underline">
            En savoir plus
          </Link>
        </p>
      </div>

      <ChatbotWidget productId={lot.product.id} />
    </PublicShell>
  );
}

/* ============ Sub-components ============ */

/** Reveal wrapper — fades children in when they enter the viewport. */
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

function TrustStat({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  tone: "blue" | "emerald" | "amber" | "violet";
}) {
  const toneClasses = {
    blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900",
    emerald: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    amber: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
    violet: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-900",
  };
  return (
    <div className={cn("rounded-xl border p-3 text-center", toneClasses[tone])}>
      <Icon className="mx-auto size-5 mb-1" />
      <p className="text-lg font-bold leading-tight">{value}</p>
      <p className="text-[10px] opacity-80 uppercase tracking-wide">{label}</p>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  color = "emerald",
  full = false,
  valueClass = "",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: "emerald" | "amber" | "red";
  full?: boolean;
  valueClass?: string;
}) {
  const colorClasses = {
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };
  return (
    <div className={cn("flex items-start gap-3", full && "sm:col-span-2")}>
      <div className={cn("flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center", colorClasses[color])}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className={cn("text-sm font-medium text-gray-900 dark:text-gray-100", valueClass)}>{value}</p>
      </div>
    </div>
  );
}

type TimelineItem = {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  date: string;
  tone: "emerald" | "blue" | "amber" | "red" | "violet";
  done: boolean;
};

function buildTimeline(lot: Lot): TimelineItem[] {
  const items: TimelineItem[] = [];

  items.push({
    icon: Factory,
    title: "Fabrication",
    subtitle: lot.manufacturingLocation || "Site de production",
    date: formatDate(lot.manufacturingDate),
    tone: "emerald",
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
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    violet: "bg-violet-500",
  };
  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-2 bottom-2 w-0.5 vs-timeline-line" />
      <div className="space-y-5">
        {items.map((item, i) => (
          <div key={i} className="relative">
            <div
              className={cn(
                "absolute -left-7 top-0 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md ring-4 ring-white dark:ring-gray-900",
                toneBg[item.tone]
              )}
            >
              <item.icon className="size-3.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {item.title}
                {!item.done && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-normal">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    En cours
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.subtitle}</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{item.date}</p>
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
          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

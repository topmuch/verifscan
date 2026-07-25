"use client";

import { useEffect, useState, use } from "react";
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
} from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

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
    };
  };
  qrCodes: { id: string; qrCodeImageUrl: string | null }[];
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function isExpired(iso: string) {
  return new Date(iso).getTime() < Date.now();
}

export default function PublicLotPage({ params }: { params: Promise<{ lotId: string }> }) {
  const { lotId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");

  const [lot, setLot] = useState<Lot | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

        // Record scan
        if (data.qrCodes?.[0]?.id) {
          const ua = navigator.userAgent;
          const isMobile = /Mobile|Android|iPhone/i.test(ua);
          // Try to get location via ipapi (best-effort, no PII)
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
      } catch (err) {
        setLoading(false);
        setNotFound(true);
      }
    })();
  }, [lotId]);

  // If a product ID is in URL but no lot, show product info instead
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
          <p className="mt-2 text-gray-600">
            Ce QR code ne correspond à aucun produit enregistré. Il peut s'agir d'une
            contrefaçon ou d'un code expiré.
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

  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4 text-gray-500"
        >
          <ArrowLeft className="mr-2 size-4" />
          Retour
        </Button>

        {/* Status banner */}
        {isRecalled && (
          <div className="mb-4 rounded-xl border-2 border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <XCircle className="size-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">Produit rappelé</p>
              <p className="text-sm text-red-700">
                Ce lot a été rappelé par le fabricant. Il est déconseillé de le consommer.
                Contactez le fabricant pour plus d'informations.
              </p>
            </div>
          </div>
        )}
        {!isRecalled && expired && (
          <div className="mb-4 rounded-xl border-2 border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <AlertTriangle className="size-6 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">Date de péremption dépassée</p>
              <p className="text-sm text-amber-700">
                La date de péremption de ce lot est dépassée. Vérifiez auprès du fabricant.
              </p>
            </div>
          </div>
        )}
        {!isRecalled && !expired && (
          <div className="mb-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
            <CheckCircle2 className="size-6 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-900">Produit authentique</p>
              <p className="text-sm text-emerald-700">
                Ce produit a été authentifié par {lot.product.user.companyName}. Les
                informations ci-dessous sont officielles et vérifiables.
              </p>
            </div>
          </div>
        )}

        {/* Product header */}
        <Card className="overflow-hidden vs-card-shadow border-emerald-100 mb-4">
          <div className="grid sm:grid-cols-[200px_1fr] gap-4 p-4 sm:p-6">
            <div className="aspect-square rounded-xl bg-gradient-to-br from-emerald-100 to-amber-100 flex items-center justify-center overflow-hidden">
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
                <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                  {lot.product.category?.icon} {lot.product.category?.name}
                </Badge>
                {lot.product.weight && (
                  <Badge variant="outline" className="border-amber-200 text-amber-700">
                    <Scale className="size-3 mr-1" />
                    {lot.product.weight}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {lot.product.name}
              </h1>
              <p className="text-gray-600">
                Marque : <span className="font-semibold text-gray-900">{lot.product.brand}</span>
              </p>
              <p className="text-sm text-gray-600">
                Fabricant :{" "}
                <span className="font-semibold text-emerald-700">
                  {lot.product.user.companyName}
                </span>
              </p>
              {lot.product.description && (
                <p className="text-sm text-gray-600 leading-relaxed pt-2 border-t border-gray-100">
                  {lot.product.description}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Traceability details */}
        <Card className="vs-card-shadow border-emerald-100 mb-4">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Info className="size-5 text-emerald-600" />
              Informations de traçabilité
            </h2>

            <div className="space-y-1 mb-4">
              <div className="text-xs text-gray-500">Numéro de lot</div>
              <code className="text-sm font-mono bg-emerald-50 text-emerald-800 px-2 py-1 rounded">
                {lot.lotNumber}
              </code>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <InfoRow
                icon={Calendar}
                label="Date de fabrication"
                value={formatDate(lot.manufacturingDate)}
                color="emerald"
              />
              <InfoRow
                icon={Calendar}
                label="Date de péremption"
                value={formatDate(lot.expirationDate)}
                color={expired ? "red" : "amber"}
                valueClass={expired ? "text-red-600 font-semibold" : ""}
              />
              {lot.manufacturingLocation && (
                <InfoRow
                  icon={Factory}
                  label="Lieu de fabrication"
                  value={lot.manufacturingLocation}
                  color="emerald"
                />
              )}
              {lot.transformationLocation && (
                <InfoRow
                  icon={MapPin}
                  label="Lieu de transformation"
                  value={lot.transformationLocation}
                  color="emerald"
                />
              )}
              {lot.salesCountries && (
                <InfoRow
                  icon={Globe2}
                  label="Pays de vente"
                  value={lot.salesCountries}
                  color="amber"
                  full
                />
              )}
            </div>

            {lot.ingredients && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Leaf className="size-5 text-emerald-600" />
                  <h3 className="font-semibold">Ingrédients</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{lot.ingredients}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR code + Contact */}
        <div className="grid sm:grid-cols-2 gap-4">
          {lot.qrCodes[0]?.qrCodeImageUrl && (
            <Card className="vs-card-shadow border-emerald-100">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold mb-3 flex items-center justify-center gap-2">
                  <QrCode className="size-5 text-emerald-600" />
                  QR code officiel
                </h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lot.qrCodes[0].qrCodeImageUrl}
                  alt="QR code"
                  className="mx-auto w-40 h-40 rounded-lg border border-emerald-100"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Scannez ce code pour vérifier l'authenticité
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="vs-card-shadow border-emerald-100">
            <CardContent className="p-6 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Phone className="size-5 text-emerald-600" />
                Contacter le fabricant
              </h3>
              <p className="text-sm text-gray-600">
                Une question sur ce produit ? Contactez directement {lot.product.user.companyName}.
              </p>
              <div className="space-y-2">
                {lot.product.user.whatsapp && (
                  <Button
                    asChild
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                  >
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
                  <Button asChild variant="outline" className="w-full border-emerald-200">
                    <a href={`tel:${lot.product.user.phone}`}>
                      <Phone className="mr-2 size-4" />
                      {lot.product.user.phone}
                    </a>
                  </Button>
                )}
                {lot.product.user.emailContact && (
                  <Button asChild variant="outline" className="w-full border-emerald-200">
                    <a href={`mailto:${lot.product.user.emailContact}`}>
                      <Mail className="mr-2 size-4" />
                      Email
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Verified badge V2 */}
        {!isRecalled && (
          <div className="mt-4 flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg">
              <ShieldCheck className="size-4" />
              <span className="text-sm font-semibold">Vérifié par VerifScan</span>
              <span className="text-xs opacity-80">· Lot authentique</span>
            </div>
          </div>
        )}

        {/* Social share V2 */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Découvrez ce produit vérifié sur VerifScan : ${lot.product.name} (${lot.product.brand})`)}&_url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <MessageCircle className="size-3.5" />
            WhatsApp
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1877F2] text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <svg className="size-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook
          </a>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Informations vérifiées et garanties par VerifScan ·{" "}
          <Link href="/" className="text-emerald-600 hover:underline">
            En savoir plus
          </Link>
        </p>
      </div>
    </PublicShell>
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
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <div className={`flex items-start gap-3 ${full ? "sm:col-span-2" : ""}`}>
      <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-medium text-gray-900 ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

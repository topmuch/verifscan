import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Globe,
  Package,
  Award,
  CheckCircle2,
  Calendar,
  Building2,
  Eye,
  ExternalLink,
  ShieldCheck,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Leaf,
} from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";

const BLUE = "#0f4382";
const GREEN = "#2ebd5a";
const GREEN_DARK = "#065f46";

export const metadata = {
  title: "Fiche producteur — VerifScan",
  description:
    "Découvrez le producteur, ses produits, ses certifications et son histoire.",
};

/* ============================================================ */
/* Cert type metadata (mirrors ExportProduceView.certMeta)       */
/* ============================================================ */
function certMeta(type: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    phytosanitaire: { label: "Phytosanitaire", color: "#0f4382" },
    globalgap: { label: "GlobalG.A.P.", color: "#2ebd5a" },
    bio: { label: "Agriculture Biologique", color: "#16a34a" },
    haccp: { label: "HACCP", color: "#F59E0B" },
    iso: { label: "ISO", color: "#0ea5e9" },
    origine: { label: "Certificat d'origine", color: "#7c3aed" },
    fda: { label: "FDA", color: "#dc2626" },
    halal: { label: "Halal", color: "#16a34a" },
    iso22000: { label: "ISO 22000", color: "#0ea5e9" },
    nsf: { label: "NSF", color: "#7c3aed" },
    cedeao: { label: "CEDEAO", color: "#F59E0B" },
  };
  return map[type.toLowerCase()] ?? { label: type, color: "#6b7280" };
}

function formatDate(iso: string | Date | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

/* ============================================================ */
/* Page                                                          */
/* ============================================================ */
export default async function ProducerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const producer = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      companyName: true,
      logoUrl: true,
      phone: true,
      whatsapp: true,
      emailContact: true,
      address: true,
      socialFacebook: true,
      socialTwitter: true,
      socialLinkedin: true,
      socialInstagram: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!producer || !producer.isActive || producer.role !== "fabricant") {
    notFound();
  }

  // Parallel queries
  const [products, certifications, lotsAgg, scansAgg] = await Promise.all([
    db.product.findMany({
      where: { userId: id, isVisible: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        brand: true,
        photoUrl: true,
        weight: true,
        description: true,
        variety: true,
        regionOfProduction: true,
        category: {
          select: { id: true, name: true, icon: true, pageTemplate: true },
        },
        lots: {
          where: { status: "active" },
          select: { id: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    db.certification.findMany({
      where: { fabricantId: id },
      orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        type: true,
        issuer: true,
        certificateNumber: true,
        issuedAt: true,
        expiresAt: true,
        verified: true,
        documentUrl: true,
      },
    }),
    db.lot.aggregate({
      where: { product: { userId: id } },
      _count: { _all: true },
    }),
    db.scan.aggregate({
      where: { qrCode: { lot: { product: { userId: id } } } },
      _count: { _all: true },
    }),
  ]);

  const verifiedCerts = certifications.filter((c) => c.verified);
  const totalCerts = certifications.length;

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Back link */}
        <Button asChild variant="ghost" size="sm" className="mb-4 text-gray-500">
          <Link href="/produits">
            <ArrowLeft className="mr-2 size-4" />
            Retour au répertoire
          </Link>
        </Button>

        {/* ============================================================ */}
        {/* HERO HEADER                                                   */}
        {/* ============================================================ */}
        <section className="rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-white">
          <div
            className="h-28 sm:h-36"
            style={{
              background: `linear-gradient(135deg, ${BLUE} 0%, ${GREEN} 100%)`,
            }}
          />
          <div className="p-6 sm:p-8 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16">
              {/* Logo */}
              <div className="size-24 sm:size-28 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {producer.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={producer.logoUrl}
                    alt={producer.companyName ?? "Logo producteur"}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <Building2 className="size-10 text-gray-300" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className="uppercase text-xs font-semibold"
                    style={{ color: GREEN_DARK, borderColor: GREEN }}
                  >
                    <CheckCircle2 className="size-3 mr-1" />
                    Producteur vérifié
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Membre depuis {formatDate(producer.createdAt)}
                  </span>
                </div>
                <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
                  {producer.companyName}
                </h1>
                {producer.address && (
                  <p className="mt-1 text-sm text-gray-600 flex items-center gap-1.5">
                    <MapPin className="size-4 text-gray-400" />
                    {producer.address}
                  </p>
                )}
              </div>
            </div>

            {/* Stats banner */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Produits" value={products.length} icon={Package} color={BLUE} />
              <StatCard label="Lots créés" value={lotsAgg._count._all} icon={Package} color={GREEN} />
              <StatCard label="Scans cumulés" value={scansAgg._count._all} icon={Eye} color={GREEN_DARK} />
              <StatCard
                label="Certifs. vérifiées"
                value={`${verifiedCerts.length}/${totalCerts}`}
                icon={ShieldCheck}
                color="#7c3aed"
              />
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* CONTACT CTA                                                   */}
        {/* ============================================================ */}
        {(producer.whatsapp || producer.phone || producer.emailContact) && (
          <section className="mt-6 rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <div className="flex-1">
                <h2 className="font-display text-lg font-semibold" style={{ color: BLUE }}>
                  Contacter ce producteur
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Intéressé par ses produits ? Échangez directement avec lui via WhatsApp, téléphone ou email.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
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
            </div>

            {/* Social links */}
            {(producer.socialFacebook ||
              producer.socialTwitter ||
              producer.socialLinkedin ||
              producer.socialInstagram) && (
              <div className="mt-3 pt-3 border-t border-blue-100 flex items-center gap-3 flex-wrap text-sm">
                <span className="text-gray-600 font-medium">Suivez-nous :</span>
                {producer.socialFacebook && (
                  <SocialLink href={producer.socialFacebook} icon={Facebook} label="Facebook" />
                )}
                {producer.socialTwitter && (
                  <SocialLink href={producer.socialTwitter} icon={Twitter} label="Twitter / X" />
                )}
                {producer.socialLinkedin && (
                  <SocialLink href={producer.socialLinkedin} icon={Linkedin} label="LinkedIn" />
                )}
                {producer.socialInstagram && (
                  <SocialLink href={producer.socialInstagram} icon={Instagram} label="Instagram" />
                )}
              </div>
            )}
          </section>
        )}

        {/* ============================================================ */}
        {/* PRODUCTS GRID                                                 */}
        {/* ============================================================ */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold tracking-tight" style={{ color: BLUE }}>
              Produits ({products.length})
            </h2>
            <Badge variant="outline" className="text-gray-600">
              {products.filter((p) => p.lots.length > 0).length} disponible{products.filter((p) => p.lots.length > 0).length > 1 ? "s" : ""}
            </Badge>
          </div>

          {products.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="size-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Ce producteur n&apos;a pas encore de produit public.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => {
                const lotId = p.lots[0]?.id;
                const href = lotId ? `/p/${lotId}` : `/produit/${p.id}`;
                return (
                  <Link
                    key={p.id}
                    href={href}
                    className="group rounded-xl overflow-hidden bg-white border border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <div
                      className="aspect-square relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${BLUE} 0%, ${GREEN} 100%)`,
                      }}
                    >
                      {p.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.photoUrl}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-6xl">{p.category.icon || "📦"}</span>
                        </div>
                      )}
                      {p.category.pageTemplate === "export_produce" && (
                        <span
                          className="absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] font-bold uppercase text-white shadow"
                          style={{ backgroundColor: GREEN }}
                        >
                          Export
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <span>{p.category.icon}</span>
                        <span>{p.category.name}</span>
                      </div>
                      <p className="font-semibold text-gray-900 line-clamp-1">{p.name}</p>
                      <p className="text-sm text-gray-600">
                        Marque : <span className="font-medium" style={{ color: GREEN_DARK }}>{p.brand}</span>
                      </p>
                      {p.variety && (
                        <p className="text-xs text-gray-500 mt-1">Variété : {p.variety}</p>
                      )}
                      {p.regionOfProduction && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="size-3" />
                          {p.regionOfProduction}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        {p.weight && (
                          <Badge variant="outline" className="font-mono">
                            {p.weight}
                          </Badge>
                        )}
                        {p.lots.length > 0 ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            <CheckCircle2 className="size-3 mr-1" />
                            Disponible
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Indisponible
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* CERTIFICATIONS                                                */}
        {/* ============================================================ */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold tracking-tight" style={{ color: BLUE }}>
              Certifications & Documents ({certifications.length})
            </h2>
          </div>

          {certifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="size-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  Aucune certification n&apos;a encore été ajoutée par ce producteur.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {certifications.map((c) => {
                const meta = certMeta(c.type);
                const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                return (
                  <div
                    key={c.id}
                    className="rounded-xl border border-gray-200 p-4 bg-white hover:shadow-md transition-shadow"
                    style={{ borderLeftWidth: "4px", borderLeftColor: meta.color }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm" style={{ color: meta.color }}>
                            {meta.label}
                          </p>
                          {c.verified ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px]">
                              <CheckCircle2 className="size-3 mr-1" />
                              Vérifié
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px]">
                              En attente
                            </Badge>
                          )}
                          {isExpired && (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px]">
                              Expiré
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{c.issuer}</p>
                        {c.certificateNumber && (
                          <p className="text-xs text-gray-500 font-mono mt-0.5">
                            N° : {c.certificateNumber}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          {c.issuedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              {formatDate(c.issuedAt)}
                            </span>
                          )}
                          {c.expiresAt && (
                            <span
                              className={`flex items-center gap-1 ${
                                isExpired ? "text-red-600 font-medium" : ""
                              }`}
                            >
                              <Calendar className="size-3" />
                              → {formatDate(c.expiresAt)}
                            </span>
                          )}
                        </div>
                        {c.documentUrl && (
                          <a
                            href={c.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium mt-2 hover:underline"
                            style={{ color: meta.color }}
                          >
                            <ExternalLink className="size-3" />
                            Voir le PDF
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* FOOTER NOTE                                                   */}
        {/* ============================================================ */}
        <div className="mt-10 rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 p-5 flex items-start gap-3">
          <Leaf className="size-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-semibold" style={{ color: BLUE }}>
              Producteur vérifié par VerifScan
            </p>
            <p className="mt-1">
              Chaque produit de ce producteur est traçable par QR code. Scannez le code sur l&apos;emballage
              pour accéder à la fiche complète : origine, dates de récolte, certifications, contrôle qualité
              et coordonnées du producteur.
            </p>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}

/* ============================================================ */
/* Sub-components                                                 */
/* ============================================================ */

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: typeof Package;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-4 border"
      style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}
    >
      <div className="flex items-center justify-between">
        <Icon className="size-5" style={{ color }} />
        <span
          className="font-display text-2xl font-bold"
          style={{ color }}
        >
          {value}
        </span>
      </div>
      <p className="mt-1 text-xs uppercase tracking-wide font-medium text-gray-600">
        {label}
      </p>
    </div>
  );
}

function SocialLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Globe;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-gray-700 hover:text-blue-600 transition-colors"
    >
      <Icon className="size-4" />
      <span className="text-xs">{label}</span>
    </a>
  );
}

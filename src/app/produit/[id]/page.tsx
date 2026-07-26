import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package, QrCode, MapPin, Scale, Factory } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";

export default async function ProduitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: true,
      user: {
        select: {
          id: true,
          companyName: true,
          logoUrl: true,
          phone: true,
          whatsapp: true,
          emailContact: true,
          address: true,
        },
      },
      lots: {
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { qrCodes: true } } },
      },
    },
  });

  if (!product || !product.isVisible) {
    notFound();
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
        <Button asChild variant="ghost" size="sm" className="mb-4 text-gray-500">
          <Link href="/produits">
            <ArrowLeft className="mr-2 size-4" />
            Retour au répertoire
          </Link>
        </Button>

        <Card className="overflow-hidden vs-card-shadow border-emerald-100 mb-4">
          <div className="grid sm:grid-cols-[200px_1fr] gap-4 p-4 sm:p-6">
            <div className="aspect-square rounded-xl bg-gradient-to-br from-emerald-100 to-amber-100 flex items-center justify-center overflow-hidden">
              {product.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.photoUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-7xl">{product.category?.icon || "📦"}</span>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                  {product.category?.icon} {product.category?.name}
                </Badge>
                {product.weight && (
                  <Badge variant="outline" className="border-amber-200 text-amber-700">
                    <Scale className="size-3 mr-1" />
                    {product.weight}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {product.name}
              </h1>
              <p className="text-gray-600">
                Marque : <span className="font-semibold text-gray-900">{product.brand}</span>
              </p>
              <p className="text-sm text-gray-600">
                Fabricant :{" "}
                <span className="font-semibold text-emerald-700">
                  {product.user.companyName}
                </span>
              </p>
              {product.description && (
                <p className="text-sm text-gray-600 leading-relaxed pt-2 border-t border-gray-100">
                  {product.description}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="vs-card-shadow border-emerald-100">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <QrCode className="size-5 text-emerald-600" />
              Lots disponibles ({product.lots.length})
            </h2>

            {product.lots.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">
                Aucun lot actif pour ce produit pour le moment.
              </p>
            ) : (
              <div className="space-y-3">
                {product.lots.map((lot) => (
                  <Link
                    key={lot.id}
                    href={`/p/${lot.id}`}
                    className="block rounded-xl border border-emerald-100 p-4 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                            {lot.lotNumber}
                          </code>
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">
                            Actif
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Fabriqué le{" "}
                          <span className="font-medium text-gray-900">
                            {lot.manufacturingDate.toLocaleDateString("fr-FR")}
                          </span>
                          {" · "}
                          À consommer avant le{" "}
                          <span className="font-medium text-gray-900">
                            {lot.expirationDate.toLocaleDateString("fr-FR")}
                          </span>
                        </p>
                        {lot.manufacturingLocation && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Factory className="size-3" />
                            {lot.manufacturingLocation}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">{lot._count.qrCodes} QR code{lot._count.qrCodes > 1 ? "s" : ""}</div>
                        <div className="text-xs text-emerald-700 font-medium group-hover:underline">
                          Voir détails →
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-semibold mb-1">💡 Pour vérifier un produit spécifique</p>
          <p>
            Scannez le QR code apposé sur l'étiquette de votre produit avec votre smartphone.
            Vous serez automatiquement redirigé vers sa fiche d'authenticité.
          </p>
        </div>
      </div>
    </PublicShell>
  );
}

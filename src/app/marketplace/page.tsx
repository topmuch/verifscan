import { db } from "@/lib/db";
import { PublicShell } from "@/components/public-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, Search, Filter, Award, MapPin, Clock, Package } from "lucide-react";
import Link from "next/link";
import { MarketplaceFilters } from "./filters";
import { B2BQuoteButton } from "./quote-button";

async function getB2BProducts(filters: {
  categoryId?: string;
  search?: string;
  certification?: string;
  region?: string;
}) {
  const where: any = {
    isB2BVisible: true,
    product: {
      isVisible: true,
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.search ? { name: { contains: filters.search } } : {}),
    },
  };

  const products = await db.b2BProduct.findMany({
    where,
    include: {
      product: {
        include: {
          user: {
            select: {
              id: true,
              companyName: true,
              address: true,
              logoUrl: true,
            },
          },
          category: { select: { name: true, icon: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  // Si filtre certification, on filtre post-query
  let filtered = products;
  if (filters.certification) {
    const fabricantIds = products.map((p) => p.product.user.id);
    const certifiedFabricants = await db.certification.findMany({
      where: {
        fabricantId: { in: fabricantIds },
        type: filters.certification,
        verified: true,
      },
      select: { fabricantId: true },
    });
    const validIds = new Set(certifiedFabricants.map((c) => c.fabricantId));
    filtered = products.filter((p) => validIds.has(p.product.user.id));
  }
  if (filters.region) {
    filtered = filtered.filter((p) =>
      (p.product.user.address || "").toLowerCase().includes(filters.region!.toLowerCase())
    );
  }

  return filtered;
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filters = {
    categoryId: typeof params.categoryId === "string" ? params.categoryId : undefined,
    search: typeof params.search === "string" ? params.search : undefined,
    certification: typeof params.certification === "string" ? params.certification : undefined,
    region: typeof params.region === "string" ? params.region : undefined,
  };

  const [products, categories] = await Promise.all([
    getB2BProducts(filters),
    db.category.findMany({ where: { isActive: true } }),
  ]);

  return (
    <PublicShell>
      <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-emerald-50/30">
        {/* Hero */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
            <div className="flex items-center gap-3 mb-3">
              <Store className="size-8" />
              <h1 className="text-2xl md:text-4xl font-bold">Marketplace B2B VerifScan</h1>
              <Badge className="bg-white/20 text-white hover:bg-white/20">V3</Badge>
            </div>
            <p className="text-orange-50 text-sm md:text-base max-w-2xl">
              Connectez-vous directement avec les fabricants vérifiés d'Afrique de l'Ouest.
              Demandez des devis en un clic, commandez en gros, et bénéficiez d'une traçabilité blockchain complète.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3">
                <Package className="size-4 text-orange-500 mb-1" />
                <p className="text-xs text-gray-500">Produits B2B</p>
                <p className="text-xl font-bold">{products.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <Award className="size-4 text-emerald-500 mb-1" />
                <p className="text-xs text-gray-500">Fabricants vérifiés</p>
                <p className="text-xl font-bold">{new Set(products.map((p) => p.product.user.id)).size}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <MapPin className="size-4 text-blue-500 mb-1" />
                <p className="text-xs text-gray-500">Régions couvertes</p>
                <p className="text-xl font-bold">{new Set(products.map((p) => p.product.user.address).filter(Boolean)).size}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <Clock className="size-4 text-purple-500 mb-1" />
                <p className="text-xs text-gray-500">Délai moyen</p>
                <p className="text-xl font-bold">
                  {products.length > 0
                    ? Math.round(products.reduce((s, p) => s + p.leadTimeDays, 0) / products.length)
                    : 0}{" "}
                  jours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <MarketplaceFilters categories={categories} currentFilters={filters} />

          {/* Results */}
          {products.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="size-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Aucun produit B2B ne correspond à vos filtres.</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/marketplace">Réinitialiser les filtres</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => {
                const tiers = p.distributorPriceTiers ? JSON.parse(p.distributorPriceTiers) : [];
                const minPrice = tiers.length > 0 ? Math.min(...tiers.map((t: any) => t.price)) : null;
                return (
                  <Card key={p.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {p.product.user.logoUrl && (
                      <div className="aspect-video bg-gray-100 overflow-hidden">
                        <img
                          src={p.product.user.logoUrl}
                          alt={`${p.product.user.companyName} logo`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">{p.product.category.name}</Badge>
                          {p.product.user.address && (
                            <Badge variant="outline" className="text-xs text-gray-500">
                              <MapPin className="size-2.5 mr-1" />{p.product.user.address.split(",")[0]}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-bold text-base">{p.product.name}</h3>
                        <p className="text-xs text-gray-500">{p.product.brand} · par {p.product.user.companyName}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-gray-50">
                          <p className="text-gray-500">MOQ</p>
                          <p className="font-bold text-sm">{p.moq} unités</p>
                        </div>
                        <div className="p-2 rounded bg-gray-50">
                          <p className="text-gray-500">Délai</p>
                          <p className="font-bold text-sm">{p.leadTimeDays}j</p>
                        </div>
                        {minPrice && (
                          <div className="p-2 rounded bg-emerald-50 col-span-2">
                            <p className="text-gray-500">À partir de</p>
                            <p className="font-bold text-emerald-700">{minPrice.toLocaleString("fr-FR")} FCFA/unité</p>
                          </div>
                        )}
                        {p.monthlyCapacity && (
                          <div className="p-2 rounded bg-blue-50 col-span-2">
                            <p className="text-gray-500">Capacité mensuelle</p>
                            <p className="font-bold text-blue-700">{p.monthlyCapacity.toLocaleString("fr-FR")} unités</p>
                          </div>
                        )}
                      </div>

                      {p.paymentTerms && (
                        <p className="text-xs text-gray-500 italic">Paiement : {p.paymentTerms}</p>
                      )}

                      <div className="flex gap-2 pt-1">
                        <B2BQuoteButton
                          fabricantId={p.product.user.id}
                          productName={p.product.name}
                        />
                        <Button asChild size="sm" variant="outline" className="flex-1">
                          <Link href={`/produit/${p.product.id}`}>
                            Détails
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PublicShell>
  );
}

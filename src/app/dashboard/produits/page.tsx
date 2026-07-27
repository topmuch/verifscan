import Link from "next/link";
import { Plus, Package, Edit, Eye, EyeOff, Trash2, Upload } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteProductButton } from "./delete-product-button";

export default async function DashboardProduitsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const products = await db.product.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true, icon: true } },
      _count: { select: { lots: true } },
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mes produits</h1>
          <p className="mt-1 text-gray-600">
            Gérez votre catalogue de produits traçables.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/produits/importer">
              <Upload className="mr-2 size-4" />
              Importer (CSV/Excel)
            </Link>
          </Button>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/dashboard/produits/nouveau">
              <Plus className="mr-2 size-4" />
              Nouveau produit
            </Link>
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <Card className="vs-card-shadow border-emerald-100">
          <CardContent className="p-12 text-center">
            <Package className="mx-auto size-12 text-emerald-200" />
            <h3 className="mt-4 font-semibold text-lg">Aucun produit pour le moment</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
              Créez votre premier produit pour commencer à générer des QR codes et offrir
              la traçabilité à vos clients.
            </p>
            <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-700">
              <Link href="/dashboard/produits/nouveau">
                <Plus className="mr-2 size-4" />
                Créer mon premier produit
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <Card key={p.id} className="vs-card-shadow border-emerald-100 overflow-hidden">
              <div className="aspect-[4/3] bg-gradient-to-br from-emerald-100 to-amber-100 flex items-center justify-center relative">
                {p.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl">{p.category?.icon || "📦"}</span>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {p.isVisible ? (
                    <Badge className="bg-emerald-600 text-white text-xs">
                      <Eye className="size-3 mr-1" />
                      Visible
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <EyeOff className="size-3 mr-1" />
                      Masqué
                    </Badge>
                  )}
                </div>
              </div>
              <CardContent className="p-4 space-y-2">
                <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                  {p.category?.icon} {p.category?.name}
                </Badge>
                <h3 className="font-semibold truncate">{p.name}</h3>
                <p className="text-xs text-gray-500">{p.brand} · {p.weight || "—"}</p>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {p._count.lots} lot{p._count.lots > 1 ? "s" : ""}
                  </span>
                  <div className="flex gap-1">
                    <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Link href={`/produit/${p.id}`} target="_blank">
                        <Eye className="size-4" />
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Link href={`/dashboard/produits/${p.id}/modifier`}>
                        <Edit className="size-4" />
                      </Link>
                    </Button>
                    <DeleteProductButton productId={p.id} productName={p.name} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

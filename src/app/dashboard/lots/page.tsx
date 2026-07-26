import Link from "next/link";
import { Plus, Layers, Eye, AlertOctagon, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LotStatusToggle } from "./lot-status-toggle";

export default async function DashboardLotsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const lots = await db.lot.findMany({
    where: { product: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, name: true, brand: true, photoUrl: true, category: { select: { icon: true } } } },
      qrCodes: { select: { id: true, qrCodeImageUrl: true }, take: 1 },
      _count: { select: { qrCodes: true } },
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mes lots</h1>
          <p className="mt-1 text-gray-600">
            Chaque lot a un QR code unique pour la traçabilité.
          </p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/lots/nouveau">
            <Plus className="mr-2 size-4" />
            Nouveau lot
          </Link>
        </Button>
      </div>

      {lots.length === 0 ? (
        <Card className="vs-card-shadow border-emerald-100">
          <CardContent className="p-12 text-center">
            <Layers className="mx-auto size-12 text-emerald-200" />
            <h3 className="mt-4 font-semibold text-lg">Aucun lot pour le moment</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
              Créez votre premier lot pour générer un QR code à apposer sur vos produits.
              Chaque lot correspond à une production spécifique.
            </p>
            <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-700">
              <Link href="/dashboard/lots/nouveau">
                <Plus className="mr-2 size-4" />
                Créer mon premier lot
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {lots.map((lot) => {
            const isRecalled = lot.status === "recalled";
            return (
              <Card key={lot.id} className="vs-card-shadow border-emerald-100">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* QR thumbnail */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-emerald-50 flex items-center justify-center overflow-hidden">
                      {lot.qrCodes[0]?.qrCodeImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={lot.qrCodes[0].qrCodeImageUrl}
                          alt="QR"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-2xl">{lot.product.category?.icon || "📦"}</span>
                      )}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold truncate">{lot.product.name}</h3>
                        {isRecalled ? (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                            <AlertOctagon className="size-3 mr-1" />
                            Rappelé
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            <CheckCircle2 className="size-3 mr-1" />
                            Actif
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span>
                          Lot : <code className="font-mono text-gray-700">{lot.lotNumber}</code>
                        </span>
                        <span>
                          Fabriqué le{" "}
                          <span className="text-gray-700">
                            {lot.manufacturingDate.toLocaleDateString("fr-FR")}
                          </span>
                        </span>
                        <span>
                          Péremption le{" "}
                          <span className="text-gray-700">
                            {lot.expirationDate.toLocaleDateString("fr-FR")}
                          </span>
                        </span>
                        <span>{lot._count.qrCodes} QR code{lot._count.qrCodes > 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button asChild size="sm" variant="outline" className="border-emerald-200">
                        <Link href={`/p/${lot.id}`} target="_blank">
                          <Eye className="mr-2 size-4" />
                          Voir
                        </Link>
                      </Button>
                      <LotStatusToggle lotId={lot.id} currentStatus={lot.status as "active" | "recalled"} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

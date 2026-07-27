import Link from "next/link";
import {
  Package,
  Layers,
  QrCode,
  Eye,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function DashboardHome() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [products, lots, qrCodes, recentScans] = await Promise.all([
    db.product.count({ where: { userId: user.id } }),
    db.lot.count({ where: { product: { userId: user.id } } }),
    db.qRCode.count({ where: { lot: { product: { userId: user.id } } } }),
    db.scan.findMany({
      where: { qrCode: { lot: { product: { userId: user.id } } } },
      orderBy: { scannedAt: "desc" },
      take: 5,
      include: {
        qrCode: {
          select: {
            lot: {
              select: {
                lotNumber: true,
                product: { select: { name: true, brand: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const totalScans = await db.scan.count({
    where: { qrCode: { lot: { product: { userId: user.id } } } },
  });

  // KPI cards — brand green background (#2ebd5b), white text
  const stats = [
    { label: "Produits", value: products, icon: Package, href: "/dashboard/produits" },
    { label: "Lots", value: lots, icon: Layers, href: "/dashboard/lots" },
    { label: "QR Codes", value: qrCodes, icon: QrCode, href: "/dashboard/qr-codes" },
    { label: "Scans", value: totalScans, icon: Eye, href: "/dashboard/statistiques" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Bonjour, {user.companyName} 👋
          </h1>
          <p className="mt-1 text-gray-600">
            Voici un aperçu de votre activité sur VerifScan.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="border-emerald-200">
            <Link href="/dashboard/produits">
              <Plus className="mr-2 size-4" />
              Nouveau produit
            </Link>
          </Button>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/dashboard/lots">
              <Plus className="mr-2 size-4" />
              Nouveau lot
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats grid — fond vert #2ebd5b, texte blanc */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card
              className="vs-card-shadow hover:shadow-lg transition-shadow h-full border-0"
              style={{ backgroundColor: "#2ebd5b" }}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white">
                    <s.icon className="size-5" />
                  </div>
                  <ArrowRight className="size-4 text-white/70" />
                </div>
                <div className="mt-3 text-3xl font-bold text-white">{s.value}</div>
                <div className="text-sm text-white/90">{s.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="vs-card-shadow border-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/dashboard/produits/nouveau"
              className="flex items-center justify-between p-3 rounded-lg border border-emerald-100 hover:bg-emerald-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="size-5 text-emerald-600" />
                <span className="text-sm font-medium">Créer un produit</span>
              </div>
              <ArrowRight className="size-4 text-gray-400" />
            </Link>
            <Link
              href="/dashboard/lots/nouveau"
              className="flex items-center justify-between p-3 rounded-lg border border-emerald-100 hover:bg-emerald-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Layers className="size-5 text-amber-600" />
                <span className="text-sm font-medium">Créer un lot</span>
              </div>
              <ArrowRight className="size-4 text-gray-400" />
            </Link>
            <Link
              href="/dashboard/qr-codes"
              className="flex items-center justify-between p-3 rounded-lg border border-emerald-100 hover:bg-emerald-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <QrCode className="size-5 text-emerald-600" />
                <span className="text-sm font-medium">Télécharger QR codes</span>
              </div>
              <ArrowRight className="size-4 text-gray-400" />
            </Link>
            <Link
              href="/dashboard/statistiques"
              className="flex items-center justify-between p-3 rounded-lg border border-emerald-100 hover:bg-emerald-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="size-5 text-amber-600" />
                <span className="text-sm font-medium">Voir les statistiques</span>
              </div>
              <ArrowRight className="size-4 text-gray-400" />
            </Link>
          </CardContent>
        </Card>

        {/* Recent scans */}
        <Card className="vs-card-shadow border-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg">Scans récents</CardTitle>
          </CardHeader>
          <CardContent>
            {recentScans.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Aucun scan pour le moment. Partagez vos QR codes pour commencer à recevoir des scans !
              </p>
            ) : (
              <ul className="space-y-2 max-h-72 overflow-y-auto vs-scroll">
                {recentScans.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-start justify-between gap-2 p-3 rounded-lg bg-emerald-50/40"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {s.qrCode.lot.product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {s.qrCode.lot.lotNumber}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">
                        {s.scannedAt.toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {s.location && (
                        <Badge variant="outline" className="text-xs mt-0.5">
                          {s.location}
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

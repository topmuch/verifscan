import Link from "next/link";
import {
  Building2,
  Package,
  Layers,
  QrCode,
  Eye,
  Users,
  Tag,
  TrendingUp,
} from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminScanChart } from "./admin-scan-chart";

async function getStats() {
  const [
    totalFabricants,
    activeFabricants,
    totalProducts,
    totalLots,
    activeLots,
    recalledLots,
    totalQrCodes,
    totalScans,
    totalCategories,
  ] = await Promise.all([
    db.user.count({ where: { role: "fabricant" } }),
    db.user.count({ where: { role: "fabricant", isActive: true } }),
    db.product.count(),
    db.lot.count(),
    db.lot.count({ where: { status: "active" } }),
    db.lot.count({ where: { status: "recalled" } }),
    db.qRCode.count(),
    db.scan.count(),
    db.category.count(),
  ]);

  // Timeseries 14 days
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);
  const scans = await db.scan.findMany({
    where: { scannedAt: { gte: since } },
    select: { scannedAt: true },
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const timeseries: { date: string; label: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = scans.filter((s) => s.scannedAt.toISOString().slice(0, 10) === key).length;
    timeseries.push({
      date: key,
      label: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      count,
    });
  }

  return {
    totals: {
      totalFabricants,
      activeFabricants,
      totalProducts,
      totalLots,
      activeLots,
      recalledLots,
      totalQrCodes,
      totalScans,
      totalCategories,
    },
    timeseries,
  };
}

export default async function AdminHomePage() {
  const stats = await getStats();

  const recentFabricants = await db.user.findMany({
    where: { role: "fabricant" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      companyName: true,
      email: true,
      isActive: true,
      createdAt: true,
      _count: { select: { products: true } },
    },
  });

  const cards = [
    { label: "Fabricants actifs", value: `${stats.totals.activeFabricants}/${stats.totals.totalFabricants}`, icon: Building2, color: "bg-emerald-600", href: "/admin/fabricants" },
    { label: "Produits", value: stats.totals.totalProducts, icon: Package, color: "bg-amber-500", href: "/admin/fabricants" },
    { label: "Lots actifs", value: stats.totals.activeLots, icon: Layers, color: "bg-emerald-600", href: "/admin/fabricants" },
    { label: "Lots rappelés", value: stats.totals.recalledLots, icon: Tag, color: "bg-red-500", href: "/admin/fabricants" },
    { label: "QR Codes", value: stats.totals.totalQrCodes, icon: QrCode, color: "bg-amber-500", href: "/admin/fabricants" },
    { label: "Scans totaux", value: stats.totals.totalScans, icon: Eye, color: "bg-emerald-600", href: "#" },
    { label: "Catégories", value: stats.totals.totalCategories, icon: Tag, color: "bg-amber-500", href: "/admin/categories" },
    { label: "Taux d'activation", value: `${stats.totals.totalFabricants > 0 ? Math.round((stats.totals.activeFabricants / stats.totals.totalFabricants) * 100) : 0}%`, icon: TrendingUp, color: "bg-emerald-600", href: "#" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tableau de bord SuperAdmin</h1>
        <p className="mt-1 text-gray-600">
          Vue d'ensemble de la plateforme VerifScan.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="vs-card-shadow border-emerald-100 hover:shadow-lg transition-shadow h-full">
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center text-white mb-3`}>
                  <c.icon className="size-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{c.value}</div>
                <div className="text-sm text-gray-500">{c.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Timeseries */}
      <Card className="vs-card-shadow border-emerald-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="size-5 text-emerald-600" />
            Scans globaux (14 derniers jours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.totals.totalScans === 0 ? (
            <p className="text-center text-gray-500 py-12">Aucun scan enregistré pour le moment.</p>
          ) : (
            <AdminScanChart data={stats.timeseries} />
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent fabricants */}
        <Card className="vs-card-shadow border-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="size-5 text-emerald-600" />
              Fabricants récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentFabricants.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Aucun fabricant inscrit</p>
            ) : (
              <ul className="space-y-3">
                {recentFabricants.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-emerald-50/40">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{f.companyName}</p>
                      <p className="text-xs text-gray-500 truncate">{f.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge className={f.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                        {f.isActive ? "Actif" : "Désactivé"}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {f._count.products} produit{f._count.products > 1 ? "s" : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" className="w-full mt-4 border-emerald-200">
              <Link href="/admin/fabricants">Voir tous les fabricants</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card className="vs-card-shadow border-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg">Gestion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/admin/fabricants"
              className="flex items-center justify-between p-3 rounded-lg border border-emerald-100 hover:bg-emerald-50/50"
            >
              <span className="flex items-center gap-3">
                <Building2 className="size-5 text-emerald-600" />
                <span className="text-sm font-medium">Gérer les fabricants</span>
              </span>
              <span className="text-xs text-gray-400">→</span>
            </Link>
            <Link
              href="/admin/categories"
              className="flex items-center justify-between p-3 rounded-lg border border-emerald-100 hover:bg-emerald-50/50"
            >
              <span className="flex items-center gap-3">
                <Tag className="size-5 text-amber-600" />
                <span className="text-sm font-medium">Gérer les catégories</span>
              </span>
              <span className="text-xs text-gray-400">→</span>
            </Link>
            <Link
              href="/"
              className="flex items-center justify-between p-3 rounded-lg border border-emerald-100 hover:bg-emerald-50/50"
            >
              <span className="flex items-center gap-3">
                <Eye className="size-5 text-emerald-600" />
                <span className="text-sm font-medium">Voir le site public</span>
              </span>
              <span className="text-xs text-gray-400">→</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

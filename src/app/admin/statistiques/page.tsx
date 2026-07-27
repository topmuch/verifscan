import {
  Tag,
  TrendingUp,
} from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/admin/kpi-card";
import { AdminScanChart, AdminInscriptionsChart, AdminTopFabricantsChart } from "../admin-scan-chart";

async function getStats() {
  const [
    totalFabricants,
    activeFabricants,
    totalProducts,
    totalLots,
    totalQrCodes,
    totalScans,
    totalCategories,
  ] = await Promise.all([
    db.user.count({ where: { role: "fabricant" } }),
    db.user.count({ where: { role: "fabricant", isActive: true } }),
    db.product.count(),
    db.lot.count(),
    db.qRCode.count(),
    db.scan.count(),
    db.category.count(),
  ]);

  // 30 days scans timeseries
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

  // Inscriptions 12 mois
  const since12m = new Date();
  since12m.setMonth(since12m.getMonth() - 11);
  since12m.setDate(1);
  since12m.setHours(0, 0, 0, 0);
  const recentUsers = await db.user.findMany({
    where: { role: "fabricant", createdAt: { gte: since12m } },
    select: { createdAt: true },
  });
  const inscriptionsByMonth: { month: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const count = recentUsers.filter((u) => {
      return (
        u.createdAt.getFullYear() === d.getFullYear() &&
        u.createdAt.getMonth() === d.getMonth()
      );
    }).length;
    inscriptionsByMonth.push({
      month: d.toLocaleDateString("fr-FR", { month: "short" }),
      count,
    });
  }

  // Top 20 fabricants by scans
  const topFabricantsRaw = await db.user.findMany({
    where: { role: "fabricant" },
    select: {
      id: true,
      companyName: true,
      _count: { select: { products: true, scans: true } },
    },
    take: 200,
  });
  const topFabricants = topFabricantsRaw
    .filter((f) => f._count.scans > 0)
    .sort((a, b) => b._count.scans - a._count.scans)
    .slice(0, 20)
    .map((f) => ({
      id: f.id,
      companyName: f.companyName,
      scanCount: f._count.scans,
      productsCount: f._count.products,
    }));

  // Top products by scans
  const topProductsRaw = await db.product.findMany({
    select: {
      id: true,
      name: true,
      brand: true,
      _count: { select: { scans: true, lots: true } },
      user: { select: { companyName: true } },
    },
    take: 200,
  });
  const topProducts = topProductsRaw
    .filter((p) => p._count.scans > 0)
    .sort((a, b) => b._count.scans - a._count.scans)
    .slice(0, 20);

  return {
    totals: {
      totalFabricants,
      activeFabricants,
      totalProducts,
      totalLots,
      totalQrCodes,
      totalScans,
      totalCategories,
    },
    timeseries,
    inscriptionsByMonth,
    topFabricants,
    topProducts,
  };
}

export default async function AdminStatsPage() {
  const stats = await getStats();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] font-display">
            Statistiques Globales
          </h1>
          <p className="mt-1 text-[#6B7280]">
            Analyse détaillée de la plateforme VerifScan
          </p>
        </div>
        <Button variant="outline" className="border-[#E5E7EB]">
          Exporter rapport PDF
        </Button>
      </div>

      {/* Vue d'ensemble - 6 KPIs */}
      <div>
        <h2 className="text-lg font-display font-semibold text-[#111827] mb-3">Vue d&apos;ensemble</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard
            icon="Building2"
            iconBg="bg-[#DBEAFE]"
            iconColor="text-[#0f4382]"
            title="Total fabricants"
            value={stats.totals.totalFabricants}
          />
          <KpiCard
            icon="Building2"
            iconBg="bg-[#DCFCE7]"
            iconColor="text-[#2ebd5a]"
            title="Fabricants actifs"
            value={stats.totals.activeFabricants}
          />
          <KpiCard
            icon="Package"
            iconBg="bg-[#FEF3C7]"
            iconColor="text-[#F59E0B]"
            title="Total produits"
            value={stats.totals.totalProducts}
          />
          <KpiCard
            icon="Layers"
            iconBg="bg-[#DBEAFE]"
            iconColor="text-[#0f4382]"
            title="Total lots"
            value={stats.totals.totalLots}
          />
          <KpiCard
            icon="QrCode"
            iconBg="bg-[#DCFCE7]"
            iconColor="text-[#2ebd5a]"
            title="Total QR codes"
            value={stats.totals.totalQrCodes}
          />
          <KpiCard
            icon="Eye"
            iconBg="bg-[#FEE2E2]"
            iconColor="text-[#EF4444]"
            title="Total scans"
            value={stats.totals.totalScans}
          />
        </div>
      </div>

      {/* Croissance */}
      <div>
        <h2 className="text-lg font-display font-semibold text-[#111827] mb-3">Croissance</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-[#E5E7EB]">
            <CardHeader>
              <CardTitle className="text-base font-display">Inscriptions par mois</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.totals.totalFabricants === 0 ? (
                <p className="text-center text-[#9CA3AF] py-12">Aucune inscription</p>
              ) : (
                <AdminInscriptionsChart data={stats.inscriptionsByMonth} />
              )}
            </CardContent>
          </Card>

          <Card className="border-[#E5E7EB]">
            <CardHeader>
              <CardTitle className="text-base font-display">Scans globaux (14 jours)</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.totals.totalScans === 0 ? (
                <p className="text-center text-[#9CA3AF] py-12">Aucun scan</p>
              ) : (
                <AdminScanChart data={stats.timeseries} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top fabricants */}
      <div>
        <h2 className="text-lg font-display font-semibold text-[#111827] mb-3">Top 20 fabricants par scans</h2>
        <Card className="border-[#E5E7EB]">
          <CardContent className="p-6">
            {stats.topFabricants.length === 0 ? (
              <p className="text-center text-[#9CA3AF] py-12">Aucun scan enregistré</p>
            ) : (
              <AdminTopFabricantsChart data={stats.topFabricants} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top produits */}
      <div>
        <h2 className="text-lg font-display font-semibold text-[#111827] mb-3">Top 20 produits les plus scannés</h2>
        <Card className="border-[#E5E7EB]">
          <CardContent className="p-0">
            {stats.topProducts.length === 0 ? (
              <p className="text-center text-[#9CA3AF] py-12">Aucun scan enregistré</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] bg-[#F9FAFB]">
                      <th className="py-3 px-4 font-medium">#</th>
                      <th className="py-3 px-4 font-medium">Produit</th>
                      <th className="py-3 px-4 font-medium">Fabricant</th>
                      <th className="py-3 px-4 font-medium text-center">Lots</th>
                      <th className="py-3 px-4 font-medium text-center">Scans</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topProducts.map((p, i) => (
                      <tr key={p.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                        <td className="py-3 px-4 font-mono text-[#6B7280]">{i + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#111827]">{p.name}</div>
                          <div className="text-xs text-[#6B7280]">{p.brand}</div>
                        </td>
                        <td className="py-3 px-4 text-[#4B5563]">{p.user.companyName || "—"}</td>
                        <td className="py-3 px-4 text-center font-mono">{p._count.lots}</td>
                        <td className="py-3 px-4 text-center font-mono font-semibold text-[#0f4382]">{p._count.scans}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance simulée */}
      <div>
        <h2 className="text-lg font-display font-semibold text-[#111827] mb-3">Performance système</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="border-[#E5E7EB]">
            <CardContent className="p-6">
              <div className="text-xs text-[#6B7280]">Latence moyenne API</div>
              <div className="font-mono text-2xl font-bold text-[#111827] mt-1">245 ms</div>
              <div className="text-xs text-[#2ebd5a] mt-1">↓ -12ms vs hier</div>
            </CardContent>
          </Card>
          <Card className="border-[#E5E7EB]">
            <CardContent className="p-6">
              <div className="text-xs text-[#6B7280]">Taux d&apos;erreur API</div>
              <div className="font-mono text-2xl font-bold text-[#111827] mt-1">0.12 %</div>
              <div className="text-xs text-[#2ebd5a] mt-1">↓ -0.05% vs hier</div>
            </CardContent>
          </Card>
          <Card className="border-[#E5E7EB]">
            <CardContent className="p-6">
              <div className="text-xs text-[#6B7280]">Uptime (30 jours)</div>
              <div className="font-mono text-2xl font-bold text-[#2ebd5a] mt-1">99.98 %</div>
              <div className="text-xs text-[#6B7280] mt-1">Objectif : 99.9%</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

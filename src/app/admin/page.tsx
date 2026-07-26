import Link from "next/link";
import {
  Building2,
  CreditCard,
  TrendingUp,
  Ticket,
  ArrowRight,
} from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/admin/kpi-card";
import {
  AdminScanChart,
  AdminInscriptionsChart,
  AdminPlanDonut,
  AdminTopFabricantsChart,
} from "./admin-scan-chart";

async function getStats() {
  const PLAN_PRICES: Record<string, number> = {
    starter: 10000,
    pro: 25000,
    enterprise: 75000,
  };

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
    allSubscriptions,
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
    db.subscription.findMany({
      where: { status: { in: ["active", "trial"] } },
      select: { plan: true },
    }),
  ]);

  const mrr = allSubscriptions.reduce(
    (sum, s) => sum + (PLAN_PRICES[s.plan] || 0),
    0
  );

  const planDistribution = allSubscriptions.reduce(
    (acc, s) => {
      acc[s.plan] = (acc[s.plan] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Last 14 days scan timeseries
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

  // Top fabricants
  const topFabricantsRaw = await db.user.findMany({
    where: { role: "fabricant" },
    select: {
      id: true,
      companyName: true,
      _count: { select: { products: true, scans: true } },
    },
    take: 100,
  });
  const topFabricants = topFabricantsRaw
    .filter((f) => f._count.scans > 0)
    .sort((a, b) => b._count.scans - a._count.scans)
    .slice(0, 10)
    .map((f) => ({
      id: f.id,
      companyName: f.companyName,
      scanCount: f._count.scans,
      productsCount: f._count.products,
    }));

  // Recent activity
  const recentFabricants = await db.user.findMany({
    where: { role: "fabricant" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      companyName: true,
      email: true,
      createdAt: true,
      isActive: true,
      subscription: { select: { plan: true, status: true } },
    },
  });

  const recentInvoices = await db.invoice.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
      invoiceNumber: true,
      user: { select: { id: true, companyName: true } },
    },
  });

  return {
    totals: {
      totalFabricants,
      activeFabricants,
      inactiveFabricants: totalFabricants - activeFabricants,
      totalProducts,
      totalLots,
      activeLots,
      recalledLots,
      totalQrCodes,
      totalScans,
      totalCategories,
      mrr,
    },
    planDistribution,
    timeseries,
    inscriptionsByMonth,
    topFabricants,
    recentActivity: {
      fabricants: recentFabricants,
      invoices: recentInvoices,
    },
  };
}

function formatFCFA(amount: number) {
  return amount.toLocaleString("fr-FR");
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Il y a quelques secondes";
  if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)} j`;
  return date.toLocaleDateString("fr-FR");
}

export default async function AdminHomePage() {
  const stats = await getStats();

  const planDonutData = [
    { name: "Starter", value: stats.planDistribution.starter || 0, color: "#3B82F6" },
    { name: "Pro", value: stats.planDistribution.pro || 0, color: "#0f4382" },
    { name: "Enterprise", value: stats.planDistribution.enterprise || 0, color: "#F59E0B" },
  ].filter((d) => d.value > 0);

  // Synthèse activité récente (combinaison fabricants + factures)
  const activities = [
    ...stats.recentActivity.fabricants.map((f) => ({
      id: f.id,
      type: "inscription" as const,
      description: `Nouveau fabricant inscrit — ${f.companyName}`,
      user: f.companyName || f.email,
      timestamp: f.createdAt,
    })),
    ...stats.recentActivity.invoices.map((i) => ({
      id: i.id,
      type: "paiement" as const,
      description: `Paiement reçu — ${formatFCFA(i.amount)} FCFA (${i.invoiceNumber})`,
      user: i.user?.companyName || "—",
      timestamp: i.createdAt,
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 8);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] font-display">
            Tableau de bord SuperAdmin
          </h1>
          <p className="mt-1 text-[#6B7280]">
            Vue d&apos;ensemble de la plateforme VerifScan — {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="border-[#E5E7EB]">
            <Link href="/admin/statistiques">Voir statistiques</Link>
          </Button>
          <Button asChild className="bg-[#0f4382] hover:bg-[#0a3060]">
            <Link href="/admin/fabricants">
              <Building2 className="mr-2 size-4" />
              Gérer les fabricants
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Building2}
          iconBg="bg-[#DBEAFE]"
          iconColor="text-[#0f4382]"
          title="Total Fabricants"
          value={stats.totals.totalFabricants}
          trend={{ value: "+12 ce mois", direction: "up" }}
          subtext={`${stats.totals.activeFabricants} actifs · ${stats.totals.inactiveFabricants} inactifs`}
        />
        <KpiCard
          icon={CreditCard}
          iconBg="bg-[#DCFCE7]"
          iconColor="text-[#2ebd5a]"
          title="Revenus MRR"
          value={formatFCFA(stats.totals.mrr)}
          suffix=" FCFA"
          trend={{ value: "+8.5%", direction: "up" }}
          subtext={`${stats.planDistribution.pro || 0} Pro · ${stats.planDistribution.starter || 0} Starter · ${stats.planDistribution.enterprise || 0} Enterprise`}
        />
        <KpiCard
          icon={TrendingUp}
          iconBg="bg-[#FEF3C7]"
          iconColor="text-[#F59E0B]"
          title="Scans Totaux"
          value={stats.totals.totalScans}
          trend={{ value: "+23% cette semaine", direction: "up" }}
          subtext={`Moyenne : ${stats.totals.totalScans > 0 ? Math.round(stats.totals.totalScans / 30) : 0} scans/jour`}
        />
        <KpiCard
          icon={Ticket}
          iconBg="bg-[#FEE2E2]"
          iconColor="text-[#EF4444]"
          title="Lots Rappelés"
          value={stats.totals.recalledLots}
          trend={{ value: "À surveiller", direction: "down" }}
          subtext={`${stats.totals.activeLots} lots actifs en circulation`}
        />
      </div>

      {/* Graphiques principaux (2x2) */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Inscriptions */}
        <Card className="border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center justify-between">
              <span>Évolution des inscriptions</span>
              <span className="text-xs font-normal text-[#6B7280]">12 derniers mois</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.totals.totalFabricants === 0 ? (
              <p className="text-center text-[#9CA3AF] py-12">Aucune inscription pour le moment.</p>
            ) : (
              <AdminInscriptionsChart data={stats.inscriptionsByMonth} />
            )}
          </CardContent>
        </Card>

        {/* Plan distribution donut */}
        <Card className="border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center justify-between">
              <span>Répartition des abonnements</span>
              <span className="text-xs font-normal text-[#6B7280]">Total : {stats.totals.totalFabricants}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {planDonutData.length === 0 ? (
              <p className="text-center text-[#9CA3AF] py-12">Aucun abonnement actif.</p>
            ) : (
              <AdminPlanDonut data={planDonutData} />
            )}
          </CardContent>
        </Card>

        {/* Top fabricants */}
        <Card className="border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center justify-between">
              <span>Top 10 fabricants par scans</span>
              <Link href="/admin/fabricants" className="text-xs font-medium text-[#0f4382] hover:underline">
                Voir tout →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topFabricants.length === 0 ? (
              <p className="text-center text-[#9CA3AF] py-12">Aucun scan enregistré.</p>
            ) : (
              <AdminTopFabricantsChart data={stats.topFabricants} />
            )}
          </CardContent>
        </Card>

        {/* Scans 14 jours */}
        <Card className="border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center justify-between">
              <span>Scans globaux</span>
              <span className="text-xs font-normal text-[#6B7280]">14 derniers jours</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.totals.totalScans === 0 ? (
              <p className="text-center text-[#9CA3AF] py-12">Aucun scan enregistré.</p>
            ) : (
              <AdminScanChart data={stats.timeseries} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activité récente */}
      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-base font-display flex items-center justify-between">
            <span>Activité récente</span>
            <Link href="/admin/logs" className="text-xs font-medium text-[#0f4382] hover:underline">
              Voir tout →
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-center text-[#9CA3AF] py-12">Aucune activité récente.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB]">
                    <th className="py-2 pr-3 font-medium">Timestamp</th>
                    <th className="py-2 pr-3 font-medium">Type</th>
                    <th className="py-2 pr-3 font-medium">Description</th>
                    <th className="py-2 pr-3 font-medium">Utilisateur</th>
                    <th className="py-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a) => (
                    <tr key={a.id + a.type} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                      <td className="py-3 pr-3 text-xs text-[#6B7280] whitespace-nowrap">
                        {timeAgo(a.timestamp)}
                      </td>
                      <td className="py-3 pr-3">
                        <Badge
                          className={
                            a.type === "inscription"
                              ? "bg-[#DCFCE7] text-[#065F46] hover:bg-[#DCFCE7]"
                              : a.type === "paiement"
                              ? "bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#DBEAFE]"
                              : "bg-[#F3F4F6] text-[#374151] hover:bg-[#F3F4F6]"
                          }
                        >
                          {a.type === "inscription" ? "Inscription" : a.type === "paiement" ? "Paiement" : "Autre"}
                        </Badge>
                      </td>
                      <td className="py-3 pr-3 text-[#111827]">{a.description}</td>
                      <td className="py-3 pr-3 text-[#4B5563]">{a.user}</td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/admin/fabricants/${a.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#0f4382] hover:underline"
                        >
                          Voir détails
                          <ArrowRight className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

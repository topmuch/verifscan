import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";

const PLAN_PRICES: Record<string, number> = {
  starter: 10000,
  pro: 25000,
  enterprise: 75000,
};

/**
 * Global statistics for SuperAdmin dashboard.
 */
export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

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

  // Plan distribution
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

  // Inscriptions par mois (12 derniers mois)
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
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = recentUsers.filter((u) => {
      const uk = `${u.createdAt.getFullYear()}-${String(u.createdAt.getMonth() + 1).padStart(2, "0")}`;
      return uk === key;
    }).length;
    inscriptionsByMonth.push({
      month: d.toLocaleDateString("fr-FR", { month: "short" }),
      count,
    });
  }

  // Top fabricants by scans
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

  // Recent activity (last 20 events)
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
      user: { select: { id: true, companyName: true, email: true } },
    },
  });

  return NextResponse.json({
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
      arr: mrr * 12,
    },
    planDistribution,
    timeseries,
    inscriptionsByMonth,
    topFabricants,
    recentActivity: {
      fabricants: recentFabricants,
      invoices: recentInvoices,
    },
  });
}

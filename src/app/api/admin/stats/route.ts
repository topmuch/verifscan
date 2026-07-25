import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";

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
  const timeseries: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = scans.filter((s) => s.scannedAt.toISOString().slice(0, 10) === key).length;
    timeseries.push({ date: key, count });
  }

  // Top fabricants by scans
  const topFabricantsRaw = await db.user.findMany({
    where: { role: "fabricant" },
    select: {
      id: true,
      companyName: true,
      products: {
        select: {
          lots: {
            select: {
              qrCodes: { select: { _count: { select: { scans: true } } } },
            },
          },
        },
      },
    },
    take: 50,
  });
  const topFabricants = topFabricantsRaw
    .map((f) => {
      const scanCount = f.products.reduce(
        (sum, p) => sum + p.lots.reduce(
          (s, l) => s + l.qrCodes.reduce((s2, q) => s2 + q._count.scans, 0),
          0
        ),
        0
      );
      return { id: f.id, companyName: f.companyName, scanCount };
    })
    .filter((f) => f.scanCount > 0)
    .sort((a, b) => b.scanCount - a.scanCount)
    .slice(0, 5);

  return NextResponse.json({
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
    topFabricants,
  });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";

/**
 * Scan statistics for the logged-in fabricant.
 * Returns: totals + timeseries (last 14 days) + top products + top locations.
 */
export async function GET() {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Last 14 days timeseries
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const scans = await db.scan.findMany({
    where: {
      scannedAt: { gte: since },
      qrCode: { lot: { product: { userId: user.id } } },
    },
    select: {
      scannedAt: true,
      location: true,
      qrCode: {
        select: {
          lot: {
            select: {
              id: true,
              lotNumber: true,
              product: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  // Total scans
  const totalScans = await db.scan.count({
    where: { qrCode: { lot: { product: { userId: user.id } } } },
  });

  // Totals
  const totalProducts = await db.product.count({ where: { userId: user.id } });
  const totalLots = await db.lot.count({
    where: { product: { userId: user.id } },
  });
  const totalQrCodes = await db.qRCode.count({
    where: { lot: { product: { userId: user.id } } },
  });

  // Build 14-day timeseries
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

  // Top products (by scan count)
  const productCounts = new Map<string, { name: string; count: number }>();
  for (const s of scans) {
    const id = s.qrCode.lot.product.id;
    const name = s.qrCode.lot.product.name;
    const cur = productCounts.get(id) || { name, count: 0 };
    cur.count++;
    productCounts.set(id, cur);
  }
  const topProducts = Array.from(productCounts.entries())
    .map(([id, v]) => ({ id, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top locations
  const locCounts = new Map<string, number>();
  for (const s of scans) {
    if (!s.location) continue;
    locCounts.set(s.location, (locCounts.get(s.location) || 0) + 1);
  }
  const topLocations = Array.from(locCounts.entries())
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return NextResponse.json({
    totals: { totalScans, totalProducts, totalLots, totalQrCodes },
    timeseries,
    topProducts,
    topLocations,
  });
}

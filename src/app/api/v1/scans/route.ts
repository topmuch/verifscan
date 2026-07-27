import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiKey, canRead } from "@/lib/session";

/**
 * GET /api/v1/scans
 *
 * Returns scan analytics for the API key owner's products/lots.
 * Aggregated by day for the last N days (default 30).
 *
 * Query params:
 *   - days: number (default 30, max 365)
 *   - lotId: string (filter on a specific lot)
 *
 * Headers: Authorization: Bearer vsk_live_xxx
 */
export async function GET(req: Request) {
  const apiUser = await requireApiKey(req);
  if (!apiUser) {
    return NextResponse.json(
      { error: "Clé API invalide ou manquante" },
      { status: 401 }
    );
  }
  if (!canRead(apiUser.permissions)) {
    return NextResponse.json({ error: "Permission 'read' requise" }, { status: 403 });
  }

  const url = new URL(req.url);
  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get("days") || "30")));
  const lotId = url.searchParams.get("lotId") || "";

  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: any = {
    qrCode: {
      lot: {
        product: { userId: apiUser.id },
      },
    },
    scannedAt: { gte: since },
  };
  if (lotId) where.qrCode.lot.id = lotId;

  const [totalScans, byCountry, recentScans] = await Promise.all([
    db.scan.count({ where }),
    db.scan.groupBy({
      by: ["country"],
      where,
      _count: true,
      orderBy: { _count: { country: "desc" } },
      take: 20,
    }),
    db.scan.findMany({
      where,
      orderBy: { scannedAt: "desc" },
      take: 100,
      select: {
        id: true,
        scannedAt: true,
        country: true,
        city: true,
        deviceType: true,
        qrCode: {
          select: {
            lot: {
              select: { id: true, lotNumber: true, product: { select: { id: true, name: true } } },
            },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    totalScans,
    days,
    since: since.toISOString(),
    byCountry: byCountry.map((c) => ({ country: c.country || "Inconnu", count: c._count })),
    recentScans: recentScans.map((s) => ({
      id: s.id,
      scannedAt: s.scannedAt,
      country: s.country,
      city: s.city,
      deviceType: s.deviceType,
      lotId: s.qrCode?.lot?.id,
      lotNumber: s.qrCode?.lot?.lotNumber,
      productName: s.qrCode?.lot?.product?.name,
    })),
  });
}

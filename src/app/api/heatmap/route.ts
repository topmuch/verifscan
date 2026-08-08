import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Public heatmap of all scans by region.
 * Returns aggregated counts per region for the last 30 days.
 *
 * Query params:
 *  - days: time window (default 30)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Math.min(Math.max(parseInt(searchParams.get("days") || "30", 10), 1), 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Aggregate by region (raw SQL — Prisma doesn't support groupBy on nullable fields well in SQLite)
    const rows = await db.$queryRaw<{ region: string | null; total: number; avgLat: number | null; avgLng: number | null }[]>(
      Prisma.sql`
        SELECT
          region,
          COUNT(*) as total,
          AVG(latitude) as avgLat,
          AVG(longitude) as avgLng
        FROM Scan
        WHERE scannedAt >= ${since}
          AND (region IS NOT NULL OR (latitude IS NOT NULL AND longitude IS NOT NULL))
        GROUP BY region
        ORDER BY total DESC
      `
    );

    // If region is null but lat/lng present, infer region client-side (skip here for simplicity)
    const regions = rows.map((r) => ({
      region: r.region || "Inconnu",
      total: Number(r.total),
      lat: r.avgLat,
      lng: r.avgLng,
    }));

    return NextResponse.json({
      since,
      totalScans: regions.reduce((acc, r) => acc + r.total, 0),
      regions,
    });
  } catch (err) {
    console.error("[heatmap GET] error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

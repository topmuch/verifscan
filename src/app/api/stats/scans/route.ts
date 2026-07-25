import { NextResponse } from "next/server";
import { requireFabricant } from "@/lib/session";
import {
  getFabricantScanStats,
  getDailyScansTimeSeries,
  getTopProducts,
  getGeographicStats,
  getHourlyStats,
  getPeakActivity,
  StatsPeriod,
} from "@/lib/stats";

export async function GET(req: Request) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") || "30d") as StatsPeriod;

  const validPeriods: StatsPeriod[] = ["7d", "30d", "90d", "1y", "all"];
  if (!validPeriods.includes(period)) {
    return NextResponse.json({ error: "Période invalide" }, { status: 400 });
  }

  try {
    const [overview, timeSeries, topProducts, geo, hourly, peak] = await Promise.all([
      getFabricantScanStats(user.id, period),
      getDailyScansTimeSeries(user.id, period),
      getTopProducts(user.id, period, 5),
      getGeographicStats(user.id, period),
      getHourlyStats(user.id, period),
      getPeakActivity(user.id, period),
    ]);

    return NextResponse.json({
      overview,
      timeSeries,
      topProducts,
      geo,
      hourly,
      peak,
    });
  } catch (e) {
    console.error("[stats/scans] error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

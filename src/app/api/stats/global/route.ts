import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/session";
import { getGlobalStats, StatsPeriod } from "@/lib/stats";

export async function GET(req: Request) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") || "30d") as StatsPeriod;

  try {
    const stats = await getGlobalStats(period);
    return NextResponse.json(stats);
  } catch (e) {
    console.error("[stats/global] error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

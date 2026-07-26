import { NextResponse } from "next/server";
import { requireFabricant } from "@/lib/session";
import { getHeatmapData } from "@/lib/ai";

// GET /api/ai/heatmap — données géographiques pour la heatmap
export async function GET(req: Request) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId") || undefined;
  const daysBack = searchParams.get("daysBack")
    ? parseInt(searchParams.get("daysBack")!)
    : undefined;

  const points = await getHeatmapData(user.id, { productId, daysBack });
  return NextResponse.json({ points, total: points.length });
}

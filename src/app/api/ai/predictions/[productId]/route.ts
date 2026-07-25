import { NextResponse } from "next/server";
import { predictProductDemand } from "@/lib/ai";

// GET /api/ai/predictions/[productId] — prédiction de demande pour un produit
export async function GET(_req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const prediction = await predictProductDemand(productId);

  if (!prediction) {
    return NextResponse.json({
      error: "Pas assez de données pour prédire (minimum 5 scans requis sur 60 jours)",
      minScans: 5,
    }, { status: 404 });
  }

  return NextResponse.json({ prediction });
}

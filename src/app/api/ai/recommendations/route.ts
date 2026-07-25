import { NextResponse } from "next/server";
import { requireFabricant } from "@/lib/session";
import { generateRecommendations } from "@/lib/ai";
import { db } from "@/lib/db";

// GET /api/ai/recommendations — recommandations actionnables
export async function GET() {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const recommendations = await generateRecommendations(user.id);

  // Persiste les nouvelles recommandations (si pas déjà existantes)
  for (const rec of recommendations) {
    const existing = await db.aIRecommendation.findFirst({
      where: {
        fabricantId: user.id,
        type: rec.type,
        content: rec.content,
        status: "pending",
      },
    });
    if (!existing) {
      await db.aIRecommendation.create({
        data: {
          fabricantId: user.id,
          type: rec.type,
          content: rec.content,
          expectedImpactPct: rec.expectedImpactPct,
        },
      });
    }
  }

  // Récupère toutes les recommandations (avec statut)
  const all = await db.aIRecommendation.findMany({
    where: { fabricantId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ recommendations: all });
}

// PUT /api/ai/recommendations — mettre à jour le statut (dismissed/applied)
export async function PUT(req: Request) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { id, status } = body;
  if (!id || !["applied", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const updated = await db.aIRecommendation.updateMany({
    where: { id, fabricantId: user.id },
    data: { status },
  });

  return NextResponse.json({ updated: updated.count });
}

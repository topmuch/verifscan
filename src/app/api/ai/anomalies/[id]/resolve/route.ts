import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";

// PUT /api/ai/anomalies/[id]/resolve — marque une anomalie comme résolue
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const anomaly = await db.aIAnomaly.findUnique({ where: { id } });
  if (!anomaly || anomaly.fabricantId !== user.id) {
    return NextResponse.json({ error: "Anomalie introuvable" }, { status: 404 });
  }

  const updated = await db.aIAnomaly.update({
    where: { id },
    data: { status: "resolved", resolvedAt: new Date() },
  });

  return NextResponse.json({ anomaly: updated });
}

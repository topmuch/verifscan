import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// POST /api/b2b/reviews — créer un avis après transaction
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "distributor") {
    return NextResponse.json({ error: "Réservé aux distributeurs" }, { status: 403 });
  }

  const body = await req.json();
  const { orderId, reliabilityScore, qualityScore, professionalismScore, comment } = body;

  if (!orderId || !reliabilityScore || !qualityScore || !professionalismScore) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const distributor = await db.distributor.findUnique({ where: { userId: user.id } });
  if (!distributor) return NextResponse.json({ error: "Profil distributeur introuvable" }, { status: 404 });

  const order = await db.b2BOrder.findUnique({ where: { id: orderId } });
  if (!order || order.distributorId !== distributor.id) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  // Vérifie pas déjà noté
  const existing = await db.b2BReview.findFirst({ where: { orderId } });
  if (existing) {
    return NextResponse.json({ error: "Avis déjà donné pour cette commande" }, { status: 400 });
  }

  const review = await db.b2BReview.create({
    data: {
      distributorReviewerId: distributor.id,
      fabricantReviewedId: order.fabricantId,
      orderId,
      reliabilityScore,
      qualityScore,
      professionalismScore,
      comment,
    },
  });

  return NextResponse.json({ review });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";

/**
 * GET /api/webhooks/[id]/deliveries
 * Historique des livraisons d'un webhook (50 dernières, les plus récentes d'abord).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireFabricant();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const webhook = await db.webhook.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!webhook) {
    return NextResponse.json({ error: "Webhook introuvable" }, { status: 404 });
  }
  if (webhook.userId !== user.id) {
    return NextResponse.json({ error: "Vous ne possédez pas ce webhook" }, { status: 403 });
  }

  const deliveries = await db.webhookDelivery.findMany({
    where: { webhookId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      event: true,
      status: true,
      statusCode: true,
      attempts: true,
      maxAttempts: true,
      lastError: true,
      deliveredAt: true,
      createdAt: true,
      nextRetryAt: true,
      // payload: true, // trop volumineux pour la liste — non retourné
      // response: true,
    },
  });

  return NextResponse.json({ deliveries });
}

import { NextResponse } from "next/server";
import { requireFabricant } from "@/lib/session";
import { getOrCreateSubscription, getQuotaUsagePercent, PLANS } from "@/lib/subscription";

/**
 * Returns the current subscription for the authenticated user.
 */
export async function GET() {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const sub = await getOrCreateSubscription(user.id);
    const plan = PLANS[sub.plan as keyof typeof PLANS];
    const usagePercent = getQuotaUsagePercent(sub);

    return NextResponse.json({
      subscription: sub,
      plan,
      usagePercent,
      remaining: sub.qrCodesLimit === -1 ? Infinity : Math.max(0, sub.qrCodesLimit - sub.qrCodesUsed),
    });
  } catch (e) {
    console.error("[subscriptions/current] error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

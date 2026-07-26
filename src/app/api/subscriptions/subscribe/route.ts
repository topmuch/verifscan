import { NextResponse } from "next/server";
import { z } from "zod";
import { requireFabricant } from "@/lib/session";
import { upgradePlan, PLANS, PlanId } from "@/lib/subscription";

const schema = z.object({
  plan: z.enum(["starter", "pro", "enterprise"]),
  paymentMethod: z.enum(["cinetpay", "stripe", "manual"]).optional().default("manual"),
});

/**
 * Subscribes the authenticated user to a plan.
 * In production, this would redirect to CinetPay/Stripe.
 * Here we mark the subscription as active immediately (mock payment success).
 */
export async function POST(req: Request) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  const { plan, paymentMethod } = parsed.data;
  const planDef = PLANS[plan as PlanId];

  if (plan === "enterprise") {
    // Enterprise requires a custom quote — return contact info
    return NextResponse.json({
      requiresContact: true,
      message: "Pour le plan Enterprise, veuillez contacter notre équipe commerciale.",
      email: "sales@verifscan.sn",
    });
  }

  try {
    await upgradePlan(user.id, plan as PlanId);

    return NextResponse.json({
      success: true,
      plan: planDef,
      paymentMethod,
      message: `Abonnement au plan ${planDef.name} activé avec succès.`,
    });
  } catch (e) {
    console.error("[subscriptions/subscribe] error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

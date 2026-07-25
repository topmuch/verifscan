import { NextResponse } from "next/server";
import { z } from "zod";
import { requireFabricant } from "@/lib/session";
import { upgradePlan, PLANS, PlanId } from "@/lib/subscription";

const schema = z.object({
  plan: z.enum(["starter", "pro", "enterprise"]),
});

/**
 * Upgrades/downgrades the user's plan.
 */
export async function PUT(req: Request) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  const { plan } = parsed.data;

  if (plan === "enterprise") {
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
      plan: PLANS[plan as PlanId],
      message: `Plan mis à jour vers ${PLANS[plan as PlanId].name}.`,
    });
  } catch (e) {
    console.error("[subscriptions/upgrade] error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

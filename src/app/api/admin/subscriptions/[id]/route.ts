import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";

const PLAN_QUOTAS: Record<string, { qrCodesLimit: number; productsLimit: number }> = {
  starter: { qrCodesLimit: 500, productsLimit: 5 },
  pro: { qrCodesLimit: 5000, productsLimit: -1 },
  enterprise: { qrCodesLimit: 100000, productsLimit: -1 },
};

const updateSchema = z.object({
  plan: z.enum(["starter", "pro", "enterprise"]).optional(),
  status: z.enum(["trial", "active", "past_due", "canceled"]).optional(),
  qrCodesLimit: z.number().int().positive().optional(),
  productsLimit: z.number().int().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

/**
 * Update a subscription (plan change, status, quotas).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const sub = await db.subscription.findUnique({ where: { id } });
  if (!sub) {
    return NextResponse.json({ error: "Abonnement introuvable" }, { status: 404 });
  }

  const update: any = { ...parsed.data };
  // If plan changes, also update quotas unless explicitly overridden
  if (parsed.data.plan && parsed.data.plan !== sub.plan) {
    const quotas = PLAN_QUOTAS[parsed.data.plan];
    if (quotas) {
      if (parsed.data.qrCodesLimit === undefined) update.qrCodesLimit = quotas.qrCodesLimit;
      if (parsed.data.productsLimit === undefined) update.productsLimit = quotas.productsLimit;
    }
  }

  const updated = await db.subscription.update({
    where: { id },
    data: update,
    include: { user: { select: { companyName: true, email: true } } },
  });

  return NextResponse.json(updated);
}

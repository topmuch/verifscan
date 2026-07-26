import { db } from "@/lib/db";

// === Définition des plans d'abonnement ===

export type PlanId = "starter" | "pro" | "enterprise";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  price: number; // FCFA / mois
  productsLimit: number; // -1 = illimité
  qrCodesLimit: number; // QR codes / mois
  features: {
    statistics: "basic" | "advanced";
    support: "email" | "priority" | "dedicated";
    api: boolean;
    bulkQr: boolean;
    customQr: boolean;
    pdfLabels: boolean;
    exports: boolean;
  };
  description: string;
  highlighted?: boolean;
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 10000,
    productsLimit: 5,
    qrCodesLimit: 500,
    features: {
      statistics: "basic",
      support: "email",
      api: false,
      bulkQr: false,
      customQr: false,
      pdfLabels: false,
      exports: false,
    },
    description: "Pour les petits fabricants qui démarrent",
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 25000,
    productsLimit: -1, // illimité
    qrCodesLimit: 5000,
    features: {
      statistics: "advanced",
      support: "priority",
      api: false,
      bulkQr: true,
      customQr: true,
      pdfLabels: true,
      exports: true,
    },
    description: "Pour les fabricants en croissance",
    highlighted: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 0, // sur devis
    productsLimit: -1,
    qrCodesLimit: -1,
    features: {
      statistics: "advanced",
      support: "dedicated",
      api: true,
      bulkQr: true,
      customQr: true,
      pdfLabels: true,
      exports: true,
    },
    description: "Pour les grandes entreprises (sur devis)",
  },
};

export const PLAN_LIST = Object.values(PLANS);

// === Helpers de gestion d'abonnement ===

/**
 * Returns the user's subscription, creating a trial if none exists.
 */
export async function getOrCreateSubscription(userId: string) {
  let sub = await db.subscription.findUnique({
    where: { userId },
    include: { invoices: { orderBy: { createdAt: "desc" }, take: 10 } },
  });

  if (!sub) {
    // Start a 14-day trial on the Pro plan
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    sub = await db.subscription.create({
      data: {
        userId,
        plan: "pro",
        status: "trial",
        qrCodesLimit: PLANS.pro.qrCodesLimit,
        qrCodesUsed: 0,
        productsLimit: PLANS.pro.productsLimit,
        trialEndsAt,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndsAt,
      },
      include: { invoices: true },
    });
  }

  return sub;
}

/**
 * Check whether the user can perform a QR code generation,
 * based on their plan and quota.
 */
export async function canGenerateQrCodes(userId: string, count: number = 1): Promise<{
  allowed: boolean;
  reason?: string;
  subscription?: Awaited<ReturnType<typeof getOrCreateSubscription>>;
}> {
  const sub = await getOrCreateSubscription(userId);

  if (sub.status === "canceled" || sub.status === "past_due") {
    return { allowed: false, reason: "Abonnement inactif. Veuillez renouveler.", subscription: sub };
  }

  if (sub.qrCodesLimit !== -1) {
    const remaining = sub.qrCodesLimit - sub.qrCodesUsed;
    if (count > remaining) {
      return {
        allowed: false,
        reason: `Quota insuffisant. Il vous reste ${remaining} QR codes ce mois-ci.`,
        subscription: sub,
      };
    }
  }

  return { allowed: true, subscription: sub };
}

/**
 * Increments the QR code usage counter.
 */
export async function incrementQrUsage(userId: string, count: number = 1): Promise<void> {
  await db.subscription.update({
    where: { userId },
    data: { qrCodesUsed: { increment: count } },
  });
}

/**
 * Resets monthly QR code usage for all active subscriptions.
 * Should be called by a cron job on the 1st of each month.
 */
export async function resetMonthlyQuotas(): Promise<{ count: number }> {
  const result = await db.subscription.updateMany({
    where: { status: { in: ["active", "trial"] } },
    data: { qrCodesUsed: 0 },
  });
  return { count: result.count };
}

/**
 * Upgrades the user's plan.
 */
export async function upgradePlan(userId: string, planId: PlanId): Promise<void> {
  const plan = PLANS[planId];
  if (!plan) throw new Error("Plan invalide");

  const periodStart = new Date();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await db.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: planId,
      status: "active",
      qrCodesLimit: plan.qrCodesLimit,
      qrCodesUsed: 0,
      productsLimit: plan.productsLimit,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
    update: {
      plan: planId,
      status: "active",
      qrCodesLimit: plan.qrCodesLimit,
      productsLimit: plan.productsLimit,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
  });

  // Generate an invoice if not enterprise (sur devis)
  if (plan.price > 0) {
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const sub = await db.subscription.findUnique({ where: { userId } });
    if (sub) {
      await db.invoice.create({
        data: {
          userId,
          subscriptionId: sub.id,
          amount: plan.price,
          plan: planId,
          periodStart,
          periodEnd,
          status: "paid",
          paymentMethod: "manual",
          invoiceNumber,
        },
      });
    }
  }
}

/**
 * Returns the % of QR quota used for a user.
 */
export function getQuotaUsagePercent(subscription: { qrCodesLimit: number; qrCodesUsed: number }): number {
  if (subscription.qrCodesLimit === -1) return 0;
  if (subscription.qrCodesLimit === 0) return 100;
  return Math.round((subscription.qrCodesUsed / subscription.qrCodesLimit) * 100);
}

/**
 * Returns whether a plan supports a given feature.
 */
export function planSupports(planId: string, feature: keyof PlanDefinition["features"]): boolean {
  const plan = PLANS[planId as PlanId];
  if (!plan) return false;
  return Boolean(plan.features[feature]);
}

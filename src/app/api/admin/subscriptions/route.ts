import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";

const PLAN_QUOTAS: Record<string, { qrCodesLimit: number; productsLimit: number }> = {
  starter: { qrCodesLimit: 500, productsLimit: 5 },
  pro: { qrCodesLimit: 5000, productsLimit: -1 },
  enterprise: { qrCodesLimit: 100000, productsLimit: -1 },
};

/**
 * List all subscriptions (SuperAdmin only).
 */
export async function GET(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "all";
  const plan = url.searchParams.get("plan") || "all";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);

  const where: any = {};
  if (status !== "all") where.status = status;
  if (plan !== "all") where.plan = plan;

  const [total, subscriptions] = await Promise.all([
    db.subscription.count({ where }),
    db.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            companyName: true,
            email: true,
            logoUrl: true,
            isActive: true,
            createdAt: true,
            _count: { select: { products: true, scans: true } },
          },
        },
        _count: { select: { invoices: true } },
      },
    }),
  ]);

  // Compute MRR
  const PLAN_PRICES: Record<string, number> = {
    starter: 10000,
    pro: 25000,
    enterprise: 75000,
  };
  const allActive = await db.subscription.findMany({
    where: { status: { in: ["active", "trial"] } },
    select: { plan: true },
  });
  const mrr = allActive.reduce((sum, s) => sum + (PLAN_PRICES[s.plan] || 0), 0);

  const planCounts = await db.subscription.groupBy({ by: ["plan"], _count: true });
  const statusCounts = await db.subscription.groupBy({ by: ["status"], _count: true });

  return NextResponse.json({
    data: subscriptions,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    mrr,
    arr: mrr * 12,
    planCounts: planCounts.reduce((acc, p) => ({ ...acc, [p.plan]: p._count }), {}),
    statusCounts: statusCounts.reduce((acc, s) => ({ ...acc, [s.status]: s._count }), {}),
  });
}

/**
 * POST /api/admin/subscriptions
 *
 * Creates a new subscription for an existing user (who doesn't already have one).
 * Required body:
 *  - userId    : existing User.id (role=fabricant)
 *  - plan      : starter | pro | enterprise
 *  - status    : trial | active | past_due | suspended | canceled  (default trial)
 */
const createSchema = z.object({
  userId: z.string().min(1),
  plan: z.enum(["starter", "pro", "enterprise"]),
  status: z.enum(["trial", "active", "past_due", "suspended", "canceled"]).optional().default("trial"),
});

export async function POST(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
  }

  const { userId, plan, status } = parsed.data;

  // Verify the user exists and is a fabricant
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
  if (user.role !== "fabricant") {
    return NextResponse.json({ error: "L'utilisateur doit être un fabricant" }, { status: 400 });
  }

  // Check that the user doesn't already have a subscription
  const existing = await db.subscription.findUnique({ where: { userId } });
  if (existing) {
    return NextResponse.json({ error: "Cet utilisateur a déjà un abonnement" }, { status: 409 });
  }

  const quotas = PLAN_QUOTAS[plan];
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const sub = await db.subscription.create({
    data: {
      userId,
      plan,
      status,
      qrCodesLimit: quotas.qrCodesLimit,
      qrCodesUsed: 0,
      productsLimit: quotas.productsLimit,
      trialEndsAt: status === "trial" ? trialEndsAt : null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
    include: { user: { select: { companyName: true, email: true } } },
  });

  return NextResponse.json(sub, { status: 201 });
}

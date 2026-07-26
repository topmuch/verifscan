import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";

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

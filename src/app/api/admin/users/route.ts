import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";

/**
 * List all fabricant accounts with subscription + counts (SuperAdmin only).
 * Supports ?search=&status=&plan=&page=&pageSize= for filtering.
 */
export async function GET(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "all"; // all|active|inactive
  const plan = url.searchParams.get("plan") || "all"; // all|starter|pro|enterprise|trial
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);

  const where: any = { role: "fabricant" };
  if (search) {
    where.OR = [
      { companyName: { contains: search } },
      { email: { contains: search } },
    ];
  }
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;

  if (plan !== "all") {
    if (plan === "trial") {
      where.subscription = { status: "trial" };
    } else {
      where.subscription = { plan };
    }
  }

  const [total, fabricants] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        companyName: true,
        logoUrl: true,
        phone: true,
        whatsapp: true,
        emailContact: true,
        address: true,
        isActive: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
            qrCodesUsed: true,
            qrCodesLimit: true,
            productsLimit: true,
          },
        },
        _count: {
          select: {
            products: true,
            scans: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    data: fabricants,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

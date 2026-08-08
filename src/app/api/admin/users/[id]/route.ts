import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";

/**
 * Get full detail of one fabricant (SuperAdmin only).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      companyName: true,
      logoUrl: true,
      phone: true,
      whatsapp: true,
      emailContact: true,
      address: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      subscription: {
        select: {
          id: true,
          plan: true,
          status: true,
          qrCodesUsed: true,
          qrCodesLimit: true,
          productsLimit: true,
          trialEndsAt: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          invoices: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              invoiceNumber: true,
              amount: true,
              status: true,
              paymentMethod: true,
              paymentRef: true,
              periodStart: true,
              periodEnd: true,
              createdAt: true,
            },
          },
        },
      },
      products: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          brand: true,
          isVisible: true,
          category: { select: { name: true, icon: true } },
          _count: { select: { lots: true, } },
        },
      },
      _count: {
        select: {
          products: true,
          scans: true,
          notifications: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  // Recent scans (30 days)
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const scans = await db.scan.findMany({
    where: { userId: id, scannedAt: { gte: since } },
    select: { scannedAt: true, productId: true },
    orderBy: { scannedAt: "asc" },
    take: 1000,
  });

  // Group scans by day
  const scansByDay: { date: string; count: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = scans.filter(
      (s) => s.scannedAt.toISOString().slice(0, 10) === key
    ).length;
    scansByDay.push({ date: key, count });
  }

  return NextResponse.json({
    user,
    scansByDay,
    totalScans30d: scans.length,
  });
}

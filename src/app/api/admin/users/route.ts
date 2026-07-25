import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";

/**
 * List all fabricant accounts (SuperAdmin only).
 */
export async function GET() {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const fabricants = await db.user.findMany({
    where: { role: "fabricant" },
    orderBy: { createdAt: "desc" },
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
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  return NextResponse.json(fabricants);
}

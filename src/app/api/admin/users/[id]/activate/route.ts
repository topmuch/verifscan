import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";

const schema = z.object({
  isActive: z.boolean(),
});

/**
 * Activate / deactivate a fabricant account (SuperAdmin only).
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const target = await db.user.findUnique({ where: { id } });
  if (!target || target.role !== "fabricant") {
    return NextResponse.json({ error: "Fabricant introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "isActive requis" }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id },
    data: { isActive: parsed.data.isActive },
    select: {
      id: true,
      email: true,
      companyName: true,
      isActive: true,
    },
  });

  return NextResponse.json(updated);
}

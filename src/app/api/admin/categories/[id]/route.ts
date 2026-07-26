import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";

const updateSchema = z.object({
  name: z.string().min(3).max(50).optional(),
  icon: z.string().optional(),
  isActive: z.boolean().optional(),
});

/** Update a category */
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  try {
    const updated = await db.category.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Catégorie introuvable" }, { status: 404 });
    }
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Nom déjà utilisé" }, { status: 400 });
    }
    throw err;
  }
}

/** Delete a category (only if no products) */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const cat = await db.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!cat) {
    return NextResponse.json({ error: "Catégorie introuvable" }, { status: 404 });
  }

  if (cat._count.products > 0) {
    return NextResponse.json(
      { error: `Impossible de supprimer : ${cat._count.products} produit(s) utilisent cette catégorie` },
      { status: 400 }
    );
  }

  await db.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

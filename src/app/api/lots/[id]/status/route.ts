import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";

const schema = z.object({
  status: z.enum(["active", "recalled"]),
});

/** Toggle lot status (active / recalled). Fabricant owner only. */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const lot = await db.lot.findUnique({
    where: { id },
    include: { product: true },
  });
  if (!lot || lot.product.userId !== user.id) {
    return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const updated = await db.lot.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(updated);
}

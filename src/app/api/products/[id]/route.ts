import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";

/**
 * DELETE /api/products/[id]
 *
 * Soft-deletes a product owned by the authenticated fabricant.
 *
 * Cascades (handled by Prisma schema `onDelete: Cascade` on Lot + Product):
 *   - All lots under this product
 *   - All QR codes under those lots
 *   - All scans under those QR codes
 *   - All AI anomalies attached to those lots / this product
 *   - B2B product info, conversations referencing this product (SetNull)
 *
 * Returns 200 on success, 404 if not found / not owned, 401 if not logged in.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireFabricant();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const product = await db.product.findUnique({
    where: { id },
    select: { id: true, userId: true, name: true, _count: { select: { lots: true } } },
  });

  if (!product) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }
  if (product.userId !== user.id) {
    return NextResponse.json({ error: "Vous ne possédez pas ce produit" }, { status: 403 });
  }

  try {
    // Delete B2B product info first (it has a unique constraint on productId
    // and would block the cascade delete otherwise).
    await db.b2BProduct.deleteMany({ where: { productId: id } });

    // Delete AI predictions + anomalies attached to the product directly.
    await db.aIPrediction.deleteMany({ where: { productId: id } });
    await db.aIAnomaly.deleteMany({ where: { productId: id } });

    // Now delete the product — cascades to Lot → QRCode → Scan, and to
    // AIAnomaly (lotId SetNull), ExportDocument (lotId SetNull), etc.
    await db.product.delete({ where: { id } });

    return NextResponse.json({
      ok: true,
      deletedProductId: id,
      deletedProductName: product.name,
      cascadedLotsCount: product._count.lots,
    });
  } catch (err: any) {
    console.error("[products DELETE] error:", err);
    // If Prisma complains about a foreign-key constraint we missed, surface
    // a friendly message rather than a 500 with a stack trace.
    if (err?.code === "P2003" || err?.code === "P2014") {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer ce produit car il est référencé par des commandes B2B ou des contrats. Archivez-le (masquez-le) plutôt que de le supprimer.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de la suppression du produit" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";

/**
 * GET /api/products/[id]
 * Récupère un produit appartenant au fabricant connecté.
 * Inclut la catégorie (pour détecter pageTemplate export_produce) et les
 * champs spécifiques à l'export (variety, regionOfProduction, producerStory...).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireFabricant();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, icon: true, pageTemplate: true } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }
  if (product.userId !== user.id) {
    return NextResponse.json({ error: "Vous ne possédez pas ce produit" }, { status: 403 });
  }

  return NextResponse.json(product);
}

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  brand: z.string().min(1).optional(),
  description: z.string().optional().or(z.literal("")),
  photoUrl: z.string().optional().or(z.literal("")),
  weight: z.string().optional().or(z.literal("")),
  categoryId: z.string().min(1).optional(),
  isVisible: z.boolean().optional(),
  // Code-barres produit (EAN-13, EAN-8, UPC-A, Code 128...)
  barcode: z.string().optional().or(z.literal("")),
  // Champs spécifiques au template export_produce
  variety: z.string().optional().or(z.literal("")),
  regionOfProduction: z.string().optional().or(z.literal("")),
  producerStory: z.string().optional().or(z.literal("")),
  producerPhotoUrl: z.string().optional().or(z.literal("")),
  gpsLat: z.number().optional().nullable(),
  gpsLng: z.number().optional().nullable(),
});

/**
 * PUT /api/products/[id]
 * Met à jour un produit appartenant au fabricant connecté.
 * Si la catégorie change pour une catégorie `export_produce`, les champs
 * spécifiques (variety, etc.) deviennent visibles côté UI mais restent
 * optionnels côté API.
 */
export async function PUT(
  req: Request,
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
    select: { id: true, userId: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }
  if (product.userId !== user.id) {
    return NextResponse.json({ error: "Vous ne possédez pas ce produit" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Si la catégorie change, vérifier qu'elle existe
  if (data.categoryId) {
    const cat = await db.category.findUnique({
      where: { id: data.categoryId },
      select: { id: true },
    });
    if (!cat) {
      return NextResponse.json({ error: "Catégorie introuvable" }, { status: 400 });
    }
  }

  // Pour les champs texte vides, on convertit "" en null/undefined pour
  // éviter d'écraser une valeur existante avec une chaîne vide.
  const cleanData: Record<string, unknown> = { ...data };
  if ("description" in cleanData && cleanData.description === "") cleanData.description = null;
  if ("photoUrl" in cleanData && cleanData.photoUrl === "") cleanData.photoUrl = null;
  if ("weight" in cleanData && cleanData.weight === "") cleanData.weight = null;
  if ("barcode" in cleanData && cleanData.barcode === "") cleanData.barcode = null;
  if ("variety" in cleanData && cleanData.variety === "") cleanData.variety = null;
  if ("regionOfProduction" in cleanData && cleanData.regionOfProduction === "")
    cleanData.regionOfProduction = null;
  if ("producerStory" in cleanData && cleanData.producerStory === "")
    cleanData.producerStory = null;
  if ("producerPhotoUrl" in cleanData && cleanData.producerPhotoUrl === "")
    cleanData.producerPhotoUrl = null;

  try {
    const updated = await db.product.update({
      where: { id },
      data: cleanData as any,
      include: {
        category: { select: { id: true, name: true, icon: true, pageTemplate: true } },
      },
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("[products PUT] error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du produit" },
      { status: 500 }
    );
  }
}

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

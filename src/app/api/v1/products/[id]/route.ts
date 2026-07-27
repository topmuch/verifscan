import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiKey, canRead, canWrite } from "@/lib/session";
import { dispatchWebhookEvent } from "@/lib/webhooks";

/**
 * GET /api/v1/products/[id]
 *
 * Récupère un produit spécifique appartenant au propriétaire de la clé API.
 *
 * Headers: Authorization: Bearer vsk_live_xxx
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiUser = await requireApiKey(req);
  if (!apiUser) {
    return NextResponse.json(
      { error: "Clé API invalide ou manquante" },
      { status: 401 }
    );
  }
  if (!canRead(apiUser.permissions)) {
    return NextResponse.json({ error: "Permission 'read' requise" }, { status: 403 });
  }

  const { id } = await params;

  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, icon: true, pageTemplate: true } },
      _count: { select: { lots: true } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }
  if (product.userId !== apiUser.id) {
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
  barcode: z.string().optional().or(z.literal("")),
  variety: z.string().optional().or(z.literal("")),
  regionOfProduction: z.string().optional().or(z.literal("")),
  producerStory: z.string().optional().or(z.literal("")),
  producerPhotoUrl: z.string().optional().or(z.literal("")),
  gpsLat: z.number().optional().nullable(),
  gpsLng: z.number().optional().nullable(),
});

/**
 * PUT /api/v1/products/[id]
 *
 * Met à jour un produit existant.
 * Nécessite la permission 'readwrite' ou 'admin'.
 *
 * Headers: Authorization: Bearer vsk_live_xxx
 * Body: n'importe quel sous-ensemble des champs du produit
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiUser = await requireApiKey(req);
  if (!apiUser) {
    return NextResponse.json(
      { error: "Clé API invalide ou manquante" },
      { status: 401 }
    );
  }
  if (!canWrite(apiUser.permissions)) {
    return NextResponse.json(
      { error: "Permission 'readwrite' ou 'admin' requise" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const product = await db.product.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }
  if (product.userId !== apiUser.id) {
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

  // Convertir les chaînes vides en null pour les champs optionnels
  const cleanData: Record<string, unknown> = { ...data };
  for (const key of [
    "description",
    "photoUrl",
    "weight",
    "barcode",
    "variety",
    "regionOfProduction",
    "producerStory",
    "producerPhotoUrl",
  ]) {
    if (key in cleanData && cleanData[key] === "") cleanData[key] = null;
  }

  try {
    const updated = await db.product.update({
      where: { id },
      data: cleanData as any,
      include: {
        category: { select: { id: true, name: true, icon: true, pageTemplate: true } },
      },
    });

    // Fire-and-forget webhook
    dispatchWebhookEvent(apiUser.id, "product_updated", {
      product: {
        id: updated.id,
        name: updated.name,
        brand: updated.brand,
        categoryId: updated.categoryId,
      },
      updatedAt: updated.updatedAt.toISOString(),
    }).catch(() => {});

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("[v1/products PUT] error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du produit" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/products/[id]
 *
 * Supprime un produit. CASCADE sur tous les lots, QR codes, scans associés.
 * Nécessite la permission 'readwrite' ou 'admin'.
 *
 * Headers: Authorization: Bearer vsk_live_xxx
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiUser = await requireApiKey(req);
  if (!apiUser) {
    return NextResponse.json(
      { error: "Clé API invalide ou manquante" },
      { status: 401 }
    );
  }
  if (!canWrite(apiUser.permissions)) {
    return NextResponse.json(
      { error: "Permission 'readwrite' ou 'admin' requise" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const product = await db.product.findUnique({
    where: { id },
    select: { id: true, userId: true, name: true, _count: { select: { lots: true } } },
  });

  if (!product) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }
  if (product.userId !== apiUser.id) {
    return NextResponse.json({ error: "Vous ne possédez pas ce produit" }, { status: 403 });
  }

  try {
    // Nettoyer les dépendances qui pourraient bloquer la cascade
    await db.b2BProduct.deleteMany({ where: { productId: id } });
    await db.aIPrediction.deleteMany({ where: { productId: id } });
    await db.aIAnomaly.deleteMany({ where: { productId: id } });

    await db.product.delete({ where: { id } });

    return NextResponse.json({
      ok: true,
      deletedProductId: id,
      deletedProductName: product.name,
      cascadedLotsCount: product._count.lots,
    });
  } catch (err: any) {
    console.error("[v1/products DELETE] error:", err);
    if (err?.code === "P2003" || err?.code === "P2014") {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer ce produit car il est référencé par des commandes B2B ou des contrats.",
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

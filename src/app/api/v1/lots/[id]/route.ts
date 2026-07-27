import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiKey, canRead, canWrite } from "@/lib/session";
import { dispatchWebhookEvent } from "@/lib/webhooks";

/**
 * GET /api/v1/lots/[id]
 *
 * Récupère un lot spécifique appartenant au propriétaire de la clé API.
 * Inclut le produit parent + le QR code actif.
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

  const lot = await db.lot.findUnique({
    where: { id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          brand: true,
          barcode: true,
          photoUrl: true,
          weight: true,
          userId: true,
        },
      },
      qrCodes: {
        where: { isActive: true },
        select: { id: true, qrCodeImageUrl: true, publicUrl: true },
        take: 1,
      },
    },
  });

  if (!lot) {
    return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });
  }
  if (lot.product.userId !== apiUser.id) {
    return NextResponse.json({ error: "Vous ne possédez pas ce lot" }, { status: 403 });
  }

  return NextResponse.json(lot);
}

const updateSchema = z.object({
  lotNumber: z.string().min(3).max(60).optional(),
  manufacturingDate: z.string().optional(),
  expirationDate: z.string().optional(),
  ingredients: z.string().optional().or(z.literal("")),
  manufacturingLocation: z.string().optional().or(z.literal("")),
  transformationLocation: z.string().optional().or(z.literal("")),
  salesCountries: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "recalled"]).optional(),
  recallReason: z.string().optional().or(z.literal("")),
  // Champs export_produce
  harvestDate: z.string().optional(),
  packagingDate: z.string().optional(),
  packagingStation: z.string().optional().or(z.literal("")),
  containerNumber: z.string().optional().or(z.literal("")),
  palletNumber: z.string().optional().or(z.literal("")),
  shipDate: z.string().optional(),
  destination: z.string().optional().or(z.literal("")),
  carrier: z.string().optional().or(z.literal("")),
  caliber: z.string().optional().or(z.literal("")),
  avgWeightGram: z.number().int().positive().optional().nullable(),
  brix: z.number().min(0).max(100).optional().nullable(),
  storageTempC: z.number().optional().nullable(),
  shelfLifeDays: z.number().int().positive().optional().nullable(),
});

/**
 * PUT /api/v1/lots/[id]
 *
 * Met à jour un lot existant.
 * Si status passe à 'recalled', recallReason devrait être fourni.
 * Nécessite la permission 'readwrite' ou 'admin'.
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

  const lot = await db.lot.findUnique({
    where: { id },
    include: {
      product: { select: { userId: true, name: true, brand: true } },
    },
  });

  if (!lot) {
    return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });
  }
  if (lot.product.userId !== apiUser.id) {
    return NextResponse.json({ error: "Vous ne possédez pas ce lot" }, { status: 403 });
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

  // Si lotNumber change, vérifier l'unicité
  if (data.lotNumber && data.lotNumber !== lot.lotNumber) {
    const existing = await db.lot.findUnique({ where: { lotNumber: data.lotNumber } });
    if (existing) {
      return NextResponse.json({ error: "Numéro de lot déjà utilisé" }, { status: 400 });
    }
  }

  // Si les dates changent, les valider
  let mfg = lot.manufacturingDate;
  let exp = lot.expirationDate;
  if (data.manufacturingDate) {
    mfg = new Date(data.manufacturingDate);
    if (isNaN(mfg.getTime())) {
      return NextResponse.json({ error: "manufacturingDate invalide" }, { status: 400 });
    }
  }
  if (data.expirationDate) {
    exp = new Date(data.expirationDate);
    if (isNaN(exp.getTime())) {
      return NextResponse.json({ error: "expirationDate invalide" }, { status: 400 });
    }
  }
  if (exp <= mfg) {
    return NextResponse.json(
      { error: "La date de péremption doit être postérieure à la fabrication" },
      { status: 400 }
    );
  }

  // Préparer les données à mettre à jour
  const updateData: Record<string, unknown> = {};
  if (data.lotNumber !== undefined) updateData.lotNumber = data.lotNumber;
  updateData.manufacturingDate = mfg;
  updateData.expirationDate = exp;
  if (data.ingredients !== undefined) updateData.ingredients = data.ingredients || null;
  if (data.manufacturingLocation !== undefined) updateData.manufacturingLocation = data.manufacturingLocation || null;
  if (data.transformationLocation !== undefined) updateData.transformationLocation = data.transformationLocation || null;
  if (data.salesCountries !== undefined) updateData.salesCountries = data.salesCountries || null;
  if (data.status !== undefined) {
    updateData.status = data.status;
    if (data.status === "recalled" && lot.status !== "recalled") {
      updateData.recalledAt = new Date();
      if (data.recallReason) updateData.recallReason = data.recallReason;
    } else if (data.status === "active") {
      updateData.recalledAt = null;
      updateData.recallReason = null;
    }
  } else if (data.recallReason !== undefined) {
    updateData.recallReason = data.recallReason || null;
  }

  // Champs export_produce
  if (data.harvestDate !== undefined) {
    const d = data.harvestDate ? new Date(data.harvestDate) : null;
    updateData.harvestDate = d && !isNaN(d.getTime()) ? d : null;
  }
  if (data.packagingDate !== undefined) {
    const d = data.packagingDate ? new Date(data.packagingDate) : null;
    updateData.packagingDate = d && !isNaN(d.getTime()) ? d : null;
  }
  if (data.shipDate !== undefined) {
    const d = data.shipDate ? new Date(data.shipDate) : null;
    updateData.shipDate = d && !isNaN(d.getTime()) ? d : null;
  }
  if (data.packagingStation !== undefined) updateData.packagingStation = data.packagingStation || null;
  if (data.containerNumber !== undefined) updateData.containerNumber = data.containerNumber || null;
  if (data.palletNumber !== undefined) updateData.palletNumber = data.palletNumber || null;
  if (data.destination !== undefined) updateData.destination = data.destination || null;
  if (data.carrier !== undefined) updateData.carrier = data.carrier || null;
  if (data.caliber !== undefined) updateData.caliber = data.caliber || null;
  if (data.avgWeightGram !== undefined) updateData.avgWeightGram = data.avgWeightGram;
  if (data.brix !== undefined) updateData.brix = data.brix;
  if (data.storageTempC !== undefined) updateData.storageTempC = data.storageTempC;
  if (data.shelfLifeDays !== undefined) updateData.shelfLifeDays = data.shelfLifeDays;

  try {
    const updated = await db.lot.update({
      where: { id },
      data: updateData as any,
      include: {
        product: { select: { id: true, name: true, brand: true } },
        qrCodes: { where: { isActive: true }, select: { id: true, publicUrl: true }, take: 1 },
      },
    });

    // Fire-and-forget webhook
    dispatchWebhookEvent(apiUser.id, "lot_updated", {
      lot: {
        id: updated.id,
        lotNumber: updated.lotNumber,
        productId: updated.productId,
        productName: updated.product.name,
        productBrand: updated.product.brand,
        status: updated.status,
        recalledAt: updated.recalledAt,
      },
      updatedAt: updated.updatedAt.toISOString(),
    }).catch(() => {});

    // Si le lot passe en recalled, déclencher aussi l'event 'recall'
    if (data.status === "recalled" && lot.status !== "recalled") {
      dispatchWebhookEvent(apiUser.id, "recall", {
        lot: {
          id: updated.id,
          lotNumber: updated.lotNumber,
          productId: updated.productId,
          productName: updated.product.name,
        },
        reason: data.recallReason || "Raison non précisée",
        recalledAt: updated.recalledAt?.toISOString(),
      }).catch(() => {});
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("[v1/lots PUT] error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du lot" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/lots/[id]
 *
 * Supprime un lot. CASCADE sur tous les QR codes, scans associés.
 * Nécessite la permission 'readwrite' ou 'admin'.
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

  const lot = await db.lot.findUnique({
    where: { id },
    include: {
      product: { select: { userId: true } },
      _count: { select: { qrCodes: true } },
    },
  });

  if (!lot) {
    return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });
  }
  if (lot.product.userId !== apiUser.id) {
    return NextResponse.json({ error: "Vous ne possédez pas ce lot" }, { status: 403 });
  }

  try {
    await db.lot.delete({ where: { id } });

    return NextResponse.json({
      ok: true,
      deletedLotId: id,
      cascadedQrCodesCount: lot._count.qrCodes,
    });
  } catch (err: any) {
    console.error("[v1/lots DELETE] error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du lot" },
      { status: 500 }
    );
  }
}

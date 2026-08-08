import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiKey, canRead, canWrite } from "@/lib/session";
import { resolveAppUrl } from "@/lib/qr";
import { dispatchWebhookEvent } from "@/lib/webhooks";

/**
 * GET /api/v1/lots
 *
 * Lists the API key owner's lots (with product + QR code info).
 *
 * Query params:
 *   - search: string (lot number search)
 *   - productId: string
 *   - status: 'active' | 'recalled'
 *   - limit: number (default 50, max 100)
 *   - offset: number (default 0)
 *
 * Headers: Authorization: Bearer vsk_live_xxx
 */
export async function GET(req: Request) {
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

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() || "";
  const productId = url.searchParams.get("productId") || "";
  const status = url.searchParams.get("status") || "";
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0"));

  const where: any = { product: { userId: apiUser.id } };
  if (search) {
    where.lotNumber = { contains: search };
  }
  if (productId) where.productId = productId;
  if (status === "active" || status === "recalled") {
    where.status = status;
  }

  const [items, total] = await Promise.all([
    db.lot.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        product: {
          select: { id: true, name: true, brand: true, barcode: true, photoUrl: true, weight: true },
        },
        qrCodes: {
          where: { isActive: true },
          select: { id: true, qrCodeImageUrl: true, publicUrl: true },
          take: 1,
        },
      },
    }),
    db.lot.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    limit,
    offset,
    hasMore: offset + items.length < total,
  });
}

const createSchema = z.object({
  productId: z.string().min(1, "productId est requis"),
  lotNumber: z.string().min(3).max(60).optional(),
  manufacturingDate: z.string(),
  expirationDate: z.string(),
  ingredients: z.string().optional(),
  manufacturingLocation: z.string().optional(),
  transformationLocation: z.string().optional(),
  salesCountries: z.string().optional(),
  status: z.enum(["active", "recalled"]).default("active"),
  // Champs spécifiques au template export_produce
  harvestDate: z.string().optional(),
  packagingDate: z.string().optional(),
  packagingStation: z.string().optional(),
  containerNumber: z.string().optional(),
  palletNumber: z.string().optional(),
  shipDate: z.string().optional(),
  destination: z.string().optional(),
  carrier: z.string().optional(),
  caliber: z.string().optional(),
  avgWeightGram: z.number().int().positive().optional(),
  brix: z.number().min(0).max(100).optional(),
  storageTempC: z.number().optional(),
  shelfLifeDays: z.number().int().positive().optional(),
  // Option: générer automatiquement le QR code (default true)
  generateQrCode: z.boolean().default(true),
});

/**
 * POST /api/v1/lots
 *
 * Crée un nouveau lot pour un produit appartenant au propriétaire de la clé API.
 * Un QR code est automatiquement généré (generateQrCode=true par défaut).
 * Nécessite la permission 'readwrite' ou 'admin'.
 *
 * Headers: Authorization: Bearer vsk_live_xxx
 * Body: { productId, lotNumber?, manufacturingDate, expirationDate, ... }
 *
 * Retourne 201 + { lot, qrCode }.
 * Déclenche aussi le webhook 'lot_created' si configuré.
 */
export async function POST(req: Request) {
  const apiUser = await requireApiKey(req);
  if (!apiUser) {
    return NextResponse.json(
      { error: "Clé API invalide ou manquante" },
      { status: 401 }
    );
  }
  if (!canWrite(apiUser.permissions)) {
    return NextResponse.json(
      { error: "Permission 'readwrite' ou 'admin' requise pour créer un lot" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Vérifier que le produit appartient au fabricant
  const product = await db.product.findUnique({
    where: { id: data.productId },
    select: { id: true, userId: true, name: true, brand: true },
  });
  if (!product || product.userId !== apiUser.id) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }

  // Valider les dates
  const mfg = new Date(data.manufacturingDate);
  const exp = new Date(data.expirationDate);
  if (isNaN(mfg.getTime()) || isNaN(exp.getTime())) {
    return NextResponse.json({ error: "Dates invalides" }, { status: 400 });
  }
  if (exp <= mfg) {
    return NextResponse.json(
      { error: "La date de péremption doit être postérieure à la fabrication" },
      { status: 400 }
    );
  }

  // Générer un numéro de lot si non fourni
  let lotNumber = data.lotNumber?.trim();
  if (!lotNumber) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const random = Math.floor(1000 + Math.random() * 9000);
    lotNumber = `LOT-${yyyy}${mm}${dd}-${random}`;
  }

  // Vérifier l'unicité du numéro de lot
  const existing = await db.lot.findUnique({ where: { lotNumber } });
  if (existing) {
    return NextResponse.json({ error: "Numéro de lot déjà utilisé" }, { status: 400 });
  }

  // Parser les dates optionnelles export_produce
  const harvestDate = data.harvestDate ? new Date(data.harvestDate) : null;
  const packagingDate = data.packagingDate ? new Date(data.packagingDate) : null;
  const shipDate = data.shipDate ? new Date(data.shipDate) : null;

  try {
    const lot = await db.lot.create({
      data: {
        productId: data.productId,
        lotNumber,
        manufacturingDate: mfg,
        expirationDate: exp,
        ingredients: data.ingredients?.trim() || null,
        manufacturingLocation: data.manufacturingLocation?.trim() || null,
        transformationLocation: data.transformationLocation?.trim() || null,
        salesCountries: data.salesCountries?.trim() || null,
        status: data.status,
        harvestDate: harvestDate && !isNaN(harvestDate.getTime()) ? harvestDate : null,
        packagingDate: packagingDate && !isNaN(packagingDate.getTime()) ? packagingDate : null,
        packagingStation: data.packagingStation?.trim() || null,
        containerNumber: data.containerNumber?.trim() || null,
        palletNumber: data.palletNumber?.trim() || null,
        shipDate: shipDate && !isNaN(shipDate.getTime()) ? shipDate : null,
        destination: data.destination?.trim() || null,
        carrier: data.carrier?.trim() || null,
        caliber: data.caliber?.trim() || null,
        avgWeightGram: data.avgWeightGram ?? null,
        brix: data.brix ?? null,
        storageTempC: data.storageTempC ?? null,
        shelfLifeDays: data.shelfLifeDays ?? null,
      },
    });

    // Générer le QR code automatiquement
    let qrCode: any = null;
    if (data.generateQrCode) {
      const QRCode = (await import("qrcode")).default;
      const publicUrl = `/p/${lot.id}`;
      const appUrl = resolveAppUrl(req);
      const fullUrl = `${appUrl}${publicUrl}`;
      const qrImage = await QRCode.toDataURL(fullUrl, {
        width: 512,
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: "#065f46", light: "#ffffff" },
      });

      qrCode = await db.qRCode.create({
        data: {
          lotId: lot.id,
          publicUrl,
          qrCodeImageUrl: qrImage,
          isActive: true,
        },
      });
    }

    // Fire-and-forget webhook
    dispatchWebhookEvent(apiUser.id, "lot_created", {
      lot: {
        id: lot.id,
        lotNumber: lot.lotNumber,
        productId: lot.productId,
        productName: product.name,
        productBrand: product.brand,
        manufacturingDate: lot.manufacturingDate.toISOString(),
        expirationDate: lot.expirationDate.toISOString(),
        status: lot.status,
      },
      qrCode: qrCode
        ? {
            id: qrCode.id,
            publicUrl: qrCode.publicUrl,
            fullUrl: `${resolveAppUrl(req)}${qrCode.publicUrl}`,
          }
        : null,
      createdAt: lot.createdAt.toISOString(),
    }).catch(() => {});

    return NextResponse.json({ lot, qrCode }, { status: 201 });
  } catch (err: any) {
    console.error("[v1/lots POST] error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la création du lot" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";
import { resolveAppUrl } from "@/lib/qr";

const createSchema = z.object({
  productId: z.string().min(1),
  lotNumber: z.string().min(3).max(60).optional(),
  manufacturingDate: z.string(),
  expirationDate: z.string(),
  ingredients: z.string().optional(),
  manufacturingLocation: z.string().optional(),
  transformationLocation: z.string().optional(),
  salesCountries: z.string().optional(),
  status: z.enum(["active", "recalled"]).default("active"),
  // Champs spécifiques au template export_produce (ignorés pour les autres templates)
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
});

/** List lots for the logged-in fabricant. */
export async function GET(req: Request) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const productId = url.searchParams.get("productId") || undefined;

  const where: any = { product: { userId: user.id } };
  if (productId) where.productId = productId;

  const lots = await db.lot.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, name: true, brand: true, photoUrl: true } },
      qrCodes: { select: { id: true, qrCodeImageUrl: true, isActive: true } },
      _count: { select: { qrCodes: true } },
    },
  });
  return NextResponse.json({ lots });
}

/** Create lot + auto-generate QR code. */
export async function POST(req: Request) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // Verify the product belongs to the fabricant
    const product = await db.product.findUnique({ where: { id: data.productId } });
    if (!product || product.userId !== user.id) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

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

    // Generate lot number if not provided
    let lotNumber = data.lotNumber?.trim();
    if (!lotNumber) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const random = Math.floor(1000 + Math.random() * 9000);
      lotNumber = `LOT-${yyyy}${mm}${dd}-${random}`;
    }

    // Check uniqueness
    const existing = await db.lot.findUnique({ where: { lotNumber } });
    if (existing) {
      return NextResponse.json({ error: "Numéro de lot déjà utilisé" }, { status: 400 });
    }

    // Parse optional export_produce date fields
    const harvestDate = data.harvestDate ? new Date(data.harvestDate) : null;
    const packagingDate = data.packagingDate ? new Date(data.packagingDate) : null;
    const shipDate = data.shipDate ? new Date(data.shipDate) : null;

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
        // Champs export_produce (ignorés pour les autres templates)
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

    // Auto-generate QR code
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

    const qr = await db.qRCode.create({
      data: {
        lotId: lot.id,
        publicUrl,
        qrCodeImageUrl: qrImage,
        isActive: true,
      },
    });

    return NextResponse.json(
      { lot, qrCode: qr },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[lots POST] error:", err);
    return NextResponse.json({ error: "Erreur lors de la création du lot" }, { status: 500 });
  }
}

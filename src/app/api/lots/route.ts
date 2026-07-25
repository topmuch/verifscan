import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";

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
      qrCodes: { select: { id: true, qrCodeImageUrl: true } },
      _count: { select: { scans: true } },
    },
  });
  return NextResponse.json(lots);
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
      },
    });

    // Auto-generate QR code
    const QRCode = (await import("qrcode")).default;
    const publicUrl = `/p/${lot.id}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://verifscan.sn";
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

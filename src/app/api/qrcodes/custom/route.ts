import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";
import { canGenerateQrCodes, incrementQrUsage } from "@/lib/subscription";
import { checkQuotaWarning } from "@/lib/notifications";
import { generateQrCodeDataUrl, getLotPublicUrl } from "@/lib/qr";

const schema = z.object({
  lotId: z.string().min(1),
  fgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  bgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  width: z.number().int().min(128).max(1024).optional(),
  margin: z.number().int().min(0).max(5).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

/**
 * Generates a custom QR code for a single lot (with logo/color/size).
 */
export async function POST(req: Request) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const { lotId, fgColor, bgColor, width, margin, logoUrl } = parsed.data;

  const lot = await db.lot.findUnique({
    where: { id: lotId },
    include: { product: { select: { name: true, brand: true, userId: true } } },
  });
  if (!lot || lot.product.userId !== user.id) {
    return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });
  }

  const quotaCheck = await canGenerateQrCodes(user.id, 1);
  if (!quotaCheck.allowed) {
    return NextResponse.json(
      { error: quotaCheck.reason, code: "QUOTA_EXCEEDED" },
      { status: 402 }
    );
  }

  const fullUrl = getLotPublicUrl(lot.id, req);

  const qrImage = await generateQrCodeDataUrl(fullUrl, {
    width: width ?? 512,
    margin: margin ?? 2,
    fgColor: fgColor || undefined,
    bgColor: bgColor || undefined,
    logoUrl: logoUrl || undefined,
  });

  // Deactivate old QR codes, create new one
  await db.qRCode.updateMany({
    where: { lotId: lot.id, isActive: true },
    data: { isActive: false },
  });

  const qr = await db.qRCode.create({
    data: {
      lotId: lot.id,
      publicUrl: `/p/${lot.id}`,
      qrCodeImageUrl: qrImage,
      fgColor: fgColor || null,
      bgColor: bgColor || null,
      size: width ?? null,
      logoUrl: logoUrl || null,
      isActive: true,
    },
  });

  await incrementQrUsage(user.id, 1);
  await checkQuotaWarning(user.id);

  return NextResponse.json({
    qrCode: qr,
    lot: {
      id: lot.id,
      lotNumber: lot.lotNumber,
      productName: lot.product.name,
      brand: lot.product.brand,
    },
  });
}

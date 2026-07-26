import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";
import { canGenerateQrCodes, incrementQrUsage } from "@/lib/subscription";
import { checkQuotaWarning } from "@/lib/notifications";
import { generateQrCodeDataUrl, getLotPublicUrl } from "@/lib/qr";

const schema = z.object({
  lotIds: z.array(z.string()).min(1).max(200),
  customization: z
    .object({
      fgColor: z.string().optional(),
      bgColor: z.string().optional(),
      width: z.number().int().min(128).max(1024).optional(),
      margin: z.number().int().min(0).max(5).optional(),
    })
    .optional(),
});

/**
 * Generates QR codes for multiple lots at once (bulk generation).
 * Each lot must belong to the authenticated fabricant.
 * Quota is checked and incremented.
 */
export async function POST(req: Request) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "lotIds (array) requis, max 200 par requête" },
      { status: 400 }
    );
  }

  const { lotIds, customization } = parsed.data;

  // Verify the fabricant owns all lots
  const lots = await db.lot.findMany({
    where: {
      id: { in: lotIds },
      product: { userId: user.id },
    },
    include: { product: { select: { name: true, brand: true } } },
  });

  if (lots.length === 0) {
    return NextResponse.json({ error: "Aucun lot valide trouvé" }, { status: 404 });
  }

  if (lots.length !== lotIds.length) {
    return NextResponse.json(
      { error: "Certains lots n'appartiennent pas à votre compte" },
      { status: 403 }
    );
  }

  // Check quota
  const quotaCheck = await canGenerateQrCodes(user.id, lots.length);
  if (!quotaCheck.allowed) {
    return NextResponse.json(
      { error: quotaCheck.reason, code: "QUOTA_EXCEEDED" },
      { status: 402 }
    );
  }

  // Generate QR codes
  const results: Array<{
    lotId: string;
    lotNumber: string;
    productName: string;
    brand: string;
    publicUrl: string;
    qrCodeDataUrl: string;
    qrCodeId: string;
  }> = [];

  for (const lot of lots) {
    const fullUrl = getLotPublicUrl(lot.id, req);

    const qrImage = await generateQrCodeDataUrl(fullUrl, {
      width: customization?.width ?? 512,
      margin: customization?.margin ?? 2,
      fgColor: customization?.fgColor,
      bgColor: customization?.bgColor,
    });

    // Deactivate old QR codes for this lot, create a new active one
    await db.qRCode.updateMany({
      where: { lotId: lot.id, isActive: true },
      data: { isActive: false },
    });

    const qr = await db.qRCode.create({
      data: {
        lotId: lot.id,
        publicUrl: `/p/${lot.id}`,
        qrCodeImageUrl: qrImage,
        fgColor: customization?.fgColor || null,
        bgColor: customization?.bgColor || null,
        size: customization?.width ?? null,
        isActive: true,
      },
    });

    results.push({
      lotId: lot.id,
      lotNumber: lot.lotNumber,
      productName: lot.product.name,
      brand: lot.product.brand,
      publicUrl: `/p/${lot.id}`,
      qrCodeDataUrl: qrImage,
      qrCodeId: qr.id,
    });
  }

  // Increment usage
  await incrementQrUsage(user.id, lots.length);
  await checkQuotaWarning(user.id);

  return NextResponse.json({
    count: results.length,
    qrCodes: results,
  });
}

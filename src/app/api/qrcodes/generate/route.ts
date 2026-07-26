import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";
import { resolveAppUrl } from "@/lib/qr";

const schema = z.object({
  lotId: z.string().min(1),
});

/**
 * (Re)generates a QR code for a given lot.
 * Returns the QR code data URL + the QRCode record.
 */
export async function POST(req: Request) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "lotId requis" }, { status: 400 });
  }

  const lot = await db.lot.findUnique({
    where: { id: parsed.data.lotId },
    include: { product: true },
  });
  if (!lot || lot.product.userId !== user.id) {
    return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });
  }

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

  // Deactivate old QR codes, create a new active one
  await db.qRCode.updateMany({
    where: { lotId: lot.id },
    data: { isActive: false },
  });
  const qr = await db.qRCode.create({
    data: {
      lotId: lot.id,
      publicUrl,
      qrCodeImageUrl: qrImage,
      isActive: true,
    },
  });

  return NextResponse.json({ qrCode: qr }, { status: 201 });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";

/**
 * Returns the QR code PNG (as data URL JSON) for download.
 * Fabricant owner only.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const qr = await db.qRCode.findUnique({
    where: { id },
    include: { lot: { include: { product: true } } },
  });
  if (!qr || qr.lot.product.userId !== user.id) {
    return NextResponse.json({ error: "QR code introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    id: qr.id,
    lotNumber: qr.lot.lotNumber,
    productName: qr.lot.product.name,
    publicUrl: qr.publicUrl,
    qrCodeImageUrl: qr.qrCodeImageUrl,
  });
}

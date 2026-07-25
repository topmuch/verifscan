import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Public lot detail (used by /p/[lotId] page, accessed by scanning QR codes).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lot = await db.lot.findUnique({
    where: { id },
    include: {
      product: {
        include: {
          category: true,
          user: {
            select: {
              id: true,
              companyName: true,
              logoUrl: true,
              phone: true,
              whatsapp: true,
              emailContact: true,
              address: true,
            },
          },
        },
      },
      qrCodes: { where: { isActive: true }, take: 1 },
    },
  });

  if (!lot) {
    return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });
  }

  return NextResponse.json(lot);
}

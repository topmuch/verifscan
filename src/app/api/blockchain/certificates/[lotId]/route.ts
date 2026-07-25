import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/blockchain/certificates/[lotId] — récupère le certificat blockchain d'un lot
export async function GET(_req: Request, { params }: { params: Promise<{ lotId: string }> }) {
  const { lotId } = await params;

  const certificate = await db.blockchainCertificate.findUnique({
    where: { lotId },
    include: {
      lot: {
        select: {
          lotNumber: true,
          manufacturingDate: true,
          expirationDate: true,
          productId: true,
          product: { select: { name: true, brand: true } },
        },
      },
    },
  });

  if (!certificate) {
    return NextResponse.json({ certified: false }, { status: 404 });
  }

  return NextResponse.json({
    certified: true,
    certificate,
    explorerUrl: `https://polygonscan.com/tx/${certificate.txHash}`,
  });
}

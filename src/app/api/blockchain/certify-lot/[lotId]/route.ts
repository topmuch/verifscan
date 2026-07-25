import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";
import { computeLotDataHash, simulateBlockchainWrite } from "@/lib/ai";
import { createNotification } from "@/lib/notifications";

// POST /api/blockchain/certify-lot/[lotId] — certifie un lot sur Polygon (simulé)
export async function POST(_req: Request, { params }: { params: Promise<{ lotId: string }> }) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { lotId } = await params;

  // Vérifie que le lot appartient au fabricant
  const lot = await db.lot.findUnique({
    where: { id: lotId },
    include: { product: { select: { userId: true, name: true } } },
  });
  if (!lot || lot.product.userId !== user.id) {
    return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });
  }

  // Vérifie qu'il n'est pas déjà certifié
  const existing = await db.blockchainCertificate.findUnique({ where: { lotId } });
  if (existing) {
    return NextResponse.json({ error: "Lot déjà certifié", certificate: existing }, { status: 400 });
  }

  // Calcule le hash des données
  const dataHash = computeLotDataHash({
    lotNumber: lot.lotNumber,
    manufacturingDate: lot.manufacturingDate,
    expirationDate: lot.expirationDate.toISOString(),
    productId: lot.productId,
    ingredients: lot.ingredients,
    salesCountries: lot.salesCountries,
  });

  // Simule l'écriture sur Polygon
  const { txHash, blockNumber, contractAddress } = simulateBlockchainWrite(dataHash);

  // Sauvegarde en base
  const certificate = await db.blockchainCertificate.create({
    data: {
      lotId,
      txHash,
      blockNumber,
      dataHash,
      contractAddress,
      network: "polygon",
    },
  });

  // Notification
  await createNotification({
    userId: user.id,
    type: "ai_anomaly",
    title: "Lot certifié sur la blockchain",
    message: `Le lot ${lot.lotNumber} (${lot.product.name}) est désormais certifié sur Polygon. Hash : ${dataHash.slice(0, 16)}...`,
    link: `/p/${lotId}`,
  });

  return NextResponse.json({
    certificate,
    explorerUrl: `https://polygonscan.com/tx/${txHash}`,
    message: "Lot certifié avec succès sur Polygon",
  });
}

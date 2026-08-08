import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Returns the consumer's scan history (anonymous, identified by deviceFingerprint).
 * Public endpoint — no auth required.
 *
 * Query params:
 *  - fp: device fingerprint (required)
 *  - limit: max results (default 50)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fp = searchParams.get("fp");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

    if (!fp) {
      return NextResponse.json({ error: "Empreinte appareil requise (fp)" }, { status: 400 });
    }

    const scans = await db.scan.findMany({
      where: { deviceFingerprint: fp },
      include: {
        qrCode: {
          select: {
            lot: {
              select: {
                id: true,
                lotNumber: true,
                status: true,
                expirationDate: true,
                product: { select: { id: true, name: true, brand: true, photoUrl: true } },
              },
            },
          },
        },
        reward: { select: { points: true } },
      },
      orderBy: { scannedAt: "desc" },
      take: limit,
    });

    const history = scans.map((s) => ({
      scanId: s.id,
      scannedAt: s.scannedAt,
      lotId: s.qrCode.lot.id,
      lotNumber: s.qrCode.lot.lotNumber,
      product: {
        id: s.qrCode.lot.product.id,
        name: s.qrCode.lot.product.name,
        brand: s.qrCode.lot.product.brand,
        photoUrl: s.qrCode.lot.product.photoUrl,
      },
      isAuthentic: s.qrCode.lot.status === "active",
      lotStatus: s.qrCode.lot.status,
      expirationDate: s.qrCode.lot.expirationDate,
      region: s.region,
      pointsEarned: s.reward?.points || 0,
      photoUrl: s.photoUrl,
    }));

    // Check for any active recalls affecting the user's scanned lots
    const lotIds = scans.map((s) => s.qrCode.lot.id);
    let recalls: { lotId: string; title: string; reason: string; severity: string }[] = [];

    if (lotIds.length > 0) {
      const recalledLots = await db.lot.findMany({
        where: { id: { in: lotIds }, status: "recalled" },
        select: {
          id: true,
          recallReason: true,
          product: { select: { name: true } },
        },
      });
      recalls = recalledLots.map((l) => ({
        lotId: l.id,
        title: `Lot rappelé — ${l.product.name}`,
        reason: l.recallReason || "Ce lot a été rappelé par le fabricant.",
        severity: "warning",
      }));
    }

    return NextResponse.json({
      history,
      recalls,
      totalScans: scans.length,
    });
  } catch (err) {
    console.error("[scans/history GET] error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

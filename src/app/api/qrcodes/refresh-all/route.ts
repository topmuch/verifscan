// POST /api/qrcodes/refresh-all
// Regenerates all QR codes for the authenticated fabricant using the
// current deployment URL (derived from request headers).
//
// Use this after migrating deployments (e.g. verifscan.sn -> verifscan.roomscan.pro)
// to fix QR codes that were generated with the wrong base URL.
//
// Body (optional):
//   { "lotIds": ["lot-id-1", "lot-id-2"] }
// If lotIds is omitted, ALL the fabricant's active QR codes are refreshed.
//
// Returns: { refreshed: number, skipped: number, lotIds: string[] }

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";
import { getLotPublicUrl } from "@/lib/qr";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireFabricant();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // empty body is OK — refresh all
  }
  const lotIdsFilter: string[] | undefined = Array.isArray(body?.lotIds)
    ? body.lotIds
    : undefined;

  // Find all the fabricant's lots + their active QR codes
  const lots = await db.lot.findMany({
    where: {
      product: { userId: user.id },
      ...(lotIdsFilter ? { id: { in: lotIdsFilter } } : {}),
    },
    include: {
      qrCodes: { where: { isActive: true } },
    },
  });

  let refreshed = 0;
  let skipped = 0;
  const refreshedLotIds: string[] = [];

  for (const lot of lots) {
    if (lot.qrCodes.length === 0) {
      skipped++;
      continue;
    }

    const fullUrl = getLotPublicUrl(lot.id, req);
    const qrImage = await QRCode.toDataURL(fullUrl, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#065f46", light: "#ffffff" },
    });

    // Update the active QR code in place (preserve its ID + scans history)
    await db.qRCode.update({
      where: { id: lot.qrCodes[0].id },
      data: { qrCodeImageUrl: qrImage },
    });

    refreshed++;
    refreshedLotIds.push(lot.id);
  }

  return NextResponse.json({
    ok: true,
    refreshed,
    skipped,
    lotIds: refreshedLotIds,
    note:
      refreshed > 0
        ? "QR codes regenerated. Old prints still embed the old URL — reprint them."
        : "No QR codes needed refreshing.",
  });
}

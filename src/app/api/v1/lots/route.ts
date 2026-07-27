import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiKey, canRead } from "@/lib/session";

/**
 * GET /api/v1/lots
 *
 * Lists the API key owner's lots (with product + QR code info).
 *
 * Query params:
 *   - search: string (lot number search)
 *   - productId: string
 *   - status: 'active' | 'recalled'
 *   - limit: number (default 50, max 100)
 *   - offset: number (default 0)
 *
 * Headers: Authorization: Bearer vsk_live_xxx
 */
export async function GET(req: Request) {
  const apiUser = await requireApiKey(req);
  if (!apiUser) {
    return NextResponse.json(
      { error: "Clé API invalide ou manquante" },
      { status: 401 }
    );
  }
  if (!canRead(apiUser.permissions)) {
    return NextResponse.json({ error: "Permission 'read' requise" }, { status: 403 });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() || "";
  const productId = url.searchParams.get("productId") || "";
  const status = url.searchParams.get("status") || "";
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0"));

  const where: any = { product: { userId: apiUser.id } };
  if (search) {
    where.lotNumber = { contains: search };
  }
  if (productId) where.productId = productId;
  if (status === "active" || status === "recalled") {
    where.status = status;
  }

  const [items, total] = await Promise.all([
    db.lot.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        product: {
          select: { id: true, name: true, brand: true, barcode: true, photoUrl: true, weight: true },
        },
        qrCodes: {
          where: { isActive: true },
          select: { id: true, qrCodeImageUrl: true, publicUrl: true },
          take: 1,
        },
      },
    }),
    db.lot.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    limit,
    offset,
    hasMore: offset + items.length < total,
  });
}

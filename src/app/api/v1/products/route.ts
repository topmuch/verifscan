import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiKey, canRead } from "@/lib/session";

/**
 * GET /api/v1/products
 *
 * Lists the API key owner's products (with category, lots count).
 *
 * Query params:
 *   - search: string
 *   - categoryId: string
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
  const categoryId = url.searchParams.get("categoryId") || "";
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0"));

  const where: any = { userId: apiUser.id };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { brand: { contains: search } },
      { barcode: { contains: search } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;

  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        category: { select: { id: true, name: true, icon: true, pageTemplate: true } },
        _count: { select: { lots: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    limit,
    offset,
    hasMore: offset + items.length < total,
  });
}

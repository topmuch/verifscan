import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Returns active recalls.
 * Public endpoint — used by /mon-historique to surface alerts.
 *
 * Query params:
 *  - productId: filter by product
 *  - lotId: filter by lot
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const lotId = searchParams.get("lotId");

    const where: any = { status: "active" };
    if (productId) where.productId = productId;
    if (lotId) where.lotIds = { contains: lotId };

    const recalls = await db.recall.findMany({
      where,
      orderBy: { recallDate: "desc" },
      take: 50,
    });

    return NextResponse.json({ recalls });
  } catch (err) {
    console.error("[recalls GET] error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

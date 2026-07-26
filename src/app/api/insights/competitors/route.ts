import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Returns the authenticated fabricant's market share vs anonymized competitors.
 * Premium feature — requires Pro or Enterprise plan.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const fabricantId = session.user.id;

    const sub = await db.subscription.findUnique({ where: { userId: fabricantId } });
    const plan = sub?.plan || "starter";
    if (plan === "starter") {
      return NextResponse.json({
        error: "Comparaison concurrents disponible à partir du plan Pro",
        upgradeRequired: true,
      }, { status: 402 });
    }

    // Get all fabricant products + their categories
    const myProducts = await db.product.findMany({
      where: { userId: fabricantId },
      select: { id: true, categoryId: true, name: true },
    });
    if (myProducts.length === 0) {
      return NextResponse.json({ benchmarks: [] });
    }

    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000); // last 30d

    // For each category the fabricant is in, compute share
    const categoryIds = Array.from(new Set(myProducts.map((p) => p.categoryId)));
    const myProductIds = myProducts.map((p) => p.id);

    const benchmarks = await Promise.all(
      categoryIds.map(async (categoryId) => {
        // Total scans in this category for the period
        const allScansInCategory = await db.scan.findMany({
          where: {
            scannedAt: { gte: periodStart, lte: periodEnd },
            qrCode: { lot: { product: { categoryId } } },
          },
          select: { qrCode: { select: { lot: { select: { productId: true } } } } },
        });

        const totalCategoryScans = allScansInCategory.length;
        if (totalCategoryScans === 0) {
          return {
            categoryId,
            categoryName: "",
            totalCategoryScans: 0,
            fabricantScans: 0,
            fabricantSharePct: 0,
            rank: 1,
            topCompetitorSharePct: null,
          };
        }

        // Group by product → group by fabricant
        const productScanMap = new Map<string, number>();
        for (const s of allScansInCategory) {
          const pid = s.qrCode.lot.productId;
          productScanMap.set(pid, (productScanMap.get(pid) || 0) + 1);
        }

        // Resolve fabricant per product
        const productsInCat = await db.product.findMany({
          where: { categoryId },
          select: { id: true, userId: true, name: true },
        });
        const productToFabricant = new Map(productsInCat.map((p) => [p.id, p.userId]));

        const fabricantScanMap = new Map<string, number>();
        for (const [pid, count] of productScanMap) {
          const fid = productToFabricant.get(pid);
          if (!fid) continue;
          fabricantScanMap.set(fid, (fabricantScanMap.get(fid) || 0) + count);
        }

        const sortedFabricants = Array.from(fabricantScanMap.entries()).sort((a, b) => b[1] - a[1]);
        const myScans = fabricantScanMap.get(fabricantId) || 0;
        const mySharePct = totalCategoryScans > 0 ? Math.round((myScans / totalCategoryScans) * 1000) / 10 : 0;
        const myRank = sortedFabricants.findIndex(([fid]) => fid === fabricantId) + 1;
        const topCompetitorSharePct = sortedFabricants.length > 0
          ? Math.round((sortedFabricants[0][1] / totalCategoryScans) * 1000) / 10
          : null;

        const categoryName = await db.category.findUnique({ where: { id: categoryId }, select: { name: true } });

        // Persist benchmark
        await db.competitorBenchmark.upsert({
          where: { id: `${fabricantId}_${categoryId}_${periodStart.toISOString()}` },
          update: {
            totalCategoryScans,
            fabricantScans: myScans,
            fabricantSharePct: mySharePct,
            rank: myRank || 1,
            topCompetitorSharePct,
          },
          create: {
            id: `${fabricantId}_${categoryId}_${periodStart.toISOString()}`,
            fabricantId,
            categoryId,
            periodStart,
            periodEnd,
            totalCategoryScans,
            fabricantScans: myScans,
            fabricantSharePct: mySharePct,
            rank: myRank || 1,
            topCompetitorSharePct,
          },
        }).catch(() => null); // ignore conflict errors

        return {
          categoryId,
          categoryName: categoryName?.name || "",
          totalCategoryScans,
          fabricantScans: myScans,
          fabricantSharePct: mySharePct,
          rank: myRank || 0,
          topCompetitorSharePct,
        };
      })
    );

    return NextResponse.json({ benchmarks });
  } catch (err) {
    console.error("[insights/competitors GET] error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

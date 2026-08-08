import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Generates (or returns the latest) weekly market insight report for the authenticated fabricant.
 * Premium feature — requires Pro or Enterprise plan.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const fabricantId = session.user.id;

    // Plan gate
    const sub = await db.subscription.findUnique({ where: { userId: fabricantId } });
    const plan = sub?.plan || "starter";
    if (plan === "starter") {
      return NextResponse.json({
        error: "Insights marché disponibles à partir du plan Pro",
        upgradeRequired: true,
        plan,
      }, { status: 402 });
    }

    // Period = last 7 days
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Try to find existing insight for this period
    let insight = await db.marketInsight.findFirst({
      where: { fabricantId, periodStart: { gte: periodStart } },
      orderBy: { generatedAt: "desc" },
    });

    if (!insight) {
      // Generate fresh
      const products = await db.product.findMany({
        where: { userId: fabricantId },
        select: { id: true },
      });
      const productIds = products.map((p) => p.id);

      const scans = await db.scan.findMany({
        where: {
          scannedAt: { gte: periodStart, lte: periodEnd },
          qrCode: { lot: { product: { id: { in: productIds } } } },
        },
        select: {
          scannedAt: true,
          region: true,
          deviceFingerprint: true,
        },
      });

      const totalScans = scans.length;
      const uniqueConsumers = new Set(scans.map((s) => s.deviceFingerprint || "anon")).size;

      // Region breakdown
      const regionMap = new Map<string, number>();
      for (const s of scans) {
        const r = s.region || "Inconnu";
        regionMap.set(r, (regionMap.get(r) || 0) + 1);
      }
      const regionsBreakdown = Array.from(regionMap.entries())
        .map(([region, count]) => ({ region, scans: count, share: totalScans > 0 ? Math.round((count / totalScans) * 100) : 0 }))
        .sort((a, b) => b.scans - a.scans);
      const topRegion = regionsBreakdown[0]?.region || null;

      // Day of week
      const dayMap = new Map<string, number>();
      const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
      for (const s of scans) {
        const d = dayNames[new Date(s.scannedAt).getDay()];
        dayMap.set(d, (dayMap.get(d) || 0) + 1);
      }
      const topDayEntry = Array.from(dayMap.entries()).sort((a, b) => b[1] - a[1])[0];
      const topDayOfWeek = topDayEntry?.[0] || null;

      // Top hour
      const hourMap = new Map<number, number>();
      for (const s of scans) {
        const h = new Date(s.scannedAt).getHours();
        hourMap.set(h, (hourMap.get(h) || 0) + 1);
      }
      const topHourEntry = Array.from(hourMap.entries()).sort((a, b) => b[1] - a[1])[0];
      const topHour = topHourEntry?.[0] ?? null;

      // Compare with previous period
      const prevStart = new Date(periodStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      const prevScans = await db.scan.count({
        where: {
          scannedAt: { gte: prevStart, lte: periodStart },
          qrCode: { lot: { product: { id: { in: productIds } } } },
        },
      });
      const growthPct = prevScans > 0 ? Math.round(((totalScans - prevScans) / prevScans) * 1000) / 10 : null;

      const summaryHtml = `
        <h3>Semaine du ${periodStart.toLocaleDateString("fr-FR")} au ${periodEnd.toLocaleDateString("fr-FR")}</h3>
        <p>Vos produits ont été scannés <strong>${totalScans}</strong> fois par <strong>${uniqueConsumers}</strong> consommateurs uniques.</p>
        <p>Région en tête : <strong>${topRegion || "—"}</strong>. Jour le plus actif : <strong>${topDayOfWeek || "—"}</strong>.</p>
        ${growthPct !== null ? `<p>${growthPct >= 0 ? "Hausse" : "Baisse"} de <strong>${Math.abs(growthPct)}%</strong> vs semaine précédente.</p>` : ""}
      `;

      insight = await db.marketInsight.create({
        data: {
          fabricantId,
          periodStart,
          periodEnd,
          totalScans,
          uniqueConsumers,
          topRegion,
          topDayOfWeek,
          topHour,
          growthPct,
          regionsBreakdown: JSON.stringify(regionsBreakdown),
          summaryHtml,
          isPremium: true,
        },
      });
    }

    return NextResponse.json({
      insight: {
        ...insight,
        regionsBreakdown: insight.regionsBreakdown ? JSON.parse(insight.regionsBreakdown) : [],
      },
    });
  } catch (err) {
    console.error("[insights/market GET] error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Public lot detail (used by /p/[lotId] page, accessed by scanning QR codes).
 *
 * Returns the lot itself (backward-compatible shape) PLUS enrichment fields
 * used by the new V4 public product page:
 *   - certifications: fabricant's certifications (verified ones first)
 *   - scanCount: total scans across all QR codes of this lot
 *   - lastScanAt: ISO date of the most recent scan
 *   - fabricantSince: ISO date when the fabricant user was created
 *   - similarProducts: 4 most recent visible products from the same category
 *   - reviews: latest B2B reviews left on this fabricant (max 6)
 *   - reviewAggregates: average + count per dimension (reliability, quality, professionalism)
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
              createdAt: true,
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

  // Parallel enrichment queries
  const [certifications, scanAgg, lastScan, similarProducts, reviews, reviewAgg] =
    await Promise.all([
      // 1. Fabricant's certifications (verified first, then by createdAt desc)
      db.certification.findMany({
        where: { fabricantId: lot.product.userId },
        orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
        take: 12,
        select: {
          id: true,
          type: true,
          issuer: true,
          certificateNumber: true,
          issuedAt: true,
          expiresAt: true,
          verified: true,
          documentUrl: true,
        },
      }),

      // 2. Total scans for this lot (sum across all QR codes)
      db.scan.aggregate({
        where: { qrCode: { lotId: lot.id } },
        _count: { _all: true },
      }),

      // 3. Most recent scan timestamp
      db.scan.findFirst({
        where: { qrCode: { lotId: lot.id } },
        orderBy: { scannedAt: "desc" },
        select: { scannedAt: true },
      }),

      // 4. Similar products: same category, visible, exclude current product
      db.product.findMany({
        where: {
          categoryId: lot.product.categoryId,
          isVisible: true,
          id: { not: lot.product.id },
        },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          name: true,
          brand: true,
          photoUrl: true,
          weight: true,
          category: { select: { name: true, icon: true } },
          user: { select: { companyName: true } },
          lots: {
            where: { status: "active" },
            select: { id: true },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      }),

      // 5. Latest B2B reviews for this fabricant (max 6)
      db.b2bReview.findMany({
        where: { fabricantReviewedId: lot.product.userId },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          reliabilityScore: true,
          qualityScore: true,
          professionalismScore: true,
          comment: true,
          createdAt: true,
          reviewer: {
            select: { companyName: true },
          },
        },
      }),

      // 6. Review aggregates (averages + total count)
      db.b2bReview.aggregate({
        where: { fabricantReviewedId: lot.product.userId },
        _avg: {
          reliabilityScore: true,
          qualityScore: true,
          professionalismScore: true,
        },
        _count: { _all: true },
      }),
    ]);

  const reviewAggregates = {
    reliability: reviewAgg._avg.reliabilityScore ?? 0,
    quality: reviewAgg._avg.qualityScore ?? 0,
    professionalism: reviewAgg._avg.professionalismScore ?? 0,
    overall:
      reviewAgg._count._all > 0
        ? (reviewAgg._avg.reliabilityScore ?? 0) +
          (reviewAgg._avg.qualityScore ?? 0) +
          (reviewAgg._avg.professionalismScore ?? 0) /
            3
        : 0,
    count: reviewAgg._count._all,
  };

  // Return the lot with extra top-level fields. Existing consumers that
  // only read lot.* fields keep working unchanged.
  return NextResponse.json({
    ...lot,
    certifications,
    scanCount: scanAgg._count._all,
    lastScanAt: lastScan?.scannedAt ?? null,
    fabricantSince: lot.product.user.createdAt,
    similarProducts: similarProducts.map((p) => ({
      ...p,
      lotId: p.lots[0]?.id ?? null,
    })),
    reviews,
    reviewAggregates,
  });
}

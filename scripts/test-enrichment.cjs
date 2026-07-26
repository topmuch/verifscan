const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  // Find any lot in local DB
  const anyLot = await db.lot.findFirst({
    include: {
      product: { include: { category: true, user: { select: { id: true, companyName: true, createdAt: true } } } },
      qrCodes: { where: { isActive: true }, take: 1 },
    },
  });
  if (!anyLot) {
    console.log("No lot in local DB, exiting.");
    return;
  }
  console.log("Testing with lot:", anyLot.id, "product:", anyLot.product?.name);
  console.log("lot.product.userId:", anyLot.product?.userId);
  console.log("lot.product.categoryId:", anyLot.product?.categoryId);

  try {
    const [certifications, scanAgg, lastScan, similarProducts, reviews, reviewAgg, anomalies] =
      await Promise.all([
        db.certification.findMany({
          where: { fabricantId: anyLot.product.userId },
          orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
          take: 12,
          select: { id: true, type: true, issuer: true, certificateNumber: true, issuedAt: true, expiresAt: true, verified: true, documentUrl: true },
        }),
        db.scan.aggregate({
          where: { qrCode: { lotId: anyLot.id } },
          _count: { _all: true },
        }),
        db.scan.findFirst({
          where: { qrCode: { lotId: anyLot.id } },
          orderBy: { scannedAt: "desc" },
          select: { scannedAt: true },
        }),
        db.product.findMany({
          where: {
            categoryId: anyLot.product.categoryId,
            isVisible: true,
            id: { not: anyLot.product.id },
          },
          orderBy: { createdAt: "desc" },
          take: 4,
          select: {
            id: true, name: true, brand: true, photoUrl: true, weight: true,
            category: { select: { name: true, icon: true } },
            user: { select: { companyName: true } },
            lots: { where: { status: "active" }, select: { id: true }, take: 1, orderBy: { createdAt: "desc" } },
          },
        }),
        db.b2BReview.findMany({
          where: { fabricantReviewedId: anyLot.product.userId },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: {
            id: true, reliabilityScore: true, qualityScore: true,
            professionalismScore: true, comment: true, createdAt: true,
            reviewer: { select: { companyName: true } },
          },
        }),
        db.b2BReview.aggregate({
          where: { fabricantReviewedId: anyLot.product.userId },
          _avg: { reliabilityScore: true, qualityScore: true, professionalismScore: true },
          _count: { _all: true },
        }),
        db.aIAnomaly.findMany({
          where: { lotId: anyLot.id },
          orderBy: [{ status: "asc" }, { detectedAt: "desc" }],
          take: 10,
          select: { id: true, type: true, severity: true, description: true, status: true, detectedAt: true },
        }),
      ]);
    console.log("✓ All enrichment queries succeeded");
    console.log("certifications:", certifications.length);
    console.log("scanAgg:", scanAgg);
    console.log("lastScan:", lastScan);
    console.log("similarProducts:", similarProducts.length);
    console.log("reviews:", reviews.length);
    console.log("reviewAgg:", reviewAgg);
    console.log("anomalies:", anomalies.length);

    // Now test the buggy 'overall' computation
    const reviewAggregates = {
      reliability: reviewAgg._avg.reliabilityScore ?? 0,
      quality: reviewAgg._avg.qualityScore ?? 0,
      professionalism: reviewAgg._avg.professionalismScore ?? 0,
      overall:
        reviewAgg._count._all > 0
          ? (reviewAgg._avg.reliabilityScore ?? 0) +
            (reviewAgg._avg.qualityScore ?? 0) +
            (reviewAgg._avg.professionalismScore ?? 0) / 3
          : 0,
      count: reviewAgg._count._all,
    };
    console.log("reviewAggregates:", reviewAggregates);
  } catch (err) {
    console.error("✗ ERROR:", err.message);
    console.error(err);
  }
}
main().finally(() => db.$disconnect());

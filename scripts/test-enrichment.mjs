import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const lotId = "cms24gf7j0009rn018u8skmo0"; // The actual lot in production
// Locally we may have different data, but let's see if the query structure works

try {
  const lot = await db.lot.findUnique({
    where: { id: lotId },
    include: {
      product: {
        include: {
          category: true,
          user: {
            select: { id: true, companyName: true, createdAt: true },
          },
        },
      },
      qrCodes: { where: { isActive: true }, take: 1 },
    },
  });
  console.log("lot:", lot ? "found" : "not found");
  if (!lot) process.exit(0);

  console.log("lot.product.userId:", lot.product?.userId);
  console.log("lot.product.categoryId:", lot.product?.categoryId);

  const [certifications, scanAgg, lastScan, similarProducts, reviews, reviewAgg, anomalies] =
    await Promise.all([
      db.certification.findMany({
        where: { fabricantId: lot.product.userId },
        orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
        take: 12,
        select: { id: true, type: true },
      }),
      db.scan.aggregate({
        where: { qrCode: { lotId: lot.id } },
        _count: { _all: true },
      }),
      db.scan.findFirst({
        where: { qrCode: { lotId: lot.id } },
        orderBy: { scannedAt: "desc" },
        select: { scannedAt: true },
      }),
      db.product.findMany({
        where: {
          categoryId: lot.product.categoryId,
          isVisible: true,
          id: { not: lot.product.id },
        },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true, name: true, brand: true, photoUrl: true, weight: true,
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
      db.b2bReview.findMany({
        where: { fabricantReviewedId: lot.product.userId },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true, reliabilityScore: true, qualityScore: true,
          professionalismScore: true, comment: true, createdAt: true,
          reviewer: { select: { companyName: true } },
        },
      }),
      db.b2bReview.aggregate({
        where: { fabricantReviewedId: lot.product.userId },
        _avg: { reliabilityScore: true, qualityScore: true, professionalismScore: true },
        _count: { _all: true },
      }),
      db.aIAnomaly.findMany({
        where: { lotId: lot.id },
        orderBy: [{ status: "asc" }, { detectedAt: "desc" }],
        take: 10,
        select: { id: true, type: true, severity: true, description: true, status: true, detectedAt: true },
      }),
    ]);

  console.log("certifications:", certifications.length);
  console.log("scanAgg:", scanAgg);
  console.log("lastScan:", lastScan);
  console.log("similarProducts:", similarProducts.length);
  console.log("reviews:", reviews.length);
  console.log("reviewAgg:", reviewAgg);
  console.log("anomalies:", anomalies.length);
} catch (err) {
  console.error("ERROR:", err.message);
  console.error("FULL:", err);
}
await db.$disconnect();

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/producers/[id]
 *
 * Public endpoint — no auth required.
 * Returns the public profile of a producer (fabricant):
 *   - Company info (name, logo, address, contact, social links)
 *   - Stats: # products, # visible products, # certifications, # active lots
 *   - All visible products (with their category + active lot count)
 *   - All certifications (verified first)
 *
 * Used by /producteur/[id] public page.
 *
 * Returns 404 if user not found OR user is not active OR is not a fabricant.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const producer = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      companyName: true,
      logoUrl: true,
      phone: true,
      whatsapp: true,
      emailContact: true,
      address: true,
      socialFacebook: true,
      socialTwitter: true,
      socialLinkedin: true,
      socialInstagram: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!producer || !producer.isActive || producer.role !== "fabricant") {
    return NextResponse.json(
      { error: "Producteur introuvable ou inactif" },
      { status: 404 }
    );
  }

  // Parallel queries for the rest
  const [products, certifications, lotsAgg, scansAgg] = await Promise.all([
    // 1. Visible products of this producer
    db.product.findMany({
      where: {
        userId: id,
        isVisible: true,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        brand: true,
        photoUrl: true,
        weight: true,
        description: true,
        variety: true,
        regionOfProduction: true,
        producerStory: true,
        gpsLat: true,
        gpsLng: true,
        category: {
          select: { id: true, name: true, icon: true, pageTemplate: true },
        },
        _count: {
          select: {
            lots: { where: { status: "active" } },
          },
        },
        lots: {
          where: { status: "active" },
          select: { id: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    }),

    // 2. Certifications (verified first, then by createdAt desc)
    db.certification.findMany({
      where: { fabricantId: id },
      orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
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

    // 3. Lots aggregates
    db.lot.aggregate({
      where: { product: { userId: id } },
      _count: { _all: true },
    }),

    // 4. Total scans across all lots of this producer
    db.scan.aggregate({
      where: { qrCode: { lot: { product: { userId: id } } } },
      _count: { _all: true },
    }),
  ]);

  return NextResponse.json({
    producer: {
      id: producer.id,
      companyName: producer.companyName,
      logoUrl: producer.logoUrl,
      phone: producer.phone,
      whatsapp: producer.whatsapp,
      emailContact: producer.emailContact,
      address: producer.address,
      social: {
        facebook: producer.socialFacebook,
        twitter: producer.socialTwitter,
        linkedin: producer.socialLinkedin,
        instagram: producer.socialInstagram,
      },
      createdAt: producer.createdAt,
    },
    products: products.map((p) => ({
      ...p,
      // Flatten `_count.lots` (Prisma syntax is awkward for the client)
      activeLotsCount: (p._count as any).lots ?? 0,
      _count: undefined,
      // Pre-resolve a primary lot ID for the "Voir la fiche" link
      primaryLotId: p.lots[0]?.id ?? null,
      lots: undefined,
    })),
    certifications,
    stats: {
      totalProducts: products.length,
      totalLots: lotsAgg._count,
      totalScans: scansAgg._count,
      verifiedCerts: certifications.filter((c) => c.verified).length,
      totalCerts: certifications.length,
    },
  });
}

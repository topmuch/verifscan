import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// GET /api/b2b/products — catalogue B2B public (mais avec filtres avancés)
export async function GET(req: Request) {
  const user = await getCurrentUser();

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const region = searchParams.get("region");
  const certification = searchParams.get("certification");
  const search = searchParams.get("search");
  const minMoq = searchParams.get("minMoq");
  const maxLeadTime = searchParams.get("maxLeadTime");

  // Filtre sur produits B2B visibles
  const where: any = {
    isB2BVisible: true,
    product: {
      isVisible: true,
      ...(categoryId ? { categoryId } : {}),
      ...(search ? { name: { contains: search } } : {}),
    },
    ...(minMoq ? { moq: { gte: parseInt(minMoq) } } : {}),
    ...(maxLeadTime ? { leadTimeDays: { lte: parseInt(maxLeadTime) } } : {}),
  };

  const b2bProducts = await db.b2BProduct.findMany({
    where,
    include: {
      product: {
        include: {
          user: { select: { companyName: true, address: true, logoUrl: true, id: true } },
          category: { select: { name: true, icon: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Si certification filter, on filtre post-query
  let filtered = b2bProducts;
  if (certification) {
    const fabricantIds = b2bProducts.map((p) => p.product.user.id);
    const certifiedFabricants = await db.certification.findMany({
      where: {
        fabricantId: { in: fabricantIds },
        type: certification,
        verified: true,
      },
      select: { fabricantId: true },
    });
    const validIds = new Set(certifiedFabricants.map((c) => c.fabricantId));
    filtered = b2bProducts.filter((p) => validIds.has(p.product.user.id));
  }

  // Si region filter, on filtre par adresse fabricant (heuristique)
  if (region) {
    filtered = filtered.filter((p) =>
      (p.product.user.address || "").toLowerCase().includes(region.toLowerCase())
    );
  }

  return NextResponse.json({
    products: filtered,
    total: filtered.length,
    user: user ? { role: user.role } : null,
  });
}

// POST /api/b2b/products — configure un produit comme B2B (fabricant only)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "fabricant") {
    return NextResponse.json({ error: "Réservé aux fabricants" }, { status: 403 });
  }

  const body = await req.json();
  const { productId, distributorPriceTiers, moq, paymentTerms, leadTimeDays, monthlyCapacity } = body;

  if (!productId) {
    return NextResponse.json({ error: "productId requis" }, { status: 400 });
  }

  // Vérifie ownership
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || product.userId !== user.id) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }

  // Upsert
  const existing = await db.b2BProduct.findUnique({ where: { productId } });
  const data = {
    distributorPriceTiers: distributorPriceTiers ? JSON.stringify(distributorPriceTiers) : null,
    moq: moq || 1,
    paymentTerms,
    leadTimeDays: leadTimeDays || 7,
    monthlyCapacity,
    isB2BVisible: true,
  };

  const b2bProduct = existing
    ? await db.b2BProduct.update({ where: { id: existing.id }, data })
    : await db.b2BProduct.create({ data: { productId, ...data } });

  return NextResponse.json({ b2bProduct });
}

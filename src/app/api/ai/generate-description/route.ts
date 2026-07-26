import { NextResponse } from "next/server";
import { requireFabricant } from "@/lib/session";
import { db } from "@/lib/db";
import { generateSeoDescription } from "@/lib/ai";

// POST /api/ai/generate-description — génère une description SEO pour un produit
export async function POST(req: Request) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { productId, name, brand, categoryId, weight, ingredients } = body;

  if (!name || !brand || !categoryId) {
    return NextResponse.json({ error: "Champs requis: name, brand, categoryId" }, { status: 400 });
  }

  // Vérifie que la catégorie existe
  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return NextResponse.json({ error: "Catégorie introuvable" }, { status: 404 });
  }

  // Si productId fourni, on récupère le produit existant
  let productData: any = { name, brand, category, weight, ingredients };
  if (productId) {
    const existing = await db.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });
    if (existing && existing.userId === user.id) {
      productData = existing;
    }
  }

  const result = generateSeoDescription(productData);

  // Sauvegarde la recommandation en base
  await db.aIRecommendation.create({
    data: {
      fabricantId: user.id,
      type: "seo",
      content: `Description SEO générée pour ${productData.name}`,
      expectedImpactPct: 25,
      status: "applied",
    },
  });

  return NextResponse.json(result);
}

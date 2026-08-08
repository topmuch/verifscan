import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

/**
 * Get or update nutrition info + carbon footprint for a product.
 *
 * GET /api/products/nutrition?productId=xxx
 *   - Public (display on product page)
 * POST /api/products/nutrition
 *   - Auth required (fabricant only)
 */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "productId requis" }, { status: 400 });
    }

    const nutrition = await db.nutritionInfo.findUnique({
      where: { productId },
    });

    if (!nutrition) {
      return NextResponse.json({ nutrition: null });
    }

    return NextResponse.json({ nutrition });
  } catch (err) {
    console.error("[products/nutrition GET] error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

const updateSchema = z.object({
  productId: z.string().min(1),
  energyKcal: z.number().int().min(0).max(5000).optional(),
  fatG: z.number().min(0).max(200).optional(),
  saturatedFatG: z.number().min(0).max(100).optional(),
  carbsG: z.number().min(0).max(500).optional(),
  sugarsG: z.number().min(0).max(500).optional(),
  fiberG: z.number().min(0).max(100).optional(),
  proteinG: z.number().min(0).max(200).optional(),
  saltG: z.number().min(0).max(100).optional(),
  allergens: z.string().optional(),
  carbonFootprintKgCo2e: z.number().min(0).max(100).optional(),
  waterFootprintL: z.number().min(0).max(100000).optional(),
  ingredientsList: z.string().optional(),
  dataSource: z.string().optional(),
});

/** Compute Nutri-Score from nutrients (simplified French algorithm). */
function computeNutriScore(n: z.infer<typeof updateSchema>) {
  // Positive points (fruits, fiber, protein) — simplified: fiber + protein
  const positivePoints =
    Math.min(5, (n.fiberG || 0) >= 3.5 ? 5 : (n.fiberG || 0) >= 1.5 ? 2 : 0) +
    Math.min(5, (n.proteinG || 0) >= 8 ? 5 : (n.proteinG || 0) >= 4 ? 2 : 0);

  // Negative points
  const calPoints = Math.min(10, Math.floor(((n.energyKcal || 0) - 90) / 30));
  const sugarPoints = Math.min(10, Math.floor((n.sugarsG || 0) / 4.5));
  const satFatPoints = Math.min(10, Math.floor((n.saturatedFatG || 0) / 1));
  const saltPoints = Math.min(10, Math.floor((n.saltG || 0) * 1000 / 90));

  const total = Math.max(0, calPoints) + Math.max(0, sugarPoints) + Math.max(0, satFatPoints) + Math.max(0, saltPoints) - positivePoints;

  let score = "a";
  if (total <= -1) score = "a";
  else if (total <= 2) score = "b";
  else if (total <= 10) score = "c";
  else if (total <= 18) score = "d";
  else score = "e";

  return { nutriScore: score, nutriScoreValue: total };
}

/** Compute Eco-Score (simplified — based on carbon footprint). */
function computeEcoScore(carbon?: number): string | null {
  if (carbon == null) return null;
  if (carbon < 0.5) return "a";
  if (carbon < 1.5) return "b";
  if (carbon < 3) return "c";
  if (carbon < 5) return "d";
  return "e";
}

export async function POST(req: Request) {
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const fabricantId = session.user.id;

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    // Verify product belongs to this fabricant
    const product = await db.product.findFirst({
      where: { id: parsed.data.productId, userId: fabricantId },
    });
    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    const { nutriScore, nutriScoreValue } = computeNutriScore(parsed.data);
    const ecoScore = computeEcoScore(parsed.data.carbonFootprintKgCo2e);

    const nutrition = await db.nutritionInfo.upsert({
      where: { productId: parsed.data.productId },
      update: {
        ...parsed.data,
        nutriScore,
        nutriScoreValue,
        ecoScore,
        lastVerifiedAt: new Date(),
      },
      create: {
        productId: parsed.data.productId,
        ...parsed.data,
        nutriScore,
        nutriScoreValue,
        ecoScore,
        lastVerifiedAt: new Date(),
      },
    });

    return NextResponse.json({ nutrition });
  } catch (err) {
    console.error("[products/nutrition POST] error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

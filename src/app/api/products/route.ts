import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";

const createSchema = z.object({
  name: z.string().min(2),
  brand: z.string().min(1),
  description: z.string().optional(),
  photoUrl: z.string().optional().or(z.literal("")),
  weight: z.string().optional(),
  categoryId: z.string().min(1),
  isVisible: z.boolean().default(true),
  // Champs spécifiques au template export_produce
  variety: z.string().optional(),
  regionOfProduction: z.string().optional(),
  producerStory: z.string().optional(),
  producerPhotoUrl: z.string().optional().or(z.literal("")),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional(),
});

/**
 * Public list of products (visible only).
 * Query params: search, categoryId, page, limit
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() || "";
  const categoryId = url.searchParams.get("categoryId") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  const where: any = {
    isVisible: true,
  };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { brand: { contains: search } },
      { description: { contains: search } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;

  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        category: { select: { id: true, name: true, icon: true, pageTemplate: true } },
        user: {
          select: {
            id: true,
            companyName: true,
            logoUrl: true,
            phone: true,
            whatsapp: true,
            emailContact: true,
          },
        },
        _count: { select: { lots: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

/**
 * Create product (fabricant only).
 */
export async function POST(req: Request) {
  const user = await requireFabricant();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const category = await db.category.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Catégorie introuvable" }, { status: 400 });
    }

    const product = await db.product.create({
      data: {
        userId: user.id,
        categoryId: data.categoryId,
        name: data.name.trim(),
        brand: data.brand.trim(),
        description: data.description?.trim() || null,
        photoUrl: data.photoUrl || null,
        weight: data.weight?.trim() || null,
        isVisible: data.isVisible,
        // Champs export_produce (ignorés pour les autres templates)
        variety: data.variety?.trim() || null,
        regionOfProduction: data.regionOfProduction?.trim() || null,
        producerStory: data.producerStory?.trim() || null,
        producerPhotoUrl: data.producerPhotoUrl || null,
        gpsLat: data.gpsLat ?? null,
        gpsLng: data.gpsLng ?? null,
      },
      include: { category: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err: any) {
    console.error("[products POST] error:", err);
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}

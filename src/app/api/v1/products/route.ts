import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiKey, canRead, canWrite } from "@/lib/session";
import { dispatchWebhookEvent } from "@/lib/webhooks";

/**
 * GET /api/v1/products
 *
 * Lists the API key owner's products (with category, lots count).
 *
 * Query params:
 *   - search: string
 *   - categoryId: string
 *   - limit: number (default 50, max 100)
 *   - offset: number (default 0)
 *
 * Headers: Authorization: Bearer vsk_live_xxx
 */
export async function GET(req: Request) {
  const apiUser = await requireApiKey(req);
  if (!apiUser) {
    return NextResponse.json(
      { error: "Clé API invalide ou manquante" },
      { status: 401 }
    );
  }
  if (!canRead(apiUser.permissions)) {
    return NextResponse.json({ error: "Permission 'read' requise" }, { status: 403 });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() || "";
  const categoryId = url.searchParams.get("categoryId") || "";
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0"));

  const where: any = { userId: apiUser.id };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { brand: { contains: search } },
      { barcode: { contains: search } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;

  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        category: { select: { id: true, name: true, icon: true, pageTemplate: true } },
        _count: { select: { lots: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    limit,
    offset,
    hasMore: offset + items.length < total,
  });
}

const createSchema = z.object({
  name: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
  brand: z.string().min(1, "La marque est requise"),
  categoryId: z.string().min(1, "categoryId est requis"),
  description: z.string().optional(),
  photoUrl: z.string().optional().or(z.literal("")),
  weight: z.string().optional(),
  isVisible: z.boolean().default(true),
  barcode: z.string().optional(),
  // Champs spécifiques au template export_produce
  variety: z.string().optional(),
  regionOfProduction: z.string().optional(),
  producerStory: z.string().optional(),
  producerPhotoUrl: z.string().optional().or(z.literal("")),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional(),
});

/**
 * POST /api/v1/products
 *
 * Crée un nouveau produit pour le compte du propriétaire de la clé API.
 * Nécessite la permission 'readwrite' ou 'admin'.
 *
 * Headers: Authorization: Bearer vsk_live_xxx
 * Body: { name, brand, categoryId, description?, photoUrl?, weight?, isVisible?, barcode?, variety?, ... }
 *
 * Retourne 201 + le produit créé (avec sa catégorie).
 * Déclenche aussi le webhook 'product_created' si configuré.
 */
export async function POST(req: Request) {
  const apiUser = await requireApiKey(req);
  if (!apiUser) {
    return NextResponse.json(
      { error: "Clé API invalide ou manquante" },
      { status: 401 }
    );
  }
  if (!canWrite(apiUser.permissions)) {
    return NextResponse.json(
      { error: "Permission 'readwrite' ou 'admin' requise pour créer un produit" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Vérifier que la catégorie existe
  const category = await db.category.findUnique({
    where: { id: data.categoryId },
    select: { id: true, name: true, icon: true, pageTemplate: true },
  });
  if (!category) {
    return NextResponse.json({ error: "Catégorie introuvable" }, { status: 400 });
  }

  try {
    const product = await db.product.create({
      data: {
        userId: apiUser.id,
        categoryId: data.categoryId,
        name: data.name.trim(),
        brand: data.brand.trim(),
        description: data.description?.trim() || null,
        photoUrl: data.photoUrl || null,
        weight: data.weight?.trim() || null,
        isVisible: data.isVisible,
        barcode: data.barcode?.trim() || null,
        variety: data.variety?.trim() || null,
        regionOfProduction: data.regionOfProduction?.trim() || null,
        producerStory: data.producerStory?.trim() || null,
        producerPhotoUrl: data.producerPhotoUrl || null,
        gpsLat: data.gpsLat ?? null,
        gpsLng: data.gpsLng ?? null,
      },
      include: {
        category: { select: { id: true, name: true, icon: true, pageTemplate: true } },
      },
    });

    // Fire-and-forget webhook
    dispatchWebhookEvent(apiUser.id, "product_created", {
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        barcode: product.barcode,
        categoryId: product.categoryId,
        categoryName: category.name,
      },
      createdAt: product.createdAt.toISOString(),
    }).catch(() => {});

    return NextResponse.json(product, { status: 201 });
  } catch (err: any) {
    console.error("[v1/products POST] error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la création du produit" },
      { status: 500 }
    );
  }
}

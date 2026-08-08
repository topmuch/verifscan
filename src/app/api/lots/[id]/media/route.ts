import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";

/**
 * GET /api/lots/[id]/media
 * Liste tous les médias d'un lot (photos + vidéos).
 * Le fabricant ne peut lister que les médias de ses propres lots.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const lot = await db.lot.findUnique({
    where: { id },
    select: { id: true, product: { select: { userId: true } } },
  });

  if (!lot) return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });
  if (lot.product.userId !== user.id) {
    return NextResponse.json({ error: "Vous ne possédez pas ce lot" }, { status: 403 });
  }

  const media = await db.lotMedia.findMany({
    where: { lotId: id },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ items: media });
}

const createSchema = z.object({
  type: z.enum(["photo", "video"]),
  url: z.string().min(1),
  caption: z.string().max(280).optional(),
});

/**
 * POST /api/lots/[id]/media
 * Ajoute un média (photo ou vidéo) à un lot.
 * Body: { type, url, caption? }
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  // Verify ownership
  const lot = await db.lot.findUnique({
    where: { id },
    select: { id: true, product: { select: { userId: true, name: true } } },
  });

  if (!lot) return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });
  if (lot.product.userId !== user.id) {
    return NextResponse.json({ error: "Vous ne possédez pas ce lot" }, { status: 403 });
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

    const media = await db.lotMedia.create({
      data: {
        lotId: id,
        type: parsed.data.type,
        url: parsed.data.url.trim(),
        caption: parsed.data.caption?.trim() || null,
      },
    });

    return NextResponse.json(media, { status: 201 });
  } catch (err: any) {
    console.error("[media POST] error:", err);
    return NextResponse.json({ error: "Erreur lors de l'ajout du média" }, { status: 500 });
  }
}

/**
 * DELETE /api/lots/[id]/media?mediaId=<id>
 * Supprime un média d'un lot.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const url = new URL(req.url);
  const mediaId = url.searchParams.get("mediaId");
  if (!mediaId) {
    return NextResponse.json({ error: "mediaId requis" }, { status: 400 });
  }

  // Verify ownership of the lot that owns this media
  const media = await db.lotMedia.findUnique({
    where: { id: mediaId },
    select: {
      id: true,
      lotId: true,
      lot: { select: { product: { select: { userId: true } } } },
    },
  });

  if (!media) return NextResponse.json({ error: "Média introuvable" }, { status: 404 });
  if (media.lotId !== id) {
    return NextResponse.json({ error: "Ce média n'appartient pas à ce lot" }, { status: 400 });
  }
  if (media.lot.product.userId !== user.id) {
    return NextResponse.json({ error: "Vous ne possédez pas ce lot" }, { status: 403 });
  }

  await db.lotMedia.delete({ where: { id: mediaId } });

  return NextResponse.json({ ok: true, deletedMediaId: mediaId });
}

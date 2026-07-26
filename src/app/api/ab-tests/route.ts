import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

/**
 * A/B testing of packaging — list/create/pause variants.
 * Auth required (fabricant only).
 */

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const fabricantId = session.user.id;

    const products = await db.product.findMany({
      where: { userId: fabricantId },
      include: {
        // We don't have a direct relation; use raw find via QRCode
      },
    });

    // Get variants via raw SQL since PackagingVariant.productId needs to match this fabricant's products
    const productIds = products.map((p) => p.id);
    if (productIds.length === 0) {
      return NextResponse.json({ variants: [] });
    }

    const variants = await db.packagingVariant.findMany({
      where: { productId: { in: productIds } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ variants });
  } catch (err) {
    console.error("[ab-tests GET] error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

const createSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  qrCodeId: z.string().optional(),
  referencePhotoUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const fabricantId = session.user.id;

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    // Verify the product belongs to this fabricant
    const product = await db.product.findFirst({
      where: { id: parsed.data.productId, userId: fabricantId },
    });
    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    const variant = await db.packagingVariant.create({
      data: {
        productId: parsed.data.productId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        qrCodeId: parsed.data.qrCodeId || null,
        referencePhotoUrl: parsed.data.referencePhotoUrl || null,
        status: "draft",
      },
    });

    return NextResponse.json({ variant });
  } catch (err) {
    console.error("[ab-tests POST] error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

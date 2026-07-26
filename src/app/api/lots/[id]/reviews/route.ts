import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { sendReviewNotificationEmail } from "@/lib/email";

/**
 * POST /api/lots/[id]/reviews
 *
 * Public endpoint — anyone scanning a QR code can submit a review.
 * No auth required.
 *
 * Body:
 *   rating:       number  1-5 (required)
 *   comment:      string  (optional, max 2000 chars)
 *   reviewerName: string  (optional, max 100 chars)
 *   reviewerPhone:string  (optional, max 30 chars)
 *
 * On submit:
 *   1. Creates a ProductReview row.
 *   2. Creates an in-app notification for the fabricant.
 *   3. Sends an email to the fabricant (best-effort — never blocks the response).
 *
 * Returns 201 with the created review on success.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: lotId } = await params;

  // Parse + validate body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "La note doit être un entier entre 1 et 5" }, { status: 422 });
  }

  const comment =
    typeof body.comment === "string" ? body.comment.trim().slice(0, 2000) : null;
  const reviewerName =
    typeof body.reviewerName === "string" && body.reviewerName.trim()
      ? body.reviewerName.trim().slice(0, 100)
      : null;
  const reviewerPhone =
    typeof body.reviewerPhone === "string" && body.reviewerPhone.trim()
      ? body.reviewerPhone.trim().slice(0, 30)
      : null;

  // Fetch the lot (with product + fabricant) — by primary key OR lotNumber fallback
  let lot = await db.lot.findUnique({
    where: { id: lotId },
    select: {
      id: true,
      lotNumber: true,
      productId: true,
      product: {
        select: {
          id: true,
          name: true,
          brand: true,
          userId: true,
          user: {
            select: {
              id: true,
              companyName: true,
              email: true,
              emailContact: true,
            },
          },
        },
      },
    },
  });

  if (!lot) {
    lot = await db.lot.findFirst({
      where: { lotNumber: lotId },
      select: {
        id: true,
        lotNumber: true,
        productId: true,
        product: {
          select: {
            id: true,
            name: true,
            brand: true,
            userId: true,
            user: {
              select: {
                id: true,
                companyName: true,
                email: true,
                emailContact: true,
              },
            },
          },
        },
      },
    });
  }

  if (!lot) {
    return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });
  }

  // Create the review
  const review = await db.productReview.create({
    data: {
      lotId: lot.id,
      productId: lot.product.id,
      fabricantId: lot.product.userId,
      rating,
      comment: comment || null,
      reviewerName,
      reviewerPhone,
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      reviewerName: true,
      createdAt: true,
    },
  });

  // Determine lot URL (best-effort — fallback to a relative path)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (typeof req.headers.get === "function" ? req.headers.get("x-forwarded-origin") || "" : "") ||
    "";
  const lotUrl = appUrl ? `${appUrl}/p/${lot.id}` : `/p/${lot.id}`;

  // In-app notification for the fabricant (non-blocking)
  const fabricant = lot.product.user;
  createNotification({
    userId: fabricant.id,
    type: "b2b_message", // closest existing type — used here for "consumer review received"
    title: "Nouvel avis consommateur",
    message: `${reviewerName || "Un consommateur"} a laissé un avis ${rating}/5 sur ${lot.product.name} (lot ${lot.lotNumber}).`,
    link: `/dashboard/lots`,
    metadata: {
      reviewId: review.id,
      lotId: lot.id,
      productId: lot.product.id,
      rating,
    },
  }).catch((err) => {
    console.error("[reviews POST] createNotification error:", err?.message || err);
  });

  // Email to fabricant (best-effort — never blocks)
  const fabricantEmail = fabricant.emailContact || fabricant.email;
  if (fabricantEmail) {
    sendReviewNotificationEmail({
      fabricantName: fabricant.companyName || "Fabricant",
      fabricantEmail,
      productName: lot.product.name,
      brand: lot.product.brand,
      lotNumber: lot.lotNumber,
      rating,
      comment: comment || null,
      reviewerName,
      lotUrl,
    }).catch((err) => {
      console.error("[reviews POST] sendReviewNotificationEmail error:", err?.message || err);
    });
  }

  return NextResponse.json({ review }, { status: 201 });
}

/**
 * GET /api/lots/[id]/reviews
 *
 * Public endpoint — returns latest consumer reviews + aggregate for a lot.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: lotId } = await params;

  // Resolve lot — primary key first, then lotNumber
  let lot = await db.lot.findUnique({
    where: { id: lotId },
    select: { id: true },
  });
  if (!lot) {
    lot = await db.lot.findFirst({
      where: { lotNumber: lotId },
      select: { id: true },
    });
  }
  if (!lot) {
    return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });
  }

  const [reviews, agg] = await Promise.all([
    db.productReview.findMany({
      where: { lotId: lot.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        rating: true,
        comment: true,
        reviewerName: true,
        createdAt: true,
      },
    }),
    db.productReview.aggregate({
      where: { lotId: lot.id },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  return NextResponse.json({
    reviews,
    aggregates: {
      average: agg._avg.rating ?? 0,
      count: agg._count._all,
    },
  });
}

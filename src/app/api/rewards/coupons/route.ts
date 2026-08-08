import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

/**
 * Lists available coupons that a consumer can redeem with points.
 * Public endpoint.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const onlyActive = searchParams.get("active") !== "false";

    const where: any = {};
    if (onlyActive) {
      where.isActive = true;
      where.validUntil = { gte: new Date() };
    }

    const coupons = await db.coupon.findMany({
      where,
      include: {
        fabricant: { select: { companyName: true, logoUrl: true } },
      },
      orderBy: { pointsCost: "asc" },
      take: 50,
    });

    // Filter sold-out in JS to keep query simple
    const filtered = coupons.filter((c) => !onlyActive || c.redeemedQuantity < c.totalQuantity);

    return NextResponse.json({
      coupons: filtered.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        pointsCost: c.pointsCost,
        discountValue: c.discountValue,
        discountPercent: c.discountPercent,
        validUntil: c.validUntil,
        remaining: c.totalQuantity - c.redeemedQuantity,
        fabricant: {
          name: c.fabricant.companyName || "VerifScan",
          logoUrl: c.fabricant.logoUrl,
        },
      })),
    });
  } catch (err) {
    console.error("[rewards/coupons GET] error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

const redeemSchema = z.object({
  couponId: z.string().min(1),
  deviceFingerprint: z.string().min(1),
});

/**
 * Redeem a coupon: deducts points from the wallet, generates a unique code.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = redeemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { couponId, deviceFingerprint } = parsed.data;

    const coupon = await db.coupon.findUnique({ where: { id: couponId } });
    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "Coupon introuvable ou inactif" }, { status: 404 });
    }
    if (coupon.validUntil < new Date()) {
      return NextResponse.json({ error: "Coupon expiré" }, { status: 400 });
    }
    if (coupon.redeemedQuantity >= coupon.totalQuantity) {
      return NextResponse.json({ error: "Stock épuisé" }, { status: 400 });
    }

    // Find or create wallet
    let wallet = await db.rewardWallet.findFirst({
      where: { deviceFingerprint },
    });
    if (!wallet) {
      wallet = await db.rewardWallet.create({
        data: { deviceFingerprint },
      });
    }

    if (wallet.pointsBalance < coupon.pointsCost) {
      return NextResponse.json({
        error: "Points insuffisants",
        needed: coupon.pointsCost,
        balance: wallet.pointsBalance,
      }, { status: 400 });
    }

    // Generate unique code
    const code = `${coupon.codePrefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Transaction: deduct points, create redemption, increment coupon redeemed count
    const [redemption] = await db.$transaction([
      db.couponRedemption.create({
        data: {
          couponId,
          walletId: wallet.id,
          code,
          pointsSpent: coupon.pointsCost,
          status: "issued",
        },
      }),
      db.rewardWallet.update({
        where: { id: wallet.id },
        data: {
          pointsBalance: { decrement: coupon.pointsCost },
          totalRedeemed: { increment: coupon.pointsCost },
        },
      }),
      db.rewardTransaction.create({
        data: {
          walletId: wallet.id,
          type: "redemption",
          points: -coupon.pointsCost,
          description: `Remboursement : ${coupon.title}`,
        },
      }),
      db.coupon.update({
        where: { id: couponId },
        data: { redeemedQuantity: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      redemption: {
        id: redemption.id,
        code: redemption.code,
        couponTitle: coupon.title,
        pointsSpent: redemption.pointsSpent,
        redeemedAt: redemption.redeemedAt,
        validUntil: coupon.validUntil,
      },
      newBalance: wallet.pointsBalance - coupon.pointsCost,
    });
  } catch (err) {
    console.error("[rewards/coupons POST] error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

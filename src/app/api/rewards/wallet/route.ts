import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Returns the consumer's loyalty wallet + recent transactions.
 * Public endpoint — no auth required.
 *
 * Query params:
 *  - fp: device fingerprint (required)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fp = searchParams.get("fp");

    if (!fp) {
      return NextResponse.json({ error: "Empreinte appareil requise (fp)" }, { status: 400 });
    }

    const wallet = await db.rewardWallet.findFirst({
      where: { deviceFingerprint: fp },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        redemptions: {
          orderBy: { redeemedAt: "desc" },
          take: 10,
          include: { coupon: { select: { title: true, fabricantId: true } } },
        },
      },
    });

    if (!wallet) {
      return NextResponse.json({
        wallet: null,
        pointsBalance: 0,
        totalEarned: 0,
        totalRedeemed: 0,
        transactions: [],
        redemptions: [],
      });
    }

    return NextResponse.json({
      wallet: { id: wallet.id, createdAt: wallet.createdAt },
      pointsBalance: wallet.pointsBalance,
      totalEarned: wallet.totalEarned,
      totalRedeemed: wallet.totalRedeemed,
      transactions: wallet.transactions.map((t) => ({
        id: t.id,
        type: t.type,
        points: t.points,
        description: t.description,
        createdAt: t.createdAt,
      })),
      redemptions: wallet.redemptions.map((r) => ({
        id: r.id,
        couponTitle: r.coupon.title,
        code: r.code,
        status: r.status,
        pointsSpent: r.pointsSpent,
        redeemedAt: r.redeemedAt,
        usedAt: r.usedAt,
      })),
    });
  } catch (err) {
    console.error("[rewards/wallet GET] error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

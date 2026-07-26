import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { detectDeviceType } from "@/lib/qr";

const schema = z.object({
  qrCodeId: z.string().min(1),
  location: z.string().optional(),
  deviceType: z.string().optional(),
  userAgent: z.string().optional(),
  // V4 — geolocation, photo, anonymous user tracking
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  region: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
  photoMatchScore: z.number().min(0).max(100).optional(),
  deviceFingerprint: z.string().optional(),
});

/** Reverse-geocode a (lat,lng) into a Senegalese region name.
 *  Lightweight heuristic — no external API call to keep latency low. */
function inferRegion(lat?: number, lng?: number): string | null {
  if (lat == null || lng == null) return null;
  // Bounding boxes for the main Senegalese regions (approximate)
  const regions: { name: string; minLat: number; maxLat: number; minLng: number; maxLng: number }[] = [
    { name: "Dakar",      minLat: 14.60, maxLat: 14.85, minLng: -17.50, maxLng: -17.10 },
    { name: "Thiès",      minLat: 14.40, maxLat: 14.95, minLng: -17.40, maxLng: -16.60 },
    { name: "Diourbel",   minLat: 14.10, maxLat: 14.65, minLng: -16.90, maxLng: -16.10 },
    { name: "Saint-Louis",minLat: 15.50, maxLat: 16.60, minLng: -16.80, maxLng: -13.80 },
    { name: "Louga",      minLat: 15.20, maxLat: 16.30, minLng: -16.80, maxLng: -15.20 },
    { name: "Kaolack",    minLat: 13.70, maxLat: 14.30, minLng: -16.80, maxLng: -15.60 },
    { name: "Fatick",     minLat: 13.70, maxLat: 14.40, minLng: -16.90, maxLng: -15.90 },
    { name: "Tambacounda",minLat: 12.80, maxLat: 15.20, minLng: -13.40, maxLng: -11.30 },
    { name: "Ziguinchor", minLat: 12.20, maxLat: 13.10, minLng: -16.90, maxLng: -16.10 },
    { name: "Kolda",      minLat: 12.20, maxLat: 13.20, minLng: -15.30, maxLng: -14.10 },
    { name: "Sédhiou",    minLat: 12.20, maxLat: 13.10, minLng: -16.30, maxLng: -15.20 },
    { name: "Kédougou",   minLat: 12.20, maxLat: 13.10, minLng: -12.90, maxLng: -11.30 },
    { name: "Kaffrine",   minLat: 13.50, maxLat: 14.30, minLng: -16.10, maxLng: -15.20 },
    { name: "Matam",      minLat: 15.20, maxLat: 16.60, minLng: -14.40, maxLng: -12.30 },
    { name: "Bakel",      minLat: 14.40, maxLat: 15.30, minLng: -12.50, maxLng: -11.30 },
  ];
  for (const r of regions) {
    if (lat >= r.minLat && lat <= r.maxLat && lng >= r.minLng && lng <= r.maxLng) {
      return r.name;
    }
  }
  return null;
}

/**
 * Records a scan event (called by /p/[lotId] public page).
 * Public endpoint — no auth required.
 * V4: also stores geolocation, photo, deviceFingerprint, and awards loyalty points.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "qrCodeId requis" }, { status: 400 });
    }

    const qr = await db.qRCode.findUnique({
      where: { id: parsed.data.qrCodeId },
      include: { lot: { select: { status: true, product: { select: { userId: true, name: true, brand: true } } } } },
    });
    if (!qr) {
      return NextResponse.json({ error: "QR code introuvable" }, { status: 404 });
    }

    // Determine device type from User-Agent header if not provided
    const userAgentHeader = req.headers.get("user-agent") || undefined;
    const deviceType =
      parsed.data.deviceType || detectDeviceType(userAgentHeader);

    // Extract IP address
    const forwarded = req.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : null;

    const region = parsed.data.region || inferRegion(parsed.data.latitude, parsed.data.longitude);

    const scan = await db.scan.create({
      data: {
        qrCodeId: qr.id,
        location: parsed.data.location || null,
        deviceType,
        userAgent: parsed.data.userAgent || userAgentHeader || null,
        ipAddress,
        country: parsed.data.location ? extractCountry(parsed.data.location) : null,
        city: parsed.data.location ? extractCity(parsed.data.location) : null,
        // V4
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
        region,
        photoUrl: parsed.data.photoUrl || null,
        photoMatchScore: parsed.data.photoMatchScore ?? null,
        deviceFingerprint: parsed.data.deviceFingerprint || null,
      },
    });

    // If the lot is recalled, trigger a recall alert to the fabricant
    if (qr.lot.status === "recalled") {
      const { triggerRecallAlert } = await import("@/lib/notifications");
      await triggerRecallAlert(qr.lotId);
    }

    // V4 — award loyalty points (10 points per scan, capped at 1 scan/day/lot/fingerprint)
    let pointsAwarded = 0;
    let walletBalance = 0;
    let recallAlert: { title: string; reason: string; severity: string } | null = null;

    if (parsed.data.deviceFingerprint) {
      // Check if a scan was already recorded today for this fingerprint + lot
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const alreadyScannedToday = await db.scan.findFirst({
        where: {
          qrCodeId: qr.id,
          deviceFingerprint: parsed.data.deviceFingerprint,
          scannedAt: { gte: startOfDay, lte: endOfDay },
          id: { not: scan.id },
        },
        select: { id: true },
      });

      if (!alreadyScannedToday) {
        // Upsert wallet
        const wallet = await db.rewardWallet.upsert({
          where: {
            deviceFingerprint_userId: {
              deviceFingerprint: parsed.data.deviceFingerprint,
              userId: "__none__", // SQLite doesn't allow null in composite unique; we use sentinel
            },
          },
          update: {},
          create: {
            deviceFingerprint: parsed.data.deviceFingerprint,
            // userId left null for anonymous consumers
          },
          // fallback: find first by deviceFingerprint
        }).catch(async () => {
          // If upsert fails (composite unique edge case), find or create manually
          let w = await db.rewardWallet.findFirst({
            where: { deviceFingerprint: parsed.data.deviceFingerprint },
          });
          if (!w) {
            w = await db.rewardWallet.create({
              data: { deviceFingerprint: parsed.data.deviceFingerprint },
            });
          }
          return w;
        });

        const points = 10;
        await db.rewardTransaction.create({
          data: {
            walletId: wallet.id,
            scanId: scan.id,
            type: "scan",
            points,
            description: `Scan de ${qr.lot.product.name}`,
          },
        });

        await db.rewardWallet.update({
          where: { id: wallet.id },
          data: {
            pointsBalance: { increment: points },
            totalEarned: { increment: points },
          },
        });

        pointsAwarded = points;
        walletBalance = (wallet.pointsBalance || 0) + points;
      } else {
        walletBalance = (await db.rewardWallet.findFirst({
          where: { deviceFingerprint: parsed.data.deviceFingerprint },
          select: { pointsBalance: true },
        }))?.pointsBalance || 0;
      }
    }

    // V4 — check for active recalls affecting this product
    if (qr.lot.status === "recalled") {
      const lotRecallInfo = await db.$queryRaw<{ title: string; reason: string; severity: string }[]>`
        SELECT title, reason, severity FROM Recall
        WHERE status = 'active'
          AND (lotIds LIKE ${`%${qr.lotId}%`} OR productId = ${qr.lot.product.userId})
        LIMIT 1
      `.catch(() => []);
      if (lotRecallInfo && lotRecallInfo[0]) {
        recallAlert = {
          title: lotRecallInfo[0].title,
          reason: lotRecallInfo[0].reason,
          severity: lotRecallInfo[0].severity,
        };
      } else {
        recallAlert = {
          title: "Lot rappelé",
          reason: "Ce lot a été rappelé par le fabricant.",
          severity: "warning",
        };
      }
    }

    return NextResponse.json({
      ok: true,
      scanId: scan.id,
      // V4 additions
      pointsAwarded,
      walletBalance,
      recallAlert,
      region,
    });
  } catch (err) {
    console.error("[scans POST] error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

function extractCountry(location: string): string | null {
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0] || null;
}

function extractCity(location: string): string | null {
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length > 1 ? parts[0] : null;
}

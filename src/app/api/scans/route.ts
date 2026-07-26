import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { detectDeviceType } from "@/lib/qr";

const schema = z.object({
  qrCodeId: z.string().min(1),
  location: z.string().optional(),
  deviceType: z.string().optional(),
  userAgent: z.string().optional(),
});

/**
 * Records a scan event (called by /p/[lotId] public page).
 * Public endpoint — no auth required.
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
      include: { lot: { select: { status: true, product: { select: { userId: true } } } } },
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

    const scan = await db.scan.create({
      data: {
        qrCodeId: qr.id,
        location: parsed.data.location || null,
        deviceType,
        userAgent: parsed.data.userAgent || userAgentHeader || null,
        ipAddress,
        country: parsed.data.location ? extractCountry(parsed.data.location) : null,
        city: parsed.data.location ? extractCity(parsed.data.location) : null,
      },
    });

    // If the lot is recalled, trigger a recall alert to the fabricant
    if (qr.lot.status === "recalled") {
      const { triggerRecallAlert } = await import("@/lib/notifications");
      await triggerRecallAlert(qr.lotId);
    }

    return NextResponse.json({ ok: true, scanId: scan.id });
  } catch (err) {
    console.error("[scans POST] error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

function extractCountry(location: string): string | null {
  // Format: "City, Country" — return last part
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0] || null;
}

function extractCity(location: string): string | null {
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length > 1 ? parts[0] : null;
}

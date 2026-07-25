import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

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
    });
    if (!qr) {
      return NextResponse.json({ error: "QR code introuvable" }, { status: 404 });
    }

    const scan = await db.scan.create({
      data: {
        qrCodeId: qr.id,
        location: parsed.data.location || null,
        deviceType: parsed.data.deviceType || null,
        userAgent: parsed.data.userAgent || null,
      },
    });

    return NextResponse.json({ ok: true, scanId: scan.id });
  } catch (err) {
    console.error("[scans POST] error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

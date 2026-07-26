// GET /api/debug/qr-check
// Diagnostic endpoint — returns information about QR codes & lots in the DB
// so we can diagnose why public /p/[lotId] returns 404.
//
// Public (no auth) — only returns aggregate info + sample IDs, not sensitive data.
//
// Returns:
//   - appUrl:        the URL that resolveAppUrl() would return for new QR codes
//   - env:           which env vars are set (NEXT_PUBLIC_APP_URL, NEXTAUTH_URL)
//   - headers:       x-forwarded-proto, x-forwarded-host, host (used by resolveAppUrl fallback)
//   - totals:        { lots, qrCodesActive, qrCodesTotal, scans }
//   - lots:          up to 20 most recent lots with { id, lotNumber, status, hasActiveQr, publicUrl, fullEncodedUrl }
//   - sampleUrl:     a sample URL the user can click to test the public page

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveAppUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const appUrl = resolveAppUrl(req);

  // Aggregate counts
  const [lotsCount, qrActiveCount, qrTotalCount, scansCount] = await Promise.all([
    db.lot.count(),
    db.qRCode.count({ where: { isActive: true } }),
    db.qRCode.count(),
    db.scan.count(),
  ]);

  // Last 20 lots with their active QR code
  const lots = await db.lot.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      lotNumber: true,
      status: true,
      createdAt: true,
      qrCodes: {
        where: { isActive: true },
        select: { id: true, publicUrl: true, isActive: true },
        take: 1,
      },
      product: { select: { name: true, brand: true } },
    },
  });

  // Build a "what would the QR encode" URL for each lot
  const lotsWithUrls = lots.map((lot) => ({
    id: lot.id,
    lotNumber: lot.lotNumber,
    status: lot.status,
    productName: lot.product?.name ?? null,
    brand: lot.product?.brand ?? null,
    hasActiveQr: lot.qrCodes.length > 0,
    qrCodeId: lot.qrCodes[0]?.id ?? null,
    publicUrl: lot.qrCodes[0]?.publicUrl ?? null,
    fullEncodedUrl: lot.qrCodes[0]?.publicUrl
      ? `${appUrl}${lot.qrCodes[0].publicUrl}`
      : null,
    testUrl: `${appUrl}/p/${lot.id}`,
  }));

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),

    // URL configuration
    appUrl,
    env: {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || null,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || null,
    },
    headers: {
      "x-forwarded-proto": req.headers.get("x-forwarded-proto"),
      "x-forwarded-host": req.headers.get("x-forwarded-host"),
      host: req.headers.get("host"),
    },

    // DB totals
    totals: {
      lots: lotsCount,
      qrCodesActive: qrActiveCount,
      qrCodesTotal: qrTotalCount,
      scans: scansCount,
    },

    // Sample lots
    lots: lotsWithUrls,

    // A test URL the user can click to verify the public page works
    sampleUrl: lotsWithUrls[0]?.testUrl ?? null,

    diagnosis:
      lotsCount === 0
        ? "DB has 0 lots. The DB has probably been reset (Coolify redeploy without persistent volume, or prisma db push --accept-data-loss wiped data)."
        : qrActiveCount === 0
        ? "DB has lots but 0 active QR codes. Use 'Regenerate all QR' to create new ones."
        : appUrl === ""
        ? "appUrl is empty. NEXT_PUBLIC_APP_URL and NEXTAUTH_URL are both unset, and headers did not provide x-forwarded-host. QR codes will encode relative URLs like '/p/{lotId}' which break when scanned from outside the browser."
        : "DB looks healthy. If QR codes still 404, check that the URL encoded in the QR image matches appUrl above. Old printed QR codes may still point to https://verifscan.sn which is no longer the deployment URL.",
  });
}

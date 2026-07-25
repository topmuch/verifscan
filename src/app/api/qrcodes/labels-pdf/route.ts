import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";
import {
  buildLabelSheetHtml,
  generateBatchQrCodes,
  LABEL_PRESETS,
  LabelData,
} from "@/lib/labels";
import { getLotPublicUrl } from "@/lib/qr";

const schema = z.object({
  lotIds: z.array(z.string()).min(1).max(200),
  layout: z.enum(["a4_10", "a4_24", "a4_40", "a4_6"]).optional().default("a4_10"),
  paperSize: z.enum(["a4", "a5"]).optional().default("a4"),
  cutLines: z.boolean().optional().default(true),
  includeLotNumber: z.boolean().optional().default(true),
  includeProductName: z.boolean().optional().default(true),
  includeBrand: z.boolean().optional().default(false),
  fgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

/**
 * Generates a printable HTML sheet of labels for multiple lots.
 * The user can open the HTML in a new tab and print to PDF or paper.
 */
export async function POST(req: Request) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const {
    lotIds,
    layout,
    paperSize,
    cutLines,
    includeLotNumber,
    includeProductName,
    includeBrand,
    fgColor,
  } = parsed.data;

  const lots = await db.lot.findMany({
    where: {
      id: { in: lotIds },
      product: { userId: user.id },
    },
    include: { product: { select: { name: true, brand: true } } },
  });

  if (lots.length === 0) {
    return NextResponse.json({ error: "Aucun lot valide" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  // Generate QR code data URLs for all lots
  const publicUrls = lots.map((lot) => {
    const url = getLotPublicUrl(lot.id);
    return appUrl ? url : `/p/${lot.id}`;
  });

  const qrDataUrls = await generateBatchQrCodes(publicUrls, {
    fgColor: fgColor || undefined,
    width: 300,
    margin: 1,
  });

  const labels: LabelData[] = lots.map((lot, i) => ({
    lotNumber: lot.lotNumber,
    productName: lot.product.name,
    brand: lot.product.brand,
    publicUrl: `/p/${lot.id}`,
    qrCodeDataUrl: qrDataUrls[i],
  }));

  const html = buildLabelSheetHtml(labels, {
    layout: LABEL_PRESETS[layout],
    paperSize: paperSize as "a4" | "a5",
    cutLines,
    includeLotNumber,
    includeProductName,
    includeBrand,
  });

  // Return as HTML for opening in a new tab
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

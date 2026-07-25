import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";
import { scanAndPersistDlcAnomalies, detectCounterfeitScans } from "@/lib/ai";

// GET /api/ai/anomalies — liste les anomalies du fabricant
export async function GET(req: Request) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const type = searchParams.get("type") || undefined;

  const anomalies = await db.aIAnomaly.findMany({
    where: {
      fabricantId: user.id,
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
    },
    include: {
      lot: { select: { lotNumber: true, product: { select: { name: true, brand: true } } } },
    },
    orderBy: { detectedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ anomalies });
}

// POST /api/ai/anomalies — déclenche un scan manuel des anomalies
export async function POST(req: Request) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const scanType: string = body?.scanType || "all";

  let dlcCreated: any[] = [];
  let counterfeitAnomalies: any[] = [];

  if (scanType === "all" || scanType === "dlc") {
    dlcCreated = await scanAndPersistDlcAnomalies(user.id);
  }
  if (scanType === "all" || scanType === "counterfeit") {
    counterfeitAnomalies = await detectCounterfeitScans(user.id);
    // Persiste les nouvelles anomalies contrefaçon
    for (const c of counterfeitAnomalies) {
      const existing = await db.aIAnomaly.findFirst({
        where: { type: "counterfeit", aiMetadata: { contains: c.scanId } },
      });
      if (!existing) {
        await db.aIAnomaly.create({
          data: {
            type: "counterfeit",
            lotId: c.lotId,
            productId: (await db.lot.findUnique({ where: { id: c.lotId }, select: { productId: true } }))?.productId || null,
            fabricantId: user.id,
            severity: "critical",
            description: `Scan suspect du lot ${c.lotNumber} (${c.productName}) depuis ${c.scanCountry}${c.scanCity ? `, ${c.scanCity}` : ""} — pays non déclaré dans la zone de distribution`,
            aiMetadata: JSON.stringify({
              scanId: c.scanId,
              scanCountry: c.scanCountry,
              scanCity: c.scanCity,
              declaredCountries: c.declaredCountries,
              scannedAt: c.scannedAt,
            }),
          },
        });
      }
    }
  }

  return NextResponse.json({
    scanned: true,
    dlcAnomaliesCreated: dlcCreated.length,
    counterfeitDetected: counterfeitAnomalies.length,
    message: `Scan terminé : ${dlcCreated.length} anomalie(s) DLC, ${counterfeitAnomalies.length} scan(s) suspect(s)`,
  });
}

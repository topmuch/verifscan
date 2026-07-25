import { NextResponse } from "next/server";
import { requireFabricant } from "@/lib/session";
import { buildScansExport } from "@/lib/export";

/**
 * Exports the fabricant's scan history as CSV.
 * Optional query params: startDate, endDate (YYYY-MM-DD).
 */
export async function GET(req: Request) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const startDateStr = searchParams.get("startDate");
  const endDateStr = searchParams.get("endDate");

  let startDate: Date | undefined;
  let endDate: Date | undefined;
  if (startDateStr) startDate = new Date(startDateStr);
  if (endDateStr) {
    endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);
  }

  try {
    const { csv, filename } = await buildScansExport(user.id, startDate, endDate);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[export/scans] error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

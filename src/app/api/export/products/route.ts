import { NextResponse } from "next/server";
import { requireFabricant } from "@/lib/session";
import { buildProductsExport } from "@/lib/export";

/**
 * Exports the fabricant's products as CSV.
 */
export async function GET() {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { csv, filename } = await buildProductsExport(user.id);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[export/products] error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireFabricant } from "@/lib/session";
import { parseFileToRows, importLots } from "@/lib/import";

/**
 * POST /api/lots/import
 *
 * Multipart form-data with field "file" = CSV or XLSX file.
 * Imports multiple lots in one shot.
 *
 * Required columns (case-insensitive, French or English accepted):
 *   - productName | produit | nom_produit  (must match an existing product of the user)
 *   - manufacturingDate | date_fabrication
 *   - expirationDate | date_expiration | dlc
 *   - (optional) lotNumber, ingredients, manufacturingLocation, salesCountries, status
 *
 * Returns:
 *   { ok, summary: { totalRows, inserted, failed, results: [...] } }
 */
export async function POST(req: Request) {
  const user = await requireFabricant();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "FormData invalide" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (max 5 MB)" },
      { status: 400 }
    );
  }

  const name = file.name.toLowerCase();
  const isCsv = name.endsWith(".csv");
  const isExcel = name.endsWith(".xlsx") || name.endsWith(".xls");
  if (!isCsv && !isExcel) {
    return NextResponse.json(
      { error: "Format non supporté. Acceptés : CSV, XLSX, XLS." },
      { status: 400 }
    );
  }

  try {
    const rows = await parseFileToRows(file);
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Le fichier est vide ou ne contient aucune ligne de données." },
        { status: 400 }
      );
    }

    if (rows.length > 500) {
      return NextResponse.json(
        { error: "Trop de lignes (max 500 par import). Divisez votre fichier." },
        { status: 400 }
      );
    }

    const summary = await importLots(rows, user.id);
    return NextResponse.json({ ok: true, summary });
  } catch (err: any) {
    console.error("[lots/import POST] error:", err);
    return NextResponse.json(
      { error: err?.message || "Erreur lors de l'import" },
      { status: 500 }
    );
  }
}

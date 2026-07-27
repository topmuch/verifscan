import { NextResponse } from "next/server";
import { requireFabricant } from "@/lib/session";
import { analyzePdfCertificate } from "@/lib/pdf-extract";

/**
 * POST /api/certifications/ocr
 *
 * Multipart form-data with field "file" = PDF (max 10 MB).
 * Extracts text from the PDF and runs heuristic regex to pre-fill the
 * certification form: certificateNumber, issuedAt, expiresAt, issuer.
 *
 * Returns:
 *   {
 *     ok: true,
 *     fields: { certificateNumber, issuedAt, expiresAt, issuer, confidence },
 *     rawTextPreview: string  // first 600 chars, for debugging
 *   }
 *
 * Errors:
 *   401 if not authenticated as fabricant
 *   400 if file missing / wrong type / too large
 *   500 if PDF parsing fails
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

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: `Type non supporté: ${file.type}. PDF uniquement.` },
      { status: 400 }
    );
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "PDF trop volumineux (max 10 MB)" },
      { status: 400 }
    );
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const fields = await analyzePdfCertificate(bytes);

    return NextResponse.json({
      ok: true,
      fields: {
        certificateNumber: fields.certificateNumber,
        issuedAt: fields.issuedAt,
        expiresAt: fields.expiresAt,
        issuer: fields.issuer,
        confidence: fields.confidence,
      },
      rawTextPreview: fields.rawText.slice(0, 600),
    });
  } catch (err: any) {
    console.error("[certifications/ocr POST] error:", err);
    return NextResponse.json(
      {
        error: "Impossible d'analyser ce PDF. Vérifiez qu'il contient du texte (pas une image scannée).",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

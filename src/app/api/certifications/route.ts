import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";
import { createNotification } from "@/lib/notifications";

// GET /api/certifications — liste les certifications du fabricant
export async function GET() {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const certifications = await db.certification.findMany({
    where: { fabricantId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ certifications });
}

// POST /api/certifications — upload une nouvelle certification
export async function POST(req: Request) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { type, issuer, certificateNumber, issuedAt, expiresAt, documentUrl } = body;

  if (!type || !issuer) {
    return NextResponse.json({ error: "type et issuer requis" }, { status: 400 });
  }

  // Validation type
  const validTypes = ["bio", "halal", "iso22000", "fda", "haccp", "nsf", "cedeao"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }

  // Simulation OCR : si documentUrl fourni, on extrait automatiquement les métadonnées
  const ocrMetadata = documentUrl
    ? JSON.stringify({
        extractedText: "Certificat détecté automatiquement",
        confidence: 0.85,
        extractedAt: new Date().toISOString(),
      })
    : null;

  const cert = await db.certification.create({
    data: {
      fabricantId: user.id,
      type,
      issuer,
      certificateNumber,
      issuedAt: issuedAt ? new Date(issuedAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      documentUrl,
      verified: false,
      verificationMethod: ocrMetadata ? "ocr" : "manual",
      ocrMetadata,
    },
  });

  // Vérifie si la certification expire bientôt (< 90 jours)
  if (expiresAt) {
    const daysToExpiry = Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysToExpiry < 90) {
      await createNotification({
        userId: user.id,
        type: "cert_expiring",
        title: "Certification bientôt expirée",
        message: `Votre certificat ${type.toUpperCase()} expire dans ${daysToExpiry} jour(s). Pensez à le renouveler.`,
        link: "/dashboard/ia",
      });
    }
  }

  return NextResponse.json({ certification: cert });
}

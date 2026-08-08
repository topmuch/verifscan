import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";

/**
 * DELETE /api/certifications/[id]
 * Supprime une certification manuelle appartenant au fabricant connecté.
 * Refuse de supprimer les certifications vérifiées (verified=true) pour éviter
 * qu'un fabricant ne retire un document déjà validé par un tiers.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireFabricant();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const cert = await db.certification.findUnique({
    where: { id },
    select: { id: true, fabricantId: true, verified: true, documentUrl: true },
  });

  if (!cert) {
    return NextResponse.json({ error: "Certification introuvable" }, { status: 404 });
  }

  if (cert.fabricantId !== user.id) {
    return NextResponse.json(
      { error: "Vous ne possédez pas cette certification" },
      { status: 403 }
    );
  }

  if (cert.verified) {
    return NextResponse.json(
      {
        error:
          "Impossible de supprimer une certification déjà vérifiée. Contactez le support pour la révoquer.",
      },
      { status: 400 }
    );
  }

  await db.certification.delete({ where: { id } });

  return NextResponse.json({ ok: true, id });
}

/**
 * PUT /api/certifications/[id]
 * Met à jour une certification manuelle (issuer, certificateNumber, dates, documentUrl).
 * Type et fabricantId ne sont pas modifiables.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireFabricant();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const cert = await db.certification.findUnique({
    where: { id },
    select: { id: true, fabricantId: true, verified: true },
  });

  if (!cert) {
    return NextResponse.json({ error: "Certification introuvable" }, { status: 404 });
  }
  if (cert.fabricantId !== user.id) {
    return NextResponse.json(
      { error: "Vous ne possédez pas cette certification" },
      { status: 403 }
    );
  }
  if (cert.verified) {
    return NextResponse.json(
      { error: "Une certification vérifiée ne peut plus être modifiée." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { issuer, certificateNumber, issuedAt, expiresAt, documentUrl } = body as {
    issuer?: string;
    certificateNumber?: string;
    issuedAt?: string | null;
    expiresAt?: string | null;
    documentUrl?: string | null;
  };

  const updated = await db.certification.update({
    where: { id },
    data: {
      issuer: issuer?.trim() || undefined,
      certificateNumber: certificateNumber?.trim() || null,
      issuedAt: issuedAt ? new Date(issuedAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      documentUrl: documentUrl?.trim() || null,
    },
  });

  return NextResponse.json({ certification: updated });
}

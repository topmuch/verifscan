import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

/**
 * DELETE /api/api-keys/[id]
 * Revokes an API key (soft delete — sets revokedAt = now()).
 * The key cannot be used anymore but remains in DB for audit.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  // Find the key, ensuring ownership
  const key = await db.apiKey.findUnique({
    where: { id },
    select: { id: true, userId: true, revokedAt: true },
  });

  if (!key) {
    return NextResponse.json({ error: "Clé introuvable" }, { status: 404 });
  }

  if (key.userId !== user.id && user.role !== "superadmin") {
    return NextResponse.json({ error: "Vous ne possédez pas cette clé" }, { status: 403 });
  }

  if (key.revokedAt) {
    return NextResponse.json({ error: "Cette clé est déjà révoquée" }, { status: 400 });
  }

  await db.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ ok: true, revokedAt: new Date().toISOString() });
}

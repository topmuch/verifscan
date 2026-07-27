import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiKey, canRead } from "@/lib/session";

/**
 * GET /api/v1/me
 * Returns the API key owner's identity + permissions.
 * Useful for clients to verify their key works before making real calls.
 *
 * Headers: Authorization: Bearer vsk_live_xxx
 */
export async function GET(req: Request) {
  const apiUser = await requireApiKey(req);
  if (!apiUser) {
    return NextResponse.json(
      { error: "Clé API invalide ou manquante. Envoyez Authorization: Bearer vsk_live_..." },
      { status: 401 }
    );
  }
  if (!canRead(apiUser.permissions)) {
    return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
  }

  const user = await db.user.findUnique({
    where: { id: apiUser.id },
    select: {
      id: true,
      email: true,
      role: true,
      companyName: true,
      isActive: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    user,
    permissions: apiUser.permissions,
    apiKeyId: apiUser.apiKeyId,
  });
}

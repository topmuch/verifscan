import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, generateApiKey, hashApiKey, getApiKeyPrefix } from "@/lib/session";

/**
 * GET /api/api-keys
 * Lists the API keys of the current user (hashedKey is NOT returned, only the prefix).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const keys = await db.apiKey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      permissions: true,
      lastUsedAt: true,
      createdAt: true,
      revokedAt: true,
    },
  });

  return NextResponse.json({ keys });
}

const createSchema = z.object({
  name: z.string().min(2).max(60),
  permissions: z.enum(["read", "readwrite", "admin"]).default("read"),
});

/**
 * POST /api/api-keys
 * Creates a new API key for the current user.
 * Returns the full plaintext key ONCE — it cannot be retrieved again.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  // Limit: max 10 active keys per user
  const activeCount = await db.apiKey.count({
    where: { userId: user.id, revokedAt: null },
  });
  if (activeCount >= 10) {
    return NextResponse.json(
      { error: "Vous avez déjà 10 clés API actives. Révoquez-en une avant d'en créer une nouvelle." },
      { status: 400 }
    );
  }

  const plaintextKey = generateApiKey();
  const hashed = await hashApiKey(plaintextKey);
  const prefix = getApiKeyPrefix(plaintextKey);

  const created = await db.apiKey.create({
    data: {
      userId: user.id,
      name: parsed.data.name.trim(),
      hashedKey: hashed,
      prefix,
      permissions: parsed.data.permissions,
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      permissions: true,
      createdAt: true,
    },
  });

  // Return the plaintext key only on creation
  return NextResponse.json(
    { key: created, plaintextKey, warning: "Copiez cette clé maintenant, elle ne sera plus jamais affichée." },
    { status: 201 }
  );
}

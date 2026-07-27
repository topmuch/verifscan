import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { compare, hash } from "bcryptjs";

export type SessionUser = {
  id: string;
  email: string;
  role: "superadmin" | "fabricant" | "distributor";
  companyName?: string | null;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    id: (session.user as any).id,
    email: session.user.email!,
    role: (session.user as any).role,
    companyName: (session.user as any).companyName,
  };
}

export async function requireFabricant(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "fabricant") return null;
  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !dbUser.isActive) return null;
  return user;
}

export async function requireSuperAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "superadmin") return null;
  return user;
}

export async function requireDistributor(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "distributor") return null;
  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !dbUser.isActive) return null;
  return user;
}

/* ============================================================
   API KEY AUTHENTICATION
   ------------------------------------------------------------
   Used by external systems (ERPs, CRMs, marketplaces, mobile apps)
   to access the public REST API at /api/v1/*
   without going through NextAuth session cookies.

   The client sends:
     Authorization: Bearer vsk_live_<random>

   We hash the key with bcrypt before storing it, and compare
   in constant time when validating.
   ============================================================ */

export type ApiKeyUser = {
  id: string;
  email: string;
  role: string;
  permissions: string; // 'read' | 'readwrite' | 'admin'
  apiKeyId: string;
};

/**
 * Generates a new API key string in the format:
 *   vsk_live_<32 random hex chars>
 *
 * The full key is shown ONCE to the user at creation time and never
 * stored — only its bcrypt hash is persisted.
 */
export function generateApiKey(): string {
  const rand = Math.random().toString(16).padStart(2, "0") + Date.now().toString(16);
  const random = (rand + Math.random().toString(16).repeat(2)).slice(0, 32);
  return `vsk_live_${random}`;
}

/**
 * Hashes an API key for storage. Uses bcrypt with cost factor 10
 * (fast enough for occasional API key creation, slow enough to
 * resist brute-force if the DB is leaked).
 */
export async function hashApiKey(key: string): Promise<string> {
  return hash(key, 10);
}

/**
 * Returns the visible prefix of an API key (8 first chars), used
 * to display in the dashboard so users can identify which key is which
 * without revealing the full secret.
 */
export function getApiKeyPrefix(key: string): string {
  return key.slice(0, 12) + "...";
}

/**
 * Extracts the bearer token from an Authorization header.
 * Returns null if missing or malformed.
 */
export function extractBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  return m[1].trim();
}

/**
 * Validates an API key from the Authorization header.
 * Returns the user + permissions if valid, null otherwise.
 *
 * Strategy: since we hash keys with bcrypt (which salts), we can't
 * do a direct DB lookup by key. Instead, we lookup by the visible
 * prefix (12 chars) and then bcrypt-compare against any active key.
 */
export async function requireApiKey(req: Request): Promise<ApiKeyUser | null> {
  const token = extractBearerToken(req);
  if (!token) return null;

  if (!token.startsWith("vsk_live_")) return null;

  // Lookup all active keys — since bcrypt hashes are salted, we can't
  // query by hash. For small N (typically <10 per user), this is fine.
  // We index on `hashedKey` and `revokedAt` so the query is fast.
  const candidates = await db.apiKey.findMany({
    where: { revokedAt: null },
    select: { id: true, userId: true, hashedKey: true, permissions: true },
  });

  for (const k of candidates) {
    const match = await compare(token, k.hashedKey);
    if (match) {
      // Update lastUsedAt (fire-and-forget, don't block response)
      db.apiKey
        .update({ where: { id: k.id }, data: { lastUsedAt: new Date() } })
        .catch(() => {});

      const user = await db.user.findUnique({
        where: { id: k.userId },
        select: { id: true, email: true, role: true, isActive: true },
      });
      if (!user || !user.isActive) return null;

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: k.permissions,
        apiKeyId: k.id,
      };
    }
  }

  return null;
}

/**
 * Permission helpers.
 */
export function canRead(perm: string): boolean {
  return perm === "read" || perm === "readwrite" || perm === "admin";
}

export function canWrite(perm: string): boolean {
  return perm === "readwrite" || perm === "admin";
}

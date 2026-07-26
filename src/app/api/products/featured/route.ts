import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Public list of "featured" products — ranked by total scan count,
 * falling back to most recently created products when no scans exist.
 *
 * Query params:
 *   - limit: number of items (default 8, max 12)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(12, Math.max(1, parseInt(url.searchParams.get("limit") || "8")));

  // Raw SQL aggregating scan counts across Product -> Lot -> QRCode -> Scan.
  // Use Prisma.sql so all interpolations are properly parameterized.
  const featured = await db.$queryRaw<Array<{
    id: string;
    name: string;
    brand: string;
    description: string | null;
    photoUrl: string | null;
    weight: string | null;
    categoryId: string;
    userId: string;
    createdAt: string;
    categoryName: string;
    categoryIcon: string | null;
    companyName: string | null;
    logoUrl: string | null;
    scanCount: bigint;
  }>>(Prisma.sql`
    SELECT
      p.id           AS id,
      p.name         AS name,
      p.brand        AS brand,
      p.description  AS description,
      p."photoUrl"   AS "photoUrl",
      p.weight       AS weight,
      p."categoryId" AS "categoryId",
      p."userId"     AS "userId",
      p."createdAt"  AS "createdAt",
      c.name         AS categoryName,
      c.icon         AS categoryIcon,
      u."companyName" AS "companyName",
      u."logoUrl"    AS "logoUrl",
      COALESCE(s.cnt, 0) AS scanCount
    FROM Product p
    LEFT JOIN Category c ON c.id = p."categoryId"
    LEFT JOIN User u     ON u.id = p."userId"
    LEFT JOIN (
      SELECT l."productId" AS pid, COUNT(sc.id) AS cnt
      FROM Lot l
      JOIN "QRCode" q ON q."lotId" = l.id
      JOIN Scan sc    ON sc."qrCodeId" = q.id
      GROUP BY l."productId"
    ) s ON s.pid = p.id
    WHERE p."isVisible" = 1
    ORDER BY scanCount DESC, p."createdAt" DESC
    LIMIT ${limit}
  `);

  // Serialize bigints (SQLite returns them as BigInt) into plain numbers
  const items = featured.map((row) => ({
    id: row.id,
    name: row.name,
    brand: row.brand,
    description: row.description,
    photoUrl: row.photoUrl,
    weight: row.weight,
    categoryId: row.categoryId,
    createdAt: row.createdAt,
    scanCount: Number(row.scanCount),
    category: {
      id: row.categoryId,
      name: row.categoryName,
      icon: row.categoryIcon,
    },
    user: {
      id: row.userId,
      companyName: row.companyName ?? "Fabricant",
      logoUrl: row.logoUrl,
    },
  }));

  return NextResponse.json({ items });
}

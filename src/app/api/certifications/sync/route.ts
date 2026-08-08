import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Synchronizes certifications from official sources (SONAC, Halal, Bio, ISO).
 * Mock implementation — real connectors would call each authority's API.
 * Auth required (fabricant only).
 *
 * Query params:
 *  - source: 'sonac' | 'halal' | 'bio' | 'iso' | 'all' (default 'all')
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const fabricantId = session.user.id;

    const { searchParams } = new URL(req.url);
    const source = searchParams.get("source") || "all";

    // Look up the fabricant's company name for the mock lookup
    const fabricant = await db.user.findUnique({
      where: { id: fabricantId },
      select: { companyName: true, ninea: true },
    });
    if (!fabricant) {
      return NextResponse.json({ error: "Fabricant introuvable" }, { status: 404 });
    }

    // Mock: simulate an external API call returning certifications for this company.
    // In production, replace with real HTTP calls to SONAC, etc.
    const sourcesToSync = source === "all" ? ["sonac", "halal", "bio", "iso"] : [source];
    const created: any[] = [];

    for (const src of sourcesToSync) {
      // 30% chance of finding a cert in the mock register (to keep demo realistic)
      const mockFound = Math.random() > 0.7;
      if (!mockFound) continue;

      const externalId = `${src.toUpperCase()}-${Math.floor(Math.random() * 99999)}`;
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 6 + Math.floor(Math.random() * 18));

      const cert = await db.officialCertification.upsert({
        where: { source_externalId: { source: src, externalId } },
        update: {
          fabricantId,
          status: "valid",
          expiresAt,
          rawPayload: JSON.stringify({
            company: fabricant.companyName,
            source: src,
            mockSync: true,
          }),
          lastSyncedAt: new Date(),
        },
        create: {
          fabricantId,
          source: src,
          externalId,
          certNumber: externalId,
          productNames: null,
          issuedAt: new Date(),
          expiresAt,
          status: "valid",
          rawPayload: JSON.stringify({
            company: fabricant.companyName,
            source: src,
            mockSync: true,
          }),
        },
      });
      created.push(cert);
    }

    // List all current certs for this fabricant
    const allCerts = await db.officialCertification.findMany({
      where: { fabricantId },
      orderBy: { lastSyncedAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      synced: created.length,
      newCerts: created,
      all: allCerts,
    });
  } catch (err) {
    console.error("[certifications/sync POST] error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const fabricantId = session.user.id;

    const certs = await db.officialCertification.findMany({
      where: { fabricantId },
      orderBy: { lastSyncedAt: "desc" },
    });

    return NextResponse.json({ certifications: certs });
  } catch (err) {
    console.error("[certifications/sync GET] error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

// GET /api/debug/auth
// Public diagnostic endpoint — returns the current state of auth-relevant DB rows
// WITHOUT exposing any sensitive data. Use this to diagnose login failures.
//
// Returns:
//   - superadmin_count: how many SUPER_ADMIN users exist
//   - fabricant_count: how many fabricant users exist
//   - has_admin_email: does admin@verifscan.sn exist?
//   - has_fabricant_email: does sarine@verifscan.sn exist?
//   - any_active_users: are there any active users at all?
//   - nextauth_secret_set: is NEXTAUTH_SECRET env var set?
//   - database_url: which DATABASE_URL is configured (path only, no creds)
//   - categories_count: how many categories exist

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const db = new PrismaClient();

    const [
      superadminCount,
      fabricantCount,
      hasAdminEmail,
      hasFabricantEmail,
      activeUsersCount,
      categoriesCount,
    ] = await Promise.all([
      db.user.count({ where: { role: "superadmin" } }),
      db.user.count({ where: { role: "fabricant" } }),
      db.user.findUnique({ where: { email: "admin@verifscan.sn" } }),
      db.user.findUnique({ where: { email: "sarine@verifscan.sn" } }),
      db.user.count({ where: { isActive: true } }),
      db.category.count(),
    ]);

    await db.$disconnect();

    const dbUrl = process.env.DATABASE_URL || "(not set)";
    const dbDisplay = dbUrl.startsWith("file:")
      ? dbUrl
      : dbUrl.replace(/:[^:@/]+@/, ":***@");

    return NextResponse.json(
      {
        ok: true,
        timestamp: new Date().toISOString(),
        database_url: dbDisplay,
        nextauth_secret_set: !!process.env.NEXTAUTH_SECRET,
        nextauth_url: process.env.NEXTAUTH_URL || "(not set — NextAuth will infer)",
        users: {
          superadmin_count: superadminCount,
          fabricant_count: fabricantCount,
          active_total: activeUsersCount,
          has_admin_email: !!hasAdminEmail,
          has_fabricant_email: !!hasFabricantEmail,
          admin_is_active: hasAdminEmail?.isActive ?? null,
          admin_role: hasAdminEmail?.role ?? null,
        },
        categories_count: categoriesCount,
        is_seeded: superadminCount > 0,
        next_step:
          superadminCount === 0
            ? "POST /api/setup to create the admin + demo fabricant + categories"
            : "DB is seeded. If login still fails, check NEXTAUTH_SECRET.",
        hint:
          !process.env.NEXTAUTH_SECRET
            ? "NEXTAUTH_SECRET is NOT set. Use a 32+ char random string. Without it, JWT tokens may be invalid across restarts."
            : null,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: String(err?.message || err),
        hint: "If you see 'no such table: User', the Prisma migration did not run. POST /api/setup will trigger it implicitly via Prisma.",
      },
      { status: 500 }
    );
  }
}

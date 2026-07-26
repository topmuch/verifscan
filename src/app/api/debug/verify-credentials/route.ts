// POST /api/debug/verify-credentials
// Public diagnostic endpoint — tests a given email/password pair against the DB.
// Returns whether the user exists, whether the password matches, whether the
// account is active, and what role it has. Does NOT expose the hash.
//
// Body: { "email": "admin@verifscan.sn", "password": "admin123" }

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").toLowerCase().trim();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Missing email or password in body." },
        { status: 400 }
      );
    }

    const db = new PrismaClient();
    const user = await db.user.findUnique({ where: { email } });
    await db.$disconnect();

    if (!user) {
      return NextResponse.json(
        {
          ok: true,
          user_exists: false,
          password_match: false,
          user_active: false,
          user_role: null,
          diagnosis:
            "User not found in DB. POST /api/setup to create accounts.",
        },
        { status: 200 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    let diagnosis = "";
    if (!user.isActive) {
      diagnosis = "User exists but isActive=false. Activate the account.";
    } else if (!passwordMatch) {
      diagnosis =
        "Password does NOT match the hash stored in DB. POST /api/setup?force=true to reset the admin password to admin123 (or to ADMIN_PASSWORD env var).";
    } else {
      diagnosis =
        "Credentials are valid. If login still fails, the issue is in NextAuth (NEXTAUTH_SECRET, NEXTAUTH_URL) or in the JWT/session flow.";
    }

    return NextResponse.json(
      {
        ok: true,
        user_exists: true,
        password_match: passwordMatch,
        user_active: user.isActive,
        user_role: user.role,
        hash_length: user.passwordHash.length,
        hash_prefix: user.passwordHash.substring(0, 7),
        diagnosis,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

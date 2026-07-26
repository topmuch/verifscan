// POST /api/setup
// Triggers the production seed (admin + demo fabricant + categories) on demand.
//
// Security: this endpoint is intentionally UNAUTHENTICATED so it can bootstrap
// a fresh deployment. It is safe because:
//   1. The seeder is idempotent — running it twice is a no-op.
//   2. It does NOT overwrite existing passwords.
//   3. After the first admin exists, calling this endpoint just confirms
//      the existing state.
//
// In production you may want to remove this route once setup is complete.
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CATEGORIES = [
  { name: "Jus & Boissons", icon: "🥤" },
  { name: "Boulangerie", icon: "🍞" },
  { name: "Épices & Condiments", icon: "🌶️" },
  { name: "Conserves", icon: "🥫" },
  { name: "Céréales & Grains", icon: "🌾" },
  { name: "Produits laitiers", icon: "🥛" },
  { name: "Fruits secs", icon: "🥜" },
  { name: "Huiles", icon: "🫒" },
];

export async function POST() {
  const log = [];
  try {
    const db = new PrismaClient();

    // --- 1. Admin ---
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@verifscan.sn").toLowerCase().trim();
    const adminPwd = process.env.ADMIN_PASSWORD || "admin123";

    const existingAdmin = await db.user.findFirst({ where: { role: "superadmin" } });
    if (existingAdmin) {
      log.push(`SUPER_ADMIN exists: ${existingAdmin.email}`);
    } else {
      const pwdHash = await bcrypt.hash(adminPwd, 10);
      await db.user.create({
        data: {
          email: adminEmail,
          passwordHash: pwdHash,
          role: "superadmin",
          companyName: process.env.ADMIN_COMPANY_NAME || "VerifScan",
          phone: "+221 33 800 00 00",
          emailContact: "contact@verifscan.sn",
          address: "Dakar, Sénégal",
          isActive: true,
        },
      });
      log.push(`SUPER_ADMIN created: ${adminEmail}`);
    }

    // --- 2. Demo fabricant ---
    const fabEmail = (process.env.DEMO_FABRICANT_EMAIL || "sarine@verifscan.sn").toLowerCase().trim();
    const fabPwd = process.env.DEMO_FABRICANT_PASSWORD || "fabricant123";

    const existingFab = await db.user.findUnique({ where: { email: fabEmail } });
    if (existingFab) {
      log.push(`Demo fabricant exists: ${fabEmail}`);
    } else {
      const pwdHash = await bcrypt.hash(fabPwd, 10);
      const fab = await db.user.create({
        data: {
          email: fabEmail,
          passwordHash: pwdHash,
          role: "fabricant",
          companyName: "Sarine Bio",
          phone: "+221 77 123 45 67",
          whatsapp: "+221771234567",
          emailContact: "contact@sarinebio.sn",
          address: "Rue MZ 12, Zone Industrielle, Dakar, Sénégal",
          isActive: true,
        },
      });
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
      await db.subscription.create({
        data: {
          userId: fab.id,
          plan: "pro",
          status: "trial",
          qrCodesLimit: 5000,
          qrCodesUsed: 0,
          productsLimit: -1,
          trialEndsAt: trialEnd,
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEnd,
        },
      });
      log.push(`Demo fabricant created: ${fabEmail} (Pro trial 14j)`);
    }

    // --- 3. Categories ---
    let catCreated = 0;
    for (const cat of CATEGORIES) {
      const existing = await db.category.findUnique({ where: { name: cat.name } });
      if (!existing) {
        await db.category.create({ data: cat });
        catCreated++;
      }
    }
    log.push(`Categories: ${catCreated} created, ${CATEGORIES.length - catCreated} already present.`);

    await db.$disconnect();

    return NextResponse.json(
      {
        ok: true,
        steps: log,
        credentials: {
          admin: `admin@verifscan.sn / admin123`,
          fabricant: `sarine@verifscan.sn / fabricant123`,
        },
        note: "If you overrode ADMIN_EMAIL / ADMIN_PASSWORD env vars, use those instead.",
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err), steps: log },
      { status: 500 }
    );
  }
}

// GET returns setup status without modifying anything (safe probe)
export async function GET() {
  try {
    const db = new PrismaClient();
    const adminCount = await db.user.count({ where: { role: "superadmin" } });
    const fabricantCount = await db.user.count({ where: { role: "fabricant" } });
    const categoryCount = await db.category.count();
    await db.$disconnect();

    return NextResponse.json(
      {
        ok: true,
        status: {
          superadmin_count: adminCount,
          fabricant_count: fabricantCount,
          category_count: categoryCount,
          is_seeded: adminCount > 0,
        },
        next_step:
          adminCount === 0
            ? "POST /api/setup to create the first admin"
            : "Already seeded. POST /api/setup again is a safe no-op.",
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

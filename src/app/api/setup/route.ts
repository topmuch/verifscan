// POST /api/setup
// Triggers the production seed (admin + demo fabricant + categories) on demand.
//
// Security model:
//   - Without ?force=true: idempotent no-op (just reports current state). Safe to call.
//   - With ?force=true: resets admin & demo fabricant passwords. This is DANGEROUS
//     and is therefore gated by the SETUP_TOKEN env var when set.
//       * If process.env.SETUP_TOKEN is set, callers MUST pass ?token=<same value>.
//       * If process.env.SETUP_TOKEN is NOT set (dev/initial bootstrap), the call
//         is allowed but logged — production deployments should always set SETUP_TOKEN.
//
// This endpoint remains unauthenticated so it can bootstrap a fresh deployment
// where no admin exists yet. After bootstrap, set SETUP_TOKEN in Coolify env.
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

export async function POST(req: Request) {
  const log = [];
  try {
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "true";
    const suppliedToken = url.searchParams.get("token");

    // Gate ?force=true behind SETUP_TOKEN env var when set
    if (force) {
      const expectedToken = process.env.SETUP_TOKEN;
      if (expectedToken) {
        if (!suppliedToken || suppliedToken !== expectedToken) {
          return NextResponse.json(
            {
              ok: false,
              error:
                "FORCE_RESET_FORBIDDEN: SETUP_TOKEN is configured on this server — pass ?token=<SETUP_TOKEN> to reset passwords.",
            },
            { status: 403 }
          );
        }
      } else {
        log.push(
          "WARNING: SETUP_TOKEN env var is NOT set. Anyone with network access can reset the admin password. Set SETUP_TOKEN in Coolify env to lock this down."
        );
      }
    }

    const db = new PrismaClient();

    // --- 1. Admin ---
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@verifscan.sn").toLowerCase().trim();
    const adminPwd = process.env.ADMIN_PASSWORD || "admin123";

    const existingAdmin = await db.user.findFirst({ where: { role: "superadmin" } });
    if (existingAdmin && !force) {
      log.push(`SUPER_ADMIN exists: ${existingAdmin.email} (use ?force=true to reset password)`);
    } else if (existingAdmin && force) {
      const pwdHash = await bcrypt.hash(adminPwd, 10);
      await db.user.update({
        where: { id: existingAdmin.id },
        data: {
          passwordHash: pwdHash,
          isActive: true,
          role: "superadmin",
        },
      });
      log.push(`SUPER_ADMIN password RESET for: ${existingAdmin.email} -> ${adminPwd}`);
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
    if (existingFab && !force) {
      log.push(`Demo fabricant exists: ${fabEmail} (use ?force=true to reset password)`);
    } else if (existingFab && force) {
      const pwdHash = await bcrypt.hash(fabPwd, 10);
      await db.user.update({
        where: { id: existingFab.id },
        data: {
          passwordHash: pwdHash,
          isActive: true,
        },
      });
      log.push(`Demo fabricant password RESET for: ${fabEmail} -> ${fabPwd}`);
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

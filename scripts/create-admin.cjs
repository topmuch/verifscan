// scripts/create-admin.cjs
// Idempotent: creates a SUPER_ADMIN user if none exists yet.
// Used as part of the container entrypoint in production (Coolify).
//
// Env vars (all required in production):
//   - DATABASE_URL              (Prisma)
//   - ADMIN_EMAIL               (default: admin@verifscan.sn)
//   - ADMIN_PASSWORD            (default: Admin#2026 — MUST be overridden in prod)
//   - ADMIN_COMPANY_NAME        (default: VerifScan Admin)

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function main() {
  const db = new PrismaClient();

  const email = (process.env.ADMIN_EMAIL || "admin@verifscan.sn").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "Admin#2026";
  const companyName = process.env.ADMIN_COMPANY_NAME || "VerifScan Admin";

  console.log("[create-admin] Checking for existing SUPER_ADMIN...");

  const existing = await db.user.findFirst({
    where: { role: "superadmin" },
  });

  if (existing) {
    console.log(`[create-admin] SUPER_ADMIN already exists: ${existing.email} — skipping.`);
    await db.$disconnect();
    return;
  }

  const existingEmail = await db.user.findUnique({ where: { email } });
  if (existingEmail) {
    // Promote existing user to superadmin
    await db.user.update({
      where: { id: existingEmail.id },
      data: { role: "superadmin", isActive: true },
    });
    console.log(`[create-admin] Promoted existing user ${email} to SUPER_ADMIN.`);
    await db.$disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.create({
    data: {
      email,
      passwordHash,
      role: "superadmin",
      companyName,
      isActive: true,
    },
  });

  console.log(`[create-admin] SUPER_ADMIN created: ${email}`);
  await db.$disconnect();
}

main().catch((err) => {
  console.error("[create-admin] FATAL:", err);
  // Don't crash the container if DB isn't ready yet — exit 0 so Coolify
  // healthcheck can proceed. The next start will retry.
  process.exit(0);
});

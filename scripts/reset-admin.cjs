// scripts/reset-admin.cjs
// In-container password reset for the VerifScan superadmin.
//
// Usage (inside the Coolify container / docker exec):
//
//   # Reset admin@verifscan.sn to "admin123" (default):
//   node scripts/reset-admin.cjs
//
//   # Reset to a custom password:
//   node scripts/reset-admin.cjs --password='MyNewStrongPwd!'
//
//   # Reset a different admin email (if you renamed it via ADMIN_EMAIL):
//   node scripts/reset-admin.cjs --email=ops@verifscan.sn --password='...'
//
//   # Or via env vars (Coolify "Exec command"):
//   ADMIN_RESET_PASSWORD='...' node scripts/reset-admin.cjs
//
// This script is SAFE — it only modifies the passwordHash, isActive, and role
// of the targeted user. It does not touch any other data.

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

function parseArgs(argv) {
  const out = {};
  for (const arg of argv.slice(2)) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  const email = (args.email || process.env.ADMIN_EMAIL || "admin@verifscan.sn").toLowerCase().trim();
  const password = args.password || process.env.ADMIN_RESET_PASSWORD || process.env.ADMIN_PASSWORD || "admin123";

  if (password.length < 6) {
    console.error("[reset] ABORTED: password must be at least 6 characters.");
    process.exit(1);
  }

  const db = new PrismaClient();
  try {
    let user = await db.user.findUnique({ where: { email } });

    if (!user) {
      // Create the admin if it doesn't exist
      console.log(`[reset] User ${email} does not exist — creating it.`);
      const passwordHash = await bcrypt.hash(password, 10);
      user = await db.user.create({
        data: {
          email,
          passwordHash,
          role: "superadmin",
          companyName: process.env.ADMIN_COMPANY_NAME || "VerifScan",
          phone: "+221 33 800 00 00",
          emailContact: "contact@verifscan.sn",
          address: "Dakar, Sénégal",
          isActive: true,
        },
      });
      console.log(`[reset] ✅ Created superadmin: ${user.email}`);
      console.log(`[reset]    Password: ${password}`);
      return;
    }

    // Reset password
    const passwordHash = await bcrypt.hash(password, 10);
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isActive: true,
        role: user.role === "fabricant" || user.role === "distributor" ? "superadmin" : user.role,
      },
    });

    console.log("┌──────────────────────────────────────────────────────────┐");
    console.log("│  VerifScan — SuperAdmin password reset                   │");
    console.log("├──────────────────────────────────────────────────────────┤");
    console.log(`│  Email:    ${user.email.padEnd(46)}│`);
    console.log(`│  Password: ${password.padEnd(46)}│`);
    console.log(`│  Role:     ${(user.role === "fabricant" || user.role === "distributor" ? "superadmin (promoted)" : user.role).padEnd(46)}│`);
    console.log("└──────────────────────────────────────────────────────────┘");
    console.log("");
    console.log("[reset] You can now log in at /login with these credentials.");
  } catch (err) {
    console.error("[reset] FATAL:", err.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();

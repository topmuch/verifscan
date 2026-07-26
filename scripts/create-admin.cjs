// scripts/create-admin.cjs
// Production seeder for VerifScan.
// Idempotent — safe to run on every container start.
//
// Creates:
//   - SUPER_ADMIN:  admin@verifscan.sn  / admin123       (override with ADMIN_EMAIL / ADMIN_PASSWORD)
//   - Fabricant démo: sarine@verifscan.sn / fabricant123  (override with DEMO_FABRICANT_EMAIL / DEMO_FABRICANT_PASSWORD)
//   - 8 categories
//
// If accounts already exist they are left untouched (passwords are NOT overwritten
// on subsequent runs — only created on first run).

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

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

async function upsertAdmin(db) {
  const email = (process.env.ADMIN_EMAIL || "admin@verifscan.sn").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const companyName = process.env.ADMIN_COMPANY_NAME || "VerifScan";

  const existingByEmail = await db.user.findUnique({ where: { email } });
  if (existingByEmail) {
    if (existingByEmail.role !== "superadmin") {
      await db.user.update({
        where: { id: existingByEmail.id },
        data: { role: "superadmin", isActive: true },
      });
      console.log(`[seed] Promoted existing user ${email} to SUPER_ADMIN.`);
    } else {
      console.log(`[seed] SUPER_ADMIN already exists: ${email}`);
    }
    return;
  }

  // Also check if ANY superadmin exists (don't create a second one)
  const anyAdmin = await db.user.findFirst({ where: { role: "superadmin" } });
  if (anyAdmin) {
    console.log(`[seed] SUPER_ADMIN already exists: ${anyAdmin.email} — skipping creation of ${email}.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.create({
    data: {
      email,
      passwordHash,
      role: "superadmin",
      companyName,
      phone: "+221 33 800 00 00",
      emailContact: "contact@verifscan.sn",
      address: "Dakar, Sénégal",
      isActive: true,
    },
  });
  console.log(`[seed] SUPER_ADMIN created: ${email} / ${password}`);
}

async function upsertDemoFabricant(db) {
  const email = (process.env.DEMO_FABRICANT_EMAIL || "sarine@verifscan.sn").toLowerCase().trim();
  const password = process.env.DEMO_FABRICANT_PASSWORD || "fabricant123";

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] Demo fabricant already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const fabricant = await db.user.create({
    data: {
      email,
      passwordHash,
      role: "fabricant",
      companyName: "Sarine Bio",
      phone: "+221 77 123 45 67",
      whatsapp: "+221771234567",
      emailContact: "contact@sarinebio.sn",
      address: "Rue MZ 12, Zone Industrielle, Dakar, Sénégal",
      isActive: true,
    },
  });

  // Give the demo fabricant a 14-day Pro trial
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);
  await db.subscription.upsert({
    where: { userId: fabricant.id },
    update: {},
    create: {
      userId: fabricant.id,
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
  console.log(`[seed] Demo fabricant created: ${email} / ${password} (Pro trial 14j)`);
}

async function upsertCategories(db) {
  let created = 0;
  for (const cat of CATEGORIES) {
    const existing = await db.category.findUnique({ where: { name: cat.name } });
    if (!existing) {
      await db.category.create({ data: cat });
      created++;
    }
  }
  console.log(`[seed] Categories: ${created} created, ${CATEGORIES.length - created} already present.`);
}

async function main() {
  const db = new PrismaClient();
  try {
    console.log("[seed] Starting production seed...");
    await upsertAdmin(db);
    await upsertDemoFabricant(db);
    await upsertCategories(db);
    console.log("[seed] Done.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error("[seed] FATAL:", err);
  // Exit 0 so the container still starts — admin can retry via /api/setup
  process.exit(0);
});

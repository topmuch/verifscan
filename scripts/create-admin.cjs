// scripts/create-admin.cjs
// Production seeder for VerifScan.
// Idempotent — safe to run on every container start.
//
// Creates:
//   - SUPER_ADMIN:  admin@verifscan.sn  / admin123       (override with ADMIN_EMAIL / ADMIN_PASSWORD)
//   - Fabricant démo: sarine@verifscan.sn / fabricant123  (override with DEMO_FABRICANT_EMAIL / DEMO_FABRICANT_PASSWORD)
//   - 29 categories (14 standard + 15 export_produce)
//
// If accounts already exist they are left untouched (passwords are NOT overwritten
// on subsequent runs — only created on first run).

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const CATEGORIES = [
  // === Standard ===
  { name: "Jus & Boissons",     icon: "🥤", pageTemplate: "standard" },
  { name: "Boulangerie",        icon: "🍞", pageTemplate: "standard" },
  { name: "Épices & Condiments", icon: "🌶️", pageTemplate: "standard" },
  { name: "Conserves",          icon: "🥫", pageTemplate: "standard" },
  { name: "Céréales & Grains",  icon: "🌾", pageTemplate: "standard" },
  { name: "Produits laitiers",  icon: "🥛", pageTemplate: "standard" },
  { name: "Fruits secs & Noix", icon: "🥜", pageTemplate: "standard" },
  { name: "Huiles végétales",   icon: "🫒", pageTemplate: "standard" },
  { name: "Snacks",             icon: "🍿", pageTemplate: "standard" },
  { name: "Agroalimentaire",    icon: "🌾", pageTemplate: "standard" },
  { name: "Artisanat",          icon: "🎨", pageTemplate: "standard" },
  { name: "Cosmétiques",        icon: "💄", pageTemplate: "standard" },
  { name: "Textiles",           icon: "🧵", pageTemplate: "standard" },
  { name: "Produits transformés", icon: "🥥", pageTemplate: "standard" },
  // === export_produce ===
  { name: "Mangues",            icon: "🥭", pageTemplate: "export_produce" },
  { name: "Arachides",          icon: "🥜", pageTemplate: "export_produce" },
  { name: "Piment",             icon: "🌶️", pageTemplate: "export_produce" },
  { name: "Oignons",            icon: "🧅", pageTemplate: "export_produce" },
  { name: "Tomates",            icon: "🍅", pageTemplate: "export_produce" },
  { name: "Citrons",            icon: "🍋", pageTemplate: "export_produce" },
  { name: "Agrumes",            icon: "🍊", pageTemplate: "export_produce" },
  { name: "Produits de la pêche", icon: "🐟", pageTemplate: "export_produce" },
  { name: "Crevettes",          icon: "🦐", pageTemplate: "export_produce" },
  { name: "Hibiscus (Bissap)",  icon: "🌺", pageTemplate: "export_produce" },
  { name: "Riz",                icon: "🌾", pageTemplate: "export_produce" },
  { name: "Café",               icon: "☕", pageTemplate: "export_produce" },
  { name: "Fonio",              icon: "🌿", pageTemplate: "export_produce" },
  { name: "Sel",                icon: "🧂", pageTemplate: "export_produce" },
  { name: "Miel",               icon: "🍯", pageTemplate: "export_produce" },
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
  let updated = 0;
  for (const cat of CATEGORIES) {
    const existing = await db.category.findUnique({ where: { name: cat.name } });
    if (!existing) {
      await db.category.create({ data: cat });
      created++;
    } else if (existing.pageTemplate !== cat.pageTemplate || existing.icon !== cat.icon) {
      // Met à jour l'icône et le template si la catégorie existe déjà
      // mais avec une configuration obsolète (migration).
      await db.category.update({
        where: { id: existing.id },
        data: { icon: cat.icon, pageTemplate: cat.pageTemplate, isActive: true },
      });
      updated++;
    }
  }
  console.log(`[seed] Categories: ${created} created, ${updated} updated, ${CATEGORIES.length - created - updated} unchanged.`);
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

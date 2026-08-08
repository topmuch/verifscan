// Nettoie les catégories en base (fusionne doublons) et ajoute les nouvelles catégories
// d'export_produce. Idempotent — safe de relancer.

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

// === Liste finale attendue (32 catégories) ===
const FINAL_CATEGORIES = [
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

  // === export_produce (13 catégories) ===
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

// Catégories à supprimer (doublons fusionnés)
const TO_DELETE = ["Céréales", "Épices", "Fruits secs", "Huiles", "Fruits de mer"];

(async () => {
  console.log("🧹 Nettoyage des doublons...");
  for (const name of TO_DELETE) {
    const existing = await db.category.findUnique({ where: { name } });
    if (existing) {
      // Migrer les produits vers la catégorie fusionnée
      const replacement =
        name === "Céréales" ? "Céréales & Grains" :
        name === "Épices" ? "Épices & Condiments" :
        name === "Fruits secs" ? "Fruits secs & Noix" :
        name === "Huiles" ? "Huiles végétales" :
        name === "Fruits de mer" ? "Produits de la pêche" : null;

      if (replacement) {
        const target = await db.category.findUnique({ where: { name: replacement } });
        if (target) {
          await db.product.updateMany({
            where: { categoryId: existing.id },
            data: { categoryId: target.id },
          });
          console.log(`  ↪ produits migrés de "${name}" vers "${replacement}"`);
        }
      }
      await db.category.delete({ where: { id: existing.id } });
      console.log(`  ✗ supprimé : ${name}`);
    }
  }

  console.log("\n➕ Ajout/mise à jour des catégories finales...");
  for (const c of FINAL_CATEGORIES) {
    await db.category.upsert({
      where: { name: c.name },
      update: { icon: c.icon, pageTemplate: c.pageTemplate, isActive: true },
      create: { ...c, isActive: true },
    });
    console.log(`  ✓ ${c.icon}  ${c.name}  [${c.pageTemplate}]`);
  }

  const total = await db.category.count();
  console.log(`\n✅ Total catégories: ${total}`);

  // Stats par template
  const byTemplate = await db.category.groupBy({ by: ['pageTemplate'], _count: true });
  console.log("Répartition:");
  for (const g of byTemplate) {
    console.log(`  ${g.pageTemplate}: ${g._count}`);
  }

  await db.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });

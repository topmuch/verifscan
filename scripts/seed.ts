/**
 * Seed script for VerifScan
 * Creates:
 *  - SuperAdmin account (admin@verifscan.sn / admin123)
 *  - Demo fabricant (sarine@verifscan.sn / fabricant123) with sample product + lot + QR
 *  - Initial categories
 *
 * Run with: bun run scripts/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";

const db = new PrismaClient();

const categories = [
  { name: "Jus & Boissons", icon: "🥤" },
  { name: "Boulangerie", icon: "🍞" },
  { name: "Épices & Condiments", icon: "🌶️" },
  { name: "Conserves", icon: "🥫" },
  { name: "Céréales & Grains", icon: "🌾" },
  { name: "Produits laitiers", icon: "🥛" },
  { name: "Fruits secs", icon: "🥜" },
  { name: "Huiles", icon: "🫒" },
  { name: "Fruits de mer", icon: "🦐" },
  { name: "Agroalimentaire", icon: "🌾" },
  { name: "Artisanat", icon: "🎨" },
  { name: "Cosmétiques", icon: "💄" },
  { name: "Textiles", icon: "🧵" },
];

async function main() {
  console.log("🌱 Début du seed VerifScan...");

  // 1. SuperAdmin
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await db.user.upsert({
    where: { email: "admin@verifscan.sn" },
    update: {},
    create: {
      email: "admin@verifscan.sn",
      passwordHash: adminPassword,
      role: "superadmin",
      companyName: "VerifScan",
      phone: "+221 33 800 00 00",
      emailContact: "contact@verifscan.sn",
      address: "Dakar, Sénégal",
      isActive: true,
    },
  });
  console.log("✅ SuperAdmin créé:", admin.email);

  // 2. Categories
  for (const cat of categories) {
    await db.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${categories.length} catégories créées`);

  // 3. Demo fabricant
  const fabricantPassword = await bcrypt.hash("fabricant123", 10);
  const fabricant = await db.user.upsert({
    where: { email: "sarine@verifscan.sn" },
    update: {},
    create: {
      email: "sarine@verifscan.sn",
      passwordHash: fabricantPassword,
      role: "fabricant",
      companyName: "Sarine Bio",
      phone: "+221 77 123 45 67",
      whatsapp: "+221771234567",
      emailContact: "contact@sarinebio.sn",
      address: "Rue MZ 12, Zone Industrielle, Dakar, Sénégal",
      isActive: true,
    },
  });
  console.log("✅ Fabricant démo créé:", fabricant.email);

  // 4. Demo products
  const jusCat = await db.category.findUnique({ where: { name: "Jus & Boissons" } });
  const epicesCat = await db.category.findUnique({ where: { name: "Épices & Condiments" } });
  const boulCat = await db.category.findUnique({ where: { name: "Boulangerie" } });

  if (!jusCat || !epicesCat || !boulCat) throw new Error("Categories missing");

  const products = [
    {
      name: "Jus de Bissap Bio",
      brand: "Sarine Bio",
      description:
        "Jus de bissap 100% naturel, sans conservateurs, riche en antioxydants. Fabriqué à partir d'hibiscus biologiquement cultivé au Sénégal.",
      weight: "500ml",
      categoryName: "Jus & Boissons",
    },
    {
      name: "Jus de Gingembre",
      brand: "Sarine Bio",
      description:
        "Boisson énergisante au gingembre frais, recette traditionnelle sénégalaise. Sans additifs artificiels.",
      weight: "1L",
      categoryName: "Jus & Boissons",
    },
    {
      name: "Poudre de Mbal",
      brand: "Sarine Bio",
      description:
        "Épice locale moulue, idéale pour les sauces traditionnelles. Récolté et transformé au Sénégal.",
      weight: "200g",
      categoryName: "Épices & Condiments",
    },
  ];

  const createdProducts = [];
  for (const p of products) {
    const cat = await db.category.findUnique({ where: { name: p.categoryName } });
    if (!cat) continue;
    const product = await db.product.create({
      data: {
        userId: fabricant.id,
        categoryId: cat.id,
        name: p.name,
        brand: p.brand,
        description: p.description,
        weight: p.weight,
        isVisible: true,
      },
    });
    createdProducts.push(product);
  }
  console.log(`✅ ${createdProducts.length} produits démo créés`);

  // 5. Demo lot + QR code
  if (createdProducts.length > 0) {
    const product = createdProducts[0];
    const now = new Date();
    const manufacturingDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const expirationDate = new Date(now.getFullYear(), now.getMonth() + 5, 15);
    const lotNumber = `LOT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-1001`;

    const lot = await db.lot.create({
      data: {
        productId: product.id,
        lotNumber,
        manufacturingDate,
        expirationDate,
        ingredients:
          "Hibiscus biologique (60%), eau purifiée, sucre de canne biologique, jus de citron naturel.",
        manufacturingLocation: "Zone Industrielle, Dakar, Sénégal",
        transformationLocation: "Atelier Sarine Bio, Dakar",
        salesCountries: "Sénégal, Mali, Côte d'Ivoire, Guinée",
        status: "active",
      },
    });

    const publicUrl = `/p/${lot.id}`;
    const qrImage = await QRCode.toDataURL(`https://verifscan.sn${publicUrl}`, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#065f46", light: "#ffffff" },
    });

    await db.qRCode.create({
      data: {
        lotId: lot.id,
        publicUrl,
        qrCodeImageUrl: qrImage,
        isActive: true,
      },
    });
    console.log("✅ Lot démo + QR code créés:", lotNumber);

    // Add a few demo scans
    const qr = await db.qRCode.findFirst({ where: { lotId: lot.id } });
    if (qr) {
      for (let i = 0; i < 12; i++) {
        const daysAgo = Math.floor(Math.random() * 14);
        const scannedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        const locations = ["Dakar", "Thiès", "Saint-Louis", "Bamako", "Abidjan"];
        await db.scan.create({
          data: {
            qrCodeId: qr.id,
            scannedAt,
            location: locations[Math.floor(Math.random() * locations.length)],
            deviceType: Math.random() > 0.3 ? "mobile" : "desktop",
            userAgent: "Mozilla/5.0 (seeded)",
          },
        });
      }
      console.log("✅ 12 scans démo créés");
    }
  }

  console.log("🎉 Seed terminé avec succès!");
  console.log("\n🔑 Comptes de connexion:");
  console.log("   SuperAdmin: admin@verifscan.sn / admin123");
  console.log("   Fabricant:  sarine@verifscan.sn / fabricant123");
}

main()
  .catch((e) => {
    console.error("❌ Erreur de seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

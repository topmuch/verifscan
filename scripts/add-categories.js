// Add 5 new product categories
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const newCats = [
  { name: 'Fruits de mer',   icon: '🦐' },
  { name: 'Agroalimentaire', icon: '🌾' },
  { name: 'Artisanat',       icon: '🎨' },
  { name: 'Cosmétiques',     icon: '💄' },
  { name: 'Textiles',        icon: '🧵' },
];

(async () => {
  for (const c of newCats) {
    const created = await db.category.upsert({
      where: { name: c.name },
      update: { icon: c.icon, isActive: true },
      create: { ...c, isActive: true },
    });
    console.log(`✅ ${created.icon}  ${created.name}`);
  }
  const total = await db.category.count();
  console.log(`\nTotal catégories: ${total}`);
  await db.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const db = new PrismaClient();

async function main() {
  // Create categories
  const categories = await Promise.all([
    db.category.upsert({ where: { name: 'Jus & Boissons' }, update: {}, create: { name: 'Jus & Boissons', icon: '🧃' } }),
    db.category.upsert({ where: { name: 'Céréales' }, update: {}, create: { name: 'Céréales', icon: '🌾' } }),
    db.category.upsert({ where: { name: 'Conserves' }, update: {}, create: { name: 'Conserves', icon: '🥫' } }),
    db.category.upsert({ where: { name: 'Épices' }, update: {}, create: { name: 'Épices', icon: '🌶️' } }),
    db.category.upsert({ where: { name: 'Snacks' }, update: {}, create: { name: 'Snacks', icon: '🍿' } }),
  ]);

  // Create superadmin
  const adminPwd = await bcrypt.hash('admin123', 10);
  await db.user.upsert({
    where: { email: 'admin@verifscan.sn' },
    update: {},
    create: {
      email: 'admin@verifscan.sn',
      passwordHash: adminPwd,
      role: 'superadmin',
      companyName: 'VerifScan Admin',
    },
  });

  // Create demo fabricant
  const fabPwd = await bcrypt.hash('demo123', 10);
  const fabricant = await db.user.upsert({
    where: { email: 'demo@verifscan.sn' },
    update: {},
    create: {
      email: 'demo@verifscan.sn',
      passwordHash: fabPwd,
      role: 'fabricant',
      companyName: 'Sarine Bio',
      phone: '+221 77 123 45 67',
      whatsapp: '+221 77 123 45 67',
      emailContact: 'contact@sarinebio.sn',
      address: 'Dakar, Sénégal',
    },
  });

  // Create subscription for fabricant (Pro trial)
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);
  await db.subscription.upsert({
    where: { userId: fabricant.id },
    update: {},
    create: {
      userId: fabricant.id,
      plan: 'pro',
      status: 'trial',
      qrCodesLimit: 5000,
      qrCodesUsed: 1240,
      productsLimit: -1,
      trialEndsAt: trialEnd,
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEnd,
    },
  });

  // Create products
  const products = await Promise.all([
    db.product.create({ data: { userId: fabricant.id, categoryId: categories[0].id, name: 'Jus de Bissap Bio', brand: 'Sarine Bio', description: 'Jus naturel de bissap, sans conservateurs.', weight: '500ml', isVisible: true } }),
    db.product.create({ data: { userId: fabricant.id, categoryId: categories[0].id, name: 'Jus de Gingembre', brand: 'Sarine Bio', description: 'Jus de gingembre frais.', weight: '500ml', isVisible: true } }),
    db.product.create({ data: { userId: fabricant.id, categoryId: categories[1].id, name: 'Mil local premium', brand: 'Sarine Bio', description: 'Mil cultivé localement.', weight: '2kg', isVisible: true } }),
    db.product.create({ data: { userId: fabricant.id, categoryId: categories[3].id, name: 'Piment sec de Casamance', brand: 'Sarine Bio', description: 'Piment séché au soleil.', weight: '100g', isVisible: true } }),
  ]);

  // Create lots
  const lots = [];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    for (let j = 0; j < 2; j++) {
      const mfg = new Date();
      mfg.setMonth(mfg.getMonth() - 6 + j);
      const exp = new Date();
      exp.setMonth(exp.getMonth() + 12 - j);
      const lot = await db.lot.create({
        data: {
          productId: p.id,
          lotNumber: `LOT-2025${String(10 + i * 2 + j).padStart(2, '0')}-${1000 + i * 100 + j}`,
          manufacturingDate: mfg,
          expirationDate: exp,
          ingredients: p.description,
          manufacturingLocation: 'Dakar, Sénégal',
          transformationLocation: 'Dakar, Sénégal',
          salesCountries: 'Sénégal, Mali, Côte d\'Ivoire',
          status: j === 0 && i === 2 ? 'recalled' : 'active',
        },
      });
      lots.push(lot);
    }
  }

  // Create QR codes for some lots
  const QRCode = require('qrcode');
  for (const lot of lots.slice(0, 6)) {
    const url = `http://localhost:3000/p/${lot.id}`;
    const qr = await QRCode.toDataURL(url, { width: 512, margin: 2, color: { dark: '#065f46', light: '#ffffff' } });
    await db.qRCode.create({
      data: {
        lotId: lot.id,
        publicUrl: `/p/${lot.id}`,
        qrCodeImageUrl: qr,
        fgColor: '#065f46',
        bgColor: '#ffffff',
        isActive: true,
      },
    });
  }

  // Create scans with realistic data over the last 30 days
  const devices = ['mobile', 'desktop', 'tablet'];
  const cities = [
    { city: 'Dakar', country: 'Sénégal' },
    { city: 'Thiès', country: 'Sénégal' },
    { city: 'Bamako', country: 'Mali' },
    { city: 'Abidjan', country: "Côte d'Ivoire" },
    { city: 'Saint-Louis', country: 'Sénégal' },
  ];
  const qrs = await db.qRCode.findMany();
  const now = new Date();
  for (let i = 0; i < 500; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const scanDate = new Date(now);
    scanDate.setDate(scanDate.getDate() - daysAgo);
    scanDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    const loc = cities[Math.floor(Math.random() * cities.length)];
    await db.scan.create({
      data: {
        qrCodeId: qrs[Math.floor(Math.random() * qrs.length)].id,
        scannedAt: scanDate,
        deviceType: devices[Math.floor(Math.random() * devices.length)],
        location: `${loc.city}, ${loc.country}`,
        city: loc.city,
        country: loc.country,
        userAgent: 'Mozilla/5.0 (Mobile)',
      },
    });
  }

  // Create some notifications
  await db.notification.createMany({
    data: [
      { userId: fabricant.id, type: 'recall_alert', title: 'Lot rappelé', message: 'Le lot LOT-202514-1302 du produit "Mil local premium" a été marqué comme rappelé. Vérification qualité en cours.', link: '/dashboard/lots', isRead: false },
      { userId: fabricant.id, type: 'quota_warning', title: 'Quota bientôt atteint', message: 'Vous avez utilisé 1240/5000 QR codes ce mois-ci (25%).', link: '/dashboard/abonnement', isRead: false },
      { userId: fabricant.id, type: 'weekly_report', title: 'Rapport hebdomadaire', message: 'La semaine dernière: 87 scans enregistrés sur vos produits. Pic d\'activité le jeudi à 14h.', link: '/dashboard/statistiques', isRead: true },
      { userId: fabricant.id, type: 'payment', title: 'Paiement confirmé', message: 'Votre paiement de 25 000 FCFA pour le plan Pro a été confirmé. Facture disponible.', link: '/dashboard/abonnement', isRead: true },
    ],
  });

  console.log('Seed completed:');
  console.log('  Categories:', categories.length);
  console.log('  Products:', products.length);
  console.log('  Lots:', lots.length);
  console.log('  QR codes:', qrs.length + (lots.length > 6 ? 6 : lots.length));
  console.log('  Scans: 500');
  console.log('  Notifications: 4');
  console.log('');
  console.log('Login credentials:');
  console.log('  Admin: admin@verifscan.sn / admin123');
  console.log('  Fabricant: demo@verifscan.sn / demo123');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());

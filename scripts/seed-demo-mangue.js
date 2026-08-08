// Crée un lot démo de mangues pour visualiser le template export_produce.
// Idempotent — safe de relancer.

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

(async () => {
  // 1. Récupère (ou crée) un fabricant démo
  let fabricant = await db.user.findUnique({ where: { email: 'mangue@verifscan.sn' } });
  if (!fabricant) {
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('mangue123', 10);
    fabricant = await db.user.create({
      data: {
        email: 'mangue@verifscan.sn',
        passwordHash,
        role: 'fabricant',
        companyName: 'Mangues du Sénégal SARL',
        phone: '+221 77 123 45 67',
        whatsapp: '+221771234567',
        emailContact: 'contact@mangues-senegal.sn',
        address: 'Route de Rufisque, Dakar, Sénégal',
        isActive: true,
      },
    });
    console.log('✅ Fabricant créé :', fabricant.email);
  } else {
    console.log('ℹ️  Fabricant déjà existant :', fabricant.email);
  }

  // 2. Récupère la catégorie Mangues
  const mangueCat = await db.category.findUnique({ where: { name: 'Mangues' } });
  if (!mangueCat) {
    console.error('❌ Catégorie "Mangues" non trouvée. Lancez d\'abord scripts/cleanup-categories.js');
    process.exit(1);
  }

  // 3. Crée (ou récupère) le produit Mangue Kent
  let product = await db.product.findFirst({
    where: { userId: fabricant.id, name: 'Mangue Kent Premium Export' },
  });
  if (!product) {
    product = await db.product.create({
      data: {
        userId: fabricant.id,
        categoryId: mangueCat.id,
        name: 'Mangue Kent Premium Export',
        brand: 'Mangues du Sénégal',
        description: 'Mangues Kent de qualité supérieure, cultivées dans la Vallée du fleuve Sénégal. Récoltées à maturité optimale pour un goût sucré et une chair fondante. Conditionnées selon les normes GlobalG.A.P. et phytosanitaires pour l\'export.',
        weight: 'Carton 4 kg (6-8 mangues)',
        isVisible: true,
        variety: 'Kent',
        regionOfProduction: 'Vallée du fleuve Sénégal, Richard-Toll',
        producerStory: 'Notre exploitation familiale de 45 hectares cultive la mangue Kent depuis 3 générations dans la vallée fertile du fleuve Sénégal. Nous appliquons des pratiques agricoles durables : irrigation au goutte-à-goutte, lutte biologique contre les mouches des fruits, et traçabilité complète de la récolte à l\'export. Nos mangues sont certifiées GlobalG.A.P. et ont reçu le prix d\'Excellence Export Sénégalaise en 2024.',
        producerPhotoUrl: 'https://images.unsplash.com/photo-1605027990121-cbae9e0642df?w=400',
        photoUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600',
        gpsLat: 16.4647,
        gpsLng: -15.7031,
      },
    });
    console.log('✅ Produit créé :', product.name);
  } else {
    console.log('ℹ️  Produit déjà existant :', product.name);
  }

  // 4. Crée (ou récupère) un lot démo
  let lot = await db.lot.findFirst({
    where: { productId: product.id, lotNumber: 'LOT-MANGUE-2026-001' },
  });
  if (!lot) {
    const mfg = new Date('2026-07-15');
    const exp = new Date('2026-08-15');
    lot = await db.lot.create({
      data: {
        productId: product.id,
        lotNumber: 'LOT-MANGUE-2026-001',
        manufacturingDate: mfg,
        expirationDate: exp,
        manufacturingLocation: 'Station de conditionnement Richard-Toll',
        transformationLocation: 'Atelier d\'emballage, Dakar',
        salesCountries: 'France, Allemagne, Pays-Bas, Belgique',
        status: 'active',
        // Champs export_produce
        harvestDate: new Date('2026-07-10'),
        packagingDate: new Date('2026-07-15'),
        packagingStation: 'Station COSEM Richard-Toll',
        containerNumber: 'CMAU-4455667',
        palletNumber: 'PLT-001 à PLT-020',
        shipDate: new Date('2026-07-18'),
        destination: 'Le Havre, France',
        carrier: 'Maersk Line',
        caliber: 'Calibre A (5-6 fruits / carton)',
        avgWeightGram: 580,
        brix: 14.5,
        storageTempC: 8.5,
        shelfLifeDays: 21,
      },
    });
    console.log('✅ Lot créé :', lot.lotNumber);
  } else {
    console.log('ℹ️  Lot déjà existant :', lot.lotNumber);
  }

  // 5. Ajoute 1 certification démo (si pas déjà là)
  const existingCerts = await db.certification.count({ where: { fabricantId: fabricant.id } });
  if (existingCerts === 0) {
    await db.certification.create({
      data: {
        fabricantId: fabricant.id,
        type: 'phytosanitaire',
        issuer: 'Direction de la Protection des Végétaux (DPV) - Sénégal',
        certificateNumber: 'DPV-2026-EXP-7842',
        issuedAt: new Date('2026-01-15'),
        expiresAt: new Date('2027-01-15'),
        documentUrl: 'https://example.com/cert-phyto-2026.pdf',
        verified: true,
        verificationMethod: 'manual',
      },
    });
    await db.certification.create({
      data: {
        fabricantId: fabricant.id,
        type: 'globalgap',
        issuer: 'GlobalG.A.P. c/o AfriCert',
        certificateNumber: 'GGN-4059928761234',
        issuedAt: new Date('2025-09-01'),
        expiresAt: new Date('2026-08-31'),
        documentUrl: 'https://example.com/cert-globalgap.pdf',
        verified: true,
        verificationMethod: 'manual',
      },
    });
    await db.certification.create({
      data: {
        fabricantId: fabricant.id,
        type: 'origine',
        issuer: 'Chambre de Commerce Dakar',
        certificateNumber: 'CO-2026-SN-00451',
        issuedAt: new Date('2026-07-15'),
        expiresAt: null,
        documentUrl: 'https://example.com/cert-origine.pdf',
        verified: false,
        verificationMethod: 'manual',
      },
    });
    console.log('✅ 3 certifications créées');
  } else {
    console.log(`ℹ️  ${existingCerts} certifications déjà existantes`);
  }

  // 6. Ajoute des médias démo (si pas déjà là)
  const existingMedia = await db.lotMedia.count({ where: { lotId: lot.id } });
  if (existingMedia === 0) {
    await db.lotMedia.createMany({
      data: [
        { lotId: lot.id, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', caption: 'Vidéo de la récolte - Juillet 2026' },
        { lotId: lot.id, type: 'video', url: 'https://www.youtube.com/watch?v=9bZkp7q19f0', caption: 'Conditionnement en station' },
        { lotId: lot.id, type: 'photo', url: 'https://images.unsplash.com/photo-1605027990121-cbae9e0642df?w=600', caption: 'Verger de manguiers - Richard-Toll' },
        { lotId: lot.id, type: 'photo', url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600', caption: 'Mangues Kent prêtes à l\'export' },
        { lotId: lot.id, type: 'photo', url: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=600', caption: 'Atelier de conditionnement' },
      ],
    });
    console.log('✅ 5 médias créés (2 vidéos + 3 photos)');
  } else {
    console.log(`ℹ️  ${existingMedia} médias déjà existants`);
  }

  // 7. Génère le QR code pour ce lot
  const existingQr = await db.qRCode.findFirst({ where: { lotId: lot.id } });
  if (!existingQr) {
    const QRCode = (await import('qrcode')).default;
    const publicUrl = `/p/${lot.id}`;
    const fullUrl = `https://verifscan.com${publicUrl}`;
    const qrImage = await QRCode.toDataURL(fullUrl, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#0f4382', light: '#ffffff' },
    });
    await db.qRCode.create({
      data: {
        lotId: lot.id,
        publicUrl,
        qrCodeImageUrl: qrImage,
        isActive: true,
      },
    });
    console.log('✅ QR code généré');
  } else {
    console.log('ℹ️  QR code déjà existant');
  }

  console.log('\n🎉 Démo mangue prête !');
  console.log(`   URL publique : /p/${lot.id}`);
  console.log(`   N° de lot    : ${lot.lotNumber}`);
  console.log(`   Connexion fabricant : mangue@verifscan.sn / mangue123`);

  await db.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });

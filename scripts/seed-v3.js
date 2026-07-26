// V3 Seed — Adds distributor account, B2B products, certifications, blockchain cert
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding V3 data...');

  // 1. Create a distributor account
  const distPwd = await bcrypt.hash('dist123', 10);
  let distributorUser = await db.user.findUnique({ where: { email: 'distrib@verifscan.sn' } });
  if (!distributorUser) {
    distributorUser = await db.user.create({
      data: {
        email: 'distrib@verifscan.sn',
        passwordHash: distPwd,
        role: 'distributor',
        companyName: 'DistribPlus Sénégal',
        phone: '+221 77 555 44 33',
        address: 'Dakar, Plateau',
        isActive: true,
      },
    });
    console.log('✅ Distributeur créé: distrib@verifscan.sn / dist123');
  }

  let distributor = await db.distributor.findUnique({ where: { userId: distributorUser.id } });
  if (!distributor) {
    distributor = await db.distributor.create({
      data: {
        userId: distributorUser.id,
        companyName: 'DistribPlus Sénégal',
        ninea: '005678901',
        rccm: 'SN-DKR-2024-B-12345',
        businessCategory: 'Distribution alimentaire',
        regionsServed: 'Dakar, Thiès, Saint-Louis',
        preferredCategories: '',
        verified: true,
        verifiedAt: new Date(),
      },
    });
    console.log('✅ Profil distributeur vérifié créé');
  }

  // 2. Get the demo fabricant
  const fabricant = await db.user.findUnique({ where: { email: 'demo@verifscan.sn' } });
  if (!fabricant) {
    console.log('⚠️  Fabricant demo introuvable. Lancez seed-v2.js d\'abord.');
    return;
  }

  // 3. Add certifications to fabricant
  const existingCerts = await db.certification.count({ where: { fabricantId: fabricant.id } });
  if (existingCerts === 0) {
    await db.certification.createMany({
      data: [
        {
          fabricantId: fabricant.id,
          type: 'halal',
          issuer: 'Sénégal Halal Authority',
          certificateNumber: 'HALAL-SN-2024-001',
          issuedAt: new Date('2024-01-15'),
          expiresAt: new Date('2026-01-15'),
          verified: true,
          verifiedAt: new Date('2024-01-20'),
          verificationMethod: 'manual',
        },
        {
          fabricantId: fabricant.id,
          type: 'haccp',
          issuer: 'Bureau Veritas Sénégal',
          certificateNumber: 'HACCP-BV-2024-007',
          issuedAt: new Date('2024-03-10'),
          expiresAt: new Date('2026-03-10'),
          verified: true,
          verifiedAt: new Date('2024-03-15'),
          verificationMethod: 'api',
        },
        {
          fabricantId: fabricant.id,
          type: 'iso22000',
          issuer: 'SGS Sénégal',
          certificateNumber: 'ISO22000-SGS-2023',
          issuedAt: new Date('2023-06-01'),
          expiresAt: new Date('2026-06-01'),
          verified: true,
          verifiedAt: new Date('2023-06-10'),
          verificationMethod: 'api',
        },
        {
          fabricantId: fabricant.id,
          type: 'cedeao',
          issuer: 'Commission CEDEAO',
          certificateNumber: 'CEDEAO-P-2024-99',
          issuedAt: new Date('2024-04-01'),
          expiresAt: new Date('2027-04-01'),
          verified: false,
          verificationMethod: null,
        },
      ],
    });
    console.log('✅ 4 certifications créées (3 vérifiées, 1 en attente)');
  }

  // 4. Get the first product of fabricant, enable B2B
  const firstProduct = await db.product.findFirst({
    where: { userId: fabricant.id },
    include: { b2bInfo: true },
  });
  if (firstProduct && !firstProduct.b2bInfo) {
    await db.b2BProduct.create({
      data: {
        productId: firstProduct.id,
        distributorPriceTiers: JSON.stringify([
          { minQty: 100, price: 800 },
          { minQty: 500, price: 650 },
          { minQty: 1000, price: 550 },
        ]),
        moq: 100,
        paymentTerms: '30 jours net',
        leadTimeDays: 5,
        monthlyCapacity: 10000,
        isB2BVisible: true,
      },
    });
    console.log(`✅ Produit "${firstProduct.name}" activé en B2B`);
  }

  // Get a second product and enable B2B
  const secondProduct = await db.product.findMany({
    where: { userId: fabricant.id },
    include: { b2bInfo: true },
    skip: 1,
    take: 1,
  });
  if (secondProduct[0] && !secondProduct[0].b2bInfo) {
    await db.b2BProduct.create({
      data: {
        productId: secondProduct[0].id,
        distributorPriceTiers: JSON.stringify([
          { minQty: 50, price: 1200 },
          { minQty: 200, price: 1000 },
        ]),
        moq: 50,
        paymentTerms: '15 jours net',
        leadTimeDays: 10,
        monthlyCapacity: 5000,
        isB2BVisible: true,
      },
    });
    console.log(`✅ Produit "${secondProduct[0].name}" activé en B2B`);
  }

  // 5. Create a sample B2B order from distributor to fabricant
  const existingOrders = await db.b2BOrder.count({ where: { distributorId: distributor.id } });
  if (existingOrders === 0) {
    // Re-fetch the first product with its B2B info (it was just created above)
    const productWithB2b = await db.product.findFirst({
      where: { userId: fabricant.id },
      include: { b2bInfo: true },
    });
    const b2bProduct = productWithB2b?.b2bInfo;
    if (b2bProduct && productWithB2b) {
      // Create conversation
      const conv = await db.conversation.create({
        data: {
          distributorId: distributor.id,
          fabricantId: fabricant.id,
          productId: productWithB2b.id,
          lastMessageAt: new Date(),
        },
      });

      const unitPrice = 650;
      const qty = 500;
      const total = unitPrice * qty;

      const order = await db.b2BOrder.create({
        data: {
          orderNumber: `B2B-${Date.now()}-001`,
          distributorId: distributor.id,
          fabricantId: fabricant.id,
          conversationId: conv.id,
          status: 'quote_sent',
          totalAmount: total,
          deliveryAddress: 'Dakar Plateau, Avenue Léopold Sédar Senghor',
          notes: 'Livraison souhaitée avant le 15 du mois',
          items: {
            create: [{
              b2bProductId: b2bProduct.id,
              quantity: qty,
              unitPrice,
              total,
            }],
          },
        },
      });

      // Welcome message
      await db.b2BMessage.create({
        data: {
          conversationId: conv.id,
          senderId: distributorUser.id,
          receiverId: fabricant.id,
          senderRole: 'distributor',
          content: `Bonjour, nous souhaitons commander ${qty} unités de ${productWithB2b.name}. Pouvez-vous confirmer le délai de livraison ?`,
        },
      });

      console.log(`✅ Commande B2B créée: ${order.orderNumber} (${total} FCFA)`);
    }
  }

  // 6. Add a sample blockchain certificate to the first lot
  const firstLot = await db.lot.findFirst({
    where: { product: { userId: fabricant.id } },
  });
  if (firstLot) {
    const existingCert = await db.blockchainCertificate.findUnique({ where: { lotId: firstLot.id } });
    if (!existingCert) {
      // Compute hash (mirror lib/ai.ts logic)
      const payload = JSON.stringify({
        lotNumber: firstLot.lotNumber,
        manufacturingDate: firstLot.manufacturingDate.toISOString(),
        expirationDate: firstLot.expirationDate.toISOString(),
        productId: firstLot.productId,
        ingredients: firstLot.ingredients || '',
        salesCountries: firstLot.salesCountries || '',
      });
      const dataHash = crypto.createHash('sha256').update(payload).digest('hex');
      const randomPart = crypto
        .createHash('sha256')
        .update(`${dataHash}-${Date.now()}-${Math.random()}`)
        .digest('hex')
        .slice(0, 64);

      await db.blockchainCertificate.create({
        data: {
          lotId: firstLot.id,
          txHash: '0x' + randomPart,
          blockNumber: 60123456 + Math.floor(Math.random() * 1000),
          dataHash,
          contractAddress: '0x7Ae3F8b21c4E2c9D4a5B6C1E8f23D4e5A6B7C8D9',
          network: 'polygon',
        },
      });
      console.log(`✅ Lot ${firstLot.lotNumber} certifié sur blockchain (simulé)`);
    }
  }

  // 7. Add AI predictions for products with sufficient scans
  const products = await db.product.findMany({
    where: { userId: fabricant.id },
    include: { _count: { select: { lots: { select: { qrCodes: { select: { scans: true } } } } } } },
  });

  for (const p of products) {
    const totalScans = await db.scan.count({
      where: { qrCode: { lot: { productId: p.id } } },
    });
    if (totalScans >= 5) {
      // Vérifie pas déjà de prédiction
      const existing = await db.aIPrediction.count({ where: { productId: p.id } });
      if (existing === 0) {
        // Heuristique: trend positif pour démo
        const trend = Math.random() * 30 - 5; // -5% à +25%
        const seasonal = 15; // ramadan approche
        const finalPrediction = Math.round((trend + seasonal) * 10) / 10;
        const confidence = Math.min(95, 30 + Math.sqrt(totalScans) * 8);

        await db.aIPrediction.create({
          data: {
            productId: p.id,
            predictionType: 'demand',
            predictedValue: finalPrediction,
            confidenceScore: Math.round(confidence),
            periodStart: new Date(),
            periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            modelVersion: 'v1.0',
          },
        });
      }
    }
  }
  console.log('✅ Prédictions IA générées pour les produits avec scans');

  // 8. Add some AI anomalies for demo (DLC proche + contrefaçon)
  const lots = await db.lot.findMany({
    where: { product: { userId: fabricant.id }, status: 'active' },
    take: 3,
  });

  for (const lot of lots) {
    const daysLeft = Math.ceil(
      (lot.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft > 0 && daysLeft < 60) {
      const existing = await db.aIAnomaly.findFirst({
        where: { lotId: lot.id, type: 'dlc', status: 'open' },
      });
      if (!existing) {
        await db.aIAnomaly.create({
          data: {
            type: 'dlc',
            lotId: lot.id,
            productId: lot.productId,
            fabricantId: fabricant.id,
            severity: daysLeft < 14 ? 'critical' : 'warning',
            description: `Lot ${lot.lotNumber} expire dans ${daysLeft} jour(s) — anticipez la rotation des stocks`,
            aiMetadata: JSON.stringify({ daysLeft, ratio: 0.2 }),
          },
        });
      }
    }
  }

  // Add a counterfeit anomaly demo
  const counterfeitExisting = await db.aIAnomaly.findFirst({
    where: { type: 'counterfeit', fabricantId: fabricant.id },
  });
  if (!counterfeitExisting) {
    await db.aIAnomaly.create({
      data: {
        type: 'counterfeit',
        fabricantId: fabricant.id,
        severity: 'critical',
        description: 'Scan suspect détecté depuis la France — pays non déclaré dans la zone de distribution du lot',
        aiMetadata: JSON.stringify({
          scanCountry: 'France',
          scanCity: 'Paris',
          declaredCountries: ['Sénégal', 'Mali'],
          scannedAt: new Date().toISOString(),
        }),
      },
    });
  }

  console.log('✅ Anomalies IA (DLC + contrefaçon) créées');

  // 9. Add some AI recommendations
  const existingRecs = await db.aIRecommendation.count({ where: { fabricantId: fabricant.id } });
  if (existingRecs === 0) {
    await db.aIRecommendation.createMany({
      data: [
        {
          fabricantId: fabricant.id,
          type: 'publish_time',
          content: 'Pic d\'activité observé le mardi à 10h — publiez vos nouveaux produits à ce moment pour +40% de visibilité.',
          expectedImpactPct: 40,
        },
        {
          fabricantId: fabricant.id,
          type: 'competitive',
          content: '75% de vos produits ont une photo. Vos concurrents en ont sur 90% des leurs — ajoutez des photos pour rester compétitif.',
          expectedImpactPct: 25,
        },
        {
          fabricantId: fabricant.id,
          type: 'trust',
          content: 'Déclarez les pays de distribution de tous vos lots pour activer la détection de contrefaçon géographique.',
          expectedImpactPct: 15,
        },
      ],
    });
    console.log('✅ 3 recommandations IA créées');
  }

  console.log('\n📊 Comptes de connexion V3:');
  console.log('  👑 Admin: admin@verifscan.sn / admin123');
  console.log('  🏭 Fabricant: demo@verifscan.sn / demo123');
  console.log('  🏪 Distributeur: distrib@verifscan.sn / dist123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

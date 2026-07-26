const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
db.subscription.updateMany({
  where: { plan: 'starter' },
  data: {
    plan: 'pro',
    status: 'trial',
    qrCodesLimit: 5000,
    qrCodesUsed: 1240,
    productsLimit: -1,
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
}).then(r => { console.log('Updated:', r.count); process.exit(0); });

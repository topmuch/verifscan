const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
db.lot.findFirst({ where: { status: 'recalled' }, include: { qrCodes: { where: { isActive: true } } } })
  .then(l => { console.log(l ? JSON.stringify({ id: l.id, lotNumber: l.lotNumber }) : 'no recalled lot'); process.exit(0); });

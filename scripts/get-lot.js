const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
db.lot.findFirst({ where: { status: 'active' }, include: { qrCodes: { where: { isActive: true } } } })
  .then(l => { console.log(JSON.stringify({ id: l.id, lotNumber: l.lotNumber, qrId: l.qrCodes[0]?.id }, null, 2)); process.exit(0); });

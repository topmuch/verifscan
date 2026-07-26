const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
db.subscription.findFirst({ include: { invoices: true } }).then(s => {
  console.log(JSON.stringify(s, null, 2));
  process.exit(0);
});

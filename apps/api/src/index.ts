import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('InFocus API - Starting up...');
  console.log('Prisma Client initialized successfully');
}

main()
  .then(async () => {
    console.log('Application started');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Application error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

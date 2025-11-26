import type { PrismaClientOptions } from '@prisma/client/extension';

const config: PrismaClientOptions = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

export default config;
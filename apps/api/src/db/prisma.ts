// in src/db/prisma.ts

import { PrismaClient } from '@prisma/client';

// Erstellt die EINE globale Instanz von PrismaClient
export const prisma = new PrismaClient();

import { PrismaClient } from "@prisma/client";

// Én PrismaClient per prosess – unngår at hot reload i dev åpner
// stadig nye databasetilkoblinger.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

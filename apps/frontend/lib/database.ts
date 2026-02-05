import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma_v3: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma_v3 ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma_v3 = db;

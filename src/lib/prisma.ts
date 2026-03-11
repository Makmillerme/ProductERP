/**
 * Синглтон клієнта Prisma для уникнення множинних інстансів при hot reload.
 * Імпортувати з @/lib/prisma у Server Components та API routes.
 *
 * Prisma 7 вимагає або adapter (postgres://), або accelerateUrl (prisma+postgres://).
 */
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (url?.startsWith("prisma+postgres")) {
    return new PrismaClient({ accelerateUrl: url });
  }
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

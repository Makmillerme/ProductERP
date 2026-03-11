/**
 * Seed: ProductStatuses (без категорій і типів).
 * Категорії, типи, поля та таби створюються вручну в адмінці «Модель даних».
 * Run: npx tsx prisma/seed-vehicle-cms.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (url.startsWith("prisma+postgres")) {
    return new PrismaClient({ accelerateUrl: url });
  }
  const pool = new Pool({ connectionString: url });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

const prisma = createPrisma();

const DEFAULT_STATUSES = [
  { name: "Чернетка", code: "draft", color: "#6b7280", order: 0, isDefault: true },
  { name: "На перевірці", code: "review", color: "#f59e0b", order: 1 },
  { name: "Активне", code: "active", color: "#22c55e", order: 2 },
  { name: "В дорозі", code: "in_transit", color: "#3b82f6", order: 3 },
  { name: "На складі", code: "in_stock", color: "#8b5cf6", order: 4 },
  { name: "Продано", code: "sold", color: "#ec4899", order: 5 },
  { name: "Архів", code: "archive", color: "#9ca3af", order: 6 },
];

async function main() {
  console.log("Seeding Vehicle CMS (statuses only)...");

  for (const s of DEFAULT_STATUSES) {
    await prisma.productStatus.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
    console.log(`  ProductStatus: ${s.code} (${s.name})`);
  }

  console.log("Vehicle CMS seed complete. Створіть категорію, поля та таби вручну в розділі «Модель даних».");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

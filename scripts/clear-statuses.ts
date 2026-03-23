/**
 * Очищає всі статуси (ProductStatus).
 * Спочатку обнуляє product_status_id у products.
 * Запуск: npx tsx scripts/clear-statuses.ts
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

async function main() {
  console.log("Очищення статусів...");
  await prisma.product.updateMany({ data: { productStatusId: null } });
  const deleted = await prisma.productStatus.deleteMany({});
  console.log(`Готово. Видалено ${deleted.count} статусів.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

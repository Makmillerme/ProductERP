/**
 * Очищає БД, зберігаючи лише User, Session, Account, Verification.
 * Запуск: npm run db:clear
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
  console.log("Очищення БД (зберігаємо User, Session, Account, Verification)...");

  await prisma.$transaction(async (tx) => {
    await tx.productFieldValue.deleteMany({});
    await tx.productMedia.deleteMany({});
    await tx.productDocument.deleteMany({});
    await tx.product.deleteMany({});
    await tx.tabField.deleteMany({});
    await tx.fieldDefinitionCategory.deleteMany({});
    await tx.fieldDefinitionProductType.deleteMany({});
    await tx.dataSourceMapping.deleteMany({});
    await tx.displayConfig.deleteMany({});
    await tx.tabDefinition.deleteMany({});
    await tx.fieldDefinition.deleteMany({});
    await tx.productType.deleteMany({});
    await tx.productStatus.deleteMany({});
    await tx.category.deleteMany({});
    await tx.rolePermission.deleteMany({});
    await tx.role.deleteMany({});
  });

  const userCount = await prisma.user.count();
  console.log(`Готово. Залишено ${userCount} користувачів.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

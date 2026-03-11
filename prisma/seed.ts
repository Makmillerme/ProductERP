/**
 * Seed власника з .env (OWNER_EMAIL, OWNER_PASSWORD).
 * Створює/оновлює користувача з role = "owner".
 * Запуск: npx tsx prisma/seed.ts або npm run db:seed
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const OWNER_ROLE = "owner";

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
  const email = process.env.OWNER_EMAIL?.trim();
  const password = process.env.OWNER_PASSWORD;

  if (!email || !password) {
    console.log("Не задано OWNER_EMAIL або OWNER_PASSWORD — seed власника пропущено.");
    return;
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    if (existing.role === OWNER_ROLE) {
      console.log("Власник з таким email вже існує.");
      return;
    }
    // Якщо існує інший власник — знімаємо його роль (owner може бути лише один)
    const existingOwner = await prisma.user.findFirst({ where: { role: OWNER_ROLE } });
    if (existingOwner && existingOwner.id !== existing.id) {
      await prisma.user.update({ where: { id: existingOwner.id }, data: { role: "admin" } });
      console.log(`Попереднього власника ${existingOwner.email} переведено в admin.`);
    }
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: OWNER_ROLE },
    });
    const acc = await prisma.account.findFirst({
      where: { userId: existing.id, providerId: "credential" },
    });
    if (acc) {
      const hash = await hashPassword(password);
      await prisma.account.update({
        where: { id: acc.id },
        data: { password: hash, updatedAt: new Date() },
      });
    }
    console.log("Роль оновлено на owner, пароль оновлено.");
    return;
  }

  // Якщо існує інший owner — знімаємо його роль
  const existingOwner = await prisma.user.findFirst({ where: { role: OWNER_ROLE } });
  if (existingOwner) {
    await prisma.user.update({ where: { id: existingOwner.id }, data: { role: "admin" } });
    console.log(`Попереднього власника ${existingOwner.email} переведено в admin.`);
  }

  const userId = randomUUID();
  const accountId = randomUUID();
  const hashedPassword = await hashPassword(password);
  const now = new Date();

  await prisma.user.create({
    data: {
      id: userId,
      name: "Власник",
      email: normalizedEmail,
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
      role: OWNER_ROLE,
      banned: false,
    },
  });

  await prisma.account.create({
    data: {
      id: accountId,
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log("Власника створено:", normalizedEmail);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

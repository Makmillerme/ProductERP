/**
 * Одноразовий скрипт: створює БД vmd_parser, якщо її ще немає.
 * Запуск: npx tsx prisma/create-db.ts
 */
import "dotenv/config";
import { Pool } from "pg";

const url = process.env.DATABASE_URL;
if (!url || !url.startsWith("postgresql://")) {
  console.error("DATABASE_URL має бути postgresql://...");
  process.exit(1);
}

// Підключаємося до служебної БД postgres, щоб створити нову
const baseUrl = url.replace(/\/[^/]+$/, "/postgres");
const pool = new Pool({ connectionString: baseUrl });

const DB_NAME = "vmd_parser";

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [DB_NAME]
    );
    if (res.rowCount && res.rowCount > 0) {
      console.log(`База "${DB_NAME}" вже існує.`);
      return;
    }
    await client.query(`CREATE DATABASE "${DB_NAME}"`);
    console.log(`База "${DB_NAME}" створена.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

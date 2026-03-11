/**
 * Збереження документів для картки товару.
 * Базовий каталог: public/uploads/products/{productId}/docs/{folder}/
 * В БД зберігаємо filePath як URL: /uploads/products/{productId}/docs/{folder}/{filename}
 */
import path from "node:path";
import fs from "node:fs/promises";

const UPLOAD_BASE = "public/uploads";

export function getProductDocDir(productId: number, folder: string): string {
  return path.join(process.cwd(), UPLOAD_BASE, "products", String(productId), "docs", folder);
}

export function getDocPath(productId: number, folder: string, filename: string): string {
  return `/uploads/products/${productId}/docs/${folder}/${filename}`;
}

function safeFilename(filename: string): string {
  const base = path.basename(filename);
  return base.replace(/[^a-zA-Z0-9._\-а-яА-ЯіїєґІЇЄҐ]/gu, "_") || "file";
}

export async function saveProductDocFile(
  productId: number,
  folder: string,
  file: File,
  uniqueId: string
): Promise<{ filePath: string; mimeType: string | null; fileSize: number }> {
  const dir = getProductDocDir(productId, folder);
  await fs.mkdir(dir, { recursive: true });
  const ext = path.extname(file.name) || "";
  const base = safeFilename(path.basename(file.name, ext));
  const filename = `${base}-${uniqueId}${ext}`.replace(/^_+/, "");
  const fullPath = path.join(dir, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buf);
  return {
    filePath: getDocPath(productId, folder, filename),
    mimeType: file.type || null,
    fileSize: file.size,
  };
}

export async function deleteProductDocFile(productId: number, dbPath: string): Promise<void> {
  if (!dbPath.startsWith(`/uploads/products/${productId}/docs/`)) return;
  const fullPath = path.join(process.cwd(), "public", dbPath.replace(/^\//, ""));
  try {
    await fs.unlink(fullPath);
  } catch {
    // файл вже видалено або не існує
  }
}

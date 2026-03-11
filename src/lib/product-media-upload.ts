/**
 * Збереження медіа для картки товару: окрема папка на кожен товар.
 * Базовий каталог: public/uploads/products/{productId}/
 * У БД зберігаємо path як URL-шлях: /uploads/products/{productId}/{filename}
 */
import path from "node:path";
import fs from "node:fs/promises";

const UPLOAD_BASE = "public/uploads";

export function getProductMediaDir(productId: number): string {
  return path.join(process.cwd(), UPLOAD_BASE, "products", String(productId));
}

/** Відносний URL для доступу з клієнта (path у БД). */
export function getMediaPath(productId: number, filename: string): string {
  return `/uploads/products/${productId}/${filename}`;
}

/** Перевірка, що filename без path traversal. */
function safeFilename(filename: string): string {
  const base = path.basename(filename);
  return base.replace(/[^a-zA-Z0-9._-]/g, "_") || "file";
}

/** Зберегти файл у папку товару, повернути path для БД. */
export async function saveProductMediaFile(
  productId: number,
  file: File,
  uniqueId: string
): Promise<{ path: string; mimeType: string | null; kind: "image" | "video" }> {
  const dir = getProductMediaDir(productId);
  await fs.mkdir(dir, { recursive: true });
  const ext = path.extname(file.name) || "";
  const base = safeFilename(path.basename(file.name, ext));
  const filename = `${base}-${uniqueId}${ext}`.replace(/^_/, "");
  const fullPath = path.join(dir, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buf);
  const mime = file.type || null;
  const kind = mime?.startsWith("image/") ? "image" : mime?.startsWith("video/") ? "video" : "image";
  return {
    path: getMediaPath(productId, filename),
    mimeType: mime || null,
    kind,
  };
}

/** Видалити файл за path з БД (path = /uploads/products/123/...). */
export async function deleteProductMediaFile(productId: number, dbPath: string): Promise<void> {
  if (!dbPath.startsWith(`/uploads/products/${productId}/`)) return;
  const filename = path.basename(dbPath);
  if (!filename || filename === "." || filename === "..") return;
  const fullPath = path.join(process.cwd(), "public", dbPath.replace(/^\//, ""));
  try {
    await fs.unlink(fullPath);
  } catch {
    // файл вже видалено або не існує
  }
}

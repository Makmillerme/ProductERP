import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getProductById } from "@/lib/products-db";
import { saveProductDocFile } from "@/lib/product-document-upload";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

/** Дозволені символи для папки (без path traversal). Папки задаються в tabConfig табу. */
const SAFE_FOLDER_REGEX = /^[a-zA-Z0-9_-]+$/;

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: "Невірний ID" }, { status: 400 });
  }
  try {
    const docs = await prisma.productDocument.findMany({
      where: { productId: numId },
      orderBy: [{ folder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ documents: docs });
  } catch (e) {
    console.error("[GET /api/products/[id]/documents]", e);
    return NextResponse.json({ error: "Помилка отримання документів" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: "Невірний ID" }, { status: 400 });
  }
  try {
    const product = await getProductById(numId);
    if (!product) {
      return NextResponse.json({ error: "Товар не знайдено" }, { status: 404 });
    }
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Файл не обрано" }, { status: 400 });
    }
    if (typeof folder !== "string" || !folder.trim() || !SAFE_FOLDER_REGEX.test(folder.trim())) {
      return NextResponse.json({ error: "Невірна папка" }, { status: 400 });
    }
    const safeFolder = folder.trim();
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Файл занадто великий (макс. 100 МБ)" }, { status: 400 });
    }
    const uniqueId = randomUUID().slice(0, 8);
    const { filePath, mimeType, fileSize } = await saveProductDocFile(numId, safeFolder, file, uniqueId);
    const doc = await prisma.productDocument.create({
      data: {
        productId: numId,
        folder: safeFolder,
        fileName: file.name,
        filePath,
        mimeType,
        fileSize,
      },
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (e) {
    console.error("[POST /api/products/[id]/documents]", e);
    return NextResponse.json({ error: "Помилка завантаження документу" }, { status: 500 });
  }
}

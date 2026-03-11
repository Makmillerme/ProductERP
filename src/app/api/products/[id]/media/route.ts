import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/lib/products-db";
import { createProductMedia } from "@/lib/products-db";
import { saveProductMediaFile } from "@/lib/product-media-upload";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) {
      return NextResponse.json({ error: "Невірний ID" }, { status: 400 });
    }
    const product = await getProductById(numId);
    if (!product) {
      return NextResponse.json({ error: "Товар не знайдено" }, { status: 404 });
    }
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Файл не обрано" }, { status: 400 });
    }
    const type = file.type || "";
    const isImage = type.startsWith("image/");
    const isVideo = type.startsWith("video/");
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "Дозволено лише зображення та відео" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Файл занадто великий (макс. 50 МБ)" }, { status: 400 });
    }
    const uniqueId = randomUUID().slice(0, 8);
    const { path: mediaPath, mimeType, kind } = await saveProductMediaFile(numId, file, uniqueId);
    const media = await createProductMedia(numId, { path: mediaPath, mimeType, kind });
    return NextResponse.json(
      {
        id: media.id,
        product_id: media.product_id,
        path: media.path,
        mime_type: media.mime_type,
        kind: media.kind,
        order: media.order,
        created_at: media.created_at,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("[POST /api/products/[id]/media]", e);
    return NextResponse.json(
      { error: "Помилка завантаження медіа" },
      { status: 500 }
    );
  }
}

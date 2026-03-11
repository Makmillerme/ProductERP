import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/lib/products-db";
import { deleteProductMediaById } from "@/lib/products-db";
import { deleteProductMediaFile } from "@/lib/product-media-upload";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; mediaId: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id, mediaId } = await params;
    const productNumId = parseInt(id, 10);
    const mediaNumId = parseInt(mediaId, 10);
    if (Number.isNaN(productNumId) || Number.isNaN(mediaNumId)) {
      return NextResponse.json({ error: "Невірний ID" }, { status: 400 });
    }
    const product = await getProductById(productNumId);
    if (!product) {
      return NextResponse.json({ error: "Товар не знайдено" }, { status: 404 });
    }
    const deleted = await deleteProductMediaById(productNumId, mediaNumId);
    if (!deleted) {
      return NextResponse.json({ error: "Медіа не знайдено" }, { status: 404 });
    }
    await deleteProductMediaFile(productNumId, deleted.path);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/products/[id]/media/[mediaId]]", e);
    return NextResponse.json(
      { error: "Помилка видалення медіа" },
      { status: 500 }
    );
  }
}

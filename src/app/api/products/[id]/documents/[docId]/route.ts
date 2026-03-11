import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteProductDocFile } from "@/lib/product-document-upload";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; docId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id, docId } = await params;
  const numId = parseInt(id, 10);
  const numDocId = parseInt(docId, 10);
  if (Number.isNaN(numId) || Number.isNaN(numDocId)) {
    return NextResponse.json({ error: "Невірний ID" }, { status: 400 });
  }
  try {
    const doc = await prisma.productDocument.findUnique({ where: { id: numDocId } });
    if (!doc || doc.productId !== numId) {
      return NextResponse.json({ error: "Документ не знайдено" }, { status: 404 });
    }
    await prisma.productDocument.delete({ where: { id: numDocId } });
    await deleteProductDocFile(numId, doc.filePath);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/products/[id]/documents/[docId]]", e);
    return NextResponse.json({ error: "Помилка видалення документу" }, { status: 500 });
  }
}

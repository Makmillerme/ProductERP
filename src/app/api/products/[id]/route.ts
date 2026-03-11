import { NextRequest, NextResponse } from "next/server";
import { getProductById, updateProduct, deleteProduct } from "@/lib/products-db";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
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
    return NextResponse.json(product, {
      headers: {
        "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
      },
    });
  } catch (e) {
    console.error("[GET /api/products/[id]]", e);
    return NextResponse.json(
      { error: "Помилка отримання товару" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) {
      return NextResponse.json({ error: "Невірний ID" }, { status: 400 });
    }
    const body = await request.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit id, created_at from client payload
    const { id: _id, created_at: _ca, ...data } = body;
    const product = await updateProduct(numId, data);
    if (!product) {
      return NextResponse.json({ error: "Товар не знайдено або помилка оновлення" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (e) {
    console.error("[PATCH /api/products/[id]]", e);
    return NextResponse.json(
      { error: "Помилка оновлення товару" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) {
      return NextResponse.json({ error: "Невірний ID" }, { status: 400 });
    }
    const ok = await deleteProduct(numId);
    if (!ok) {
      return NextResponse.json({ error: "Товар не знайдено або помилка видалення" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/products/[id]]", e);
    return NextResponse.json(
      { error: "Помилка видалення товару" },
      { status: 500 }
    );
  }
}

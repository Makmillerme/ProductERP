import { NextRequest, NextResponse } from "next/server";
import { listProducts, createProduct } from "@/lib/products-db";
import type { ProductFilterState } from "@/features/products/types";
import type { ProductColumnId } from "@/features/products/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const sortKey = (searchParams.get("sortKey") ?? "created_at") as ProductColumnId | null;
    const sortDir = (searchParams.get("sortDir") ?? "desc") as "asc" | "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(500, Math.max(1, parseInt(searchParams.get("pageSize") ?? "100", 10)));
    const categoryId = searchParams.get("categoryId") ?? null;

    const filter: ProductFilterState = {};
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith("filter_") && value != null && value !== "") {
        filter[key.slice(7)] = value;
      }
    }

    const searchableFieldsRaw = searchParams.get("searchableFields") ?? "";
    const searchableFieldCodes = searchableFieldsRaw
      ? searchableFieldsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

    const result = await listProducts({
      search,
      filter,
      sortKey: sortKey || null,
      sortDir,
      page,
      pageSize,
      categoryId: categoryId || undefined,
      searchableFieldCodes,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
      },
    });
  } catch (e) {
    console.error("[GET /api/products]", e);
    return NextResponse.json(
      { error: "Помилка отримання списку товарів" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit id, created_at from client payload
    const { id, created_at, ...data } = body;
    const created = await createProduct(data);
    return NextResponse.json(created);
  } catch (e) {
    console.error("[POST /api/products]", e);
    return NextResponse.json(
      { error: "Помилка створення товару" },
      { status: 500 }
    );
  }
}

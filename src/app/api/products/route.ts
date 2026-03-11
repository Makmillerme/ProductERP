import { NextRequest, NextResponse } from "next/server";
import { listProducts, createProduct } from "@/lib/products-db";
import type { ProductFilterState } from "@/features/vehicles/types";
import type { ProductColumnId } from "@/features/vehicles/types";

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

    const filter: ProductFilterState = {
      product_type: searchParams.get("filter_product_type") ?? "",
      brand: searchParams.get("filter_brand") ?? "",
      model: searchParams.get("filter_model") ?? "",
      year_from: searchParams.get("filter_year_from") ?? "",
      year_to: searchParams.get("filter_year_to") ?? "",
      value_from: searchParams.get("filter_value_from") ?? "",
      value_to: searchParams.get("filter_value_to") ?? "",
    };

    const result = await listProducts({
      search,
      filter,
      sortKey: sortKey || null,
      sortDir,
      page,
      pageSize,
      categoryId: categoryId || undefined,
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
    const payload_json = typeof data.payload_json === "string" ? data.payload_json : "{}";
    const created = await createProduct({ ...data, payload_json });
    return NextResponse.json(created);
  } catch (e) {
    console.error("[POST /api/products]", e);
    return NextResponse.json(
      { error: "Помилка створення товару" },
      { status: 500 }
    );
  }
}

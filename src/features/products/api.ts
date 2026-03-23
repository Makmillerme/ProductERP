/**
 * Клієнт API для обліку товарів (CRUD) та медіа.
 */
import type { Product, ProductMedia, ProductFilterState, ProductColumnId } from "./types";

const BASE = "/api/products";

export type ListProductsQuery = {
  search?: string;
  sortKey?: ProductColumnId | null;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  filter?: ProductFilterState;
  /** Фільтр по категорії (productType.categoryId) */
  categoryId?: string | null;
  /** Коди полів для пошуку. Якщо не передано — використовується дефолт на сервері. */
  searchableFields?: string[];
};

export type ListProductsResponse = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
};

export async function fetchProducts(query: ListProductsQuery = {}): Promise<ListProductsResponse> {
  const params = new URLSearchParams();
  if (query.search != null) params.set("search", query.search);
  if (query.sortKey != null) params.set("sortKey", query.sortKey);
  if (query.sortDir != null) params.set("sortDir", query.sortDir);
  if (query.page != null) params.set("page", String(query.page));
  if (query.pageSize != null) params.set("pageSize", String(query.pageSize));
  if (query.categoryId) params.set("categoryId", query.categoryId);
  if (query.filter && Object.keys(query.filter).length > 0) {
    for (const [key, value] of Object.entries(query.filter)) {
      if (value != null && String(value).trim() !== "")
        params.set(`filter_${key}`, String(value));
    }
  }
  if (query.searchableFields?.length) {
    params.set("searchableFields", query.searchableFields.join(","));
  }
  const res = await fetch(`${BASE}?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Помилка завантаження");
  }
  return res.json();
}

export async function fetchProductById(id: number): Promise<Product | null> {
  const res = await fetch(`${BASE}/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Помилка завантаження");
  }
  return res.json();
}

export async function createProduct(data: Omit<Product, "id" | "created_at">): Promise<Product> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Помилка створення");
  }
  return res.json();
}

export async function updateProduct(id: number, data: Partial<Omit<Product, "id">>): Promise<Product> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Помилка оновлення");
  }
  return res.json();
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE", cache: "no-store" });
  if (res.status === 404) return; // вже видалено — ідемпотентний успіх, щоб не показувати помилку при повторному кліку
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Помилка видалення");
  }
}

export type ProductMediaCreated = ProductMedia;

export async function uploadProductMedia(productId: number, file: File): Promise<ProductMediaCreated> {
  const formData = new FormData();
  formData.set("file", file);
  const res = await fetch(`${BASE}/${productId}/media`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Помилка завантаження медіа");
  }
  return res.json();
}

export async function deleteProductMedia(productId: number, mediaId: number): Promise<void> {
  const res = await fetch(`${BASE}/${productId}/media/${mediaId}`, { method: "DELETE", cache: "no-store" });
  if (res.status === 404) return;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Помилка видалення медіа");
  }
}

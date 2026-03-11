/**
 * Клієнт API для обліку товарів (CRUD) та медіа.
 */
import type { Product, ProductMedia, ProductFilterState, ProductColumnId } from "./types";

const BASE = "/api/products";

export type ListVehiclesQuery = {
  search?: string;
  sortKey?: ProductColumnId | null;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  filter?: ProductFilterState;
  /** Фільтр по категорії (productType.categoryId) */
  categoryId?: string | null;
};

export type ListVehiclesResponse = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
};

export async function fetchVehicles(query: ListVehiclesQuery = {}): Promise<ListVehiclesResponse> {
  const params = new URLSearchParams();
  if (query.search != null) params.set("search", query.search);
  if (query.sortKey != null) params.set("sortKey", query.sortKey);
  if (query.sortDir != null) params.set("sortDir", query.sortDir);
  if (query.page != null) params.set("page", String(query.page));
  if (query.pageSize != null) params.set("pageSize", String(query.pageSize));
  if (query.categoryId) params.set("categoryId", query.categoryId);
  if (query.filter) {
    if (query.filter.product_type) params.set("filter_product_type", query.filter.product_type);
    if (query.filter.brand) params.set("filter_brand", query.filter.brand);
    if (query.filter.model) params.set("filter_model", query.filter.model);
    if (query.filter.year_from) params.set("filter_year_from", query.filter.year_from);
    if (query.filter.year_to) params.set("filter_year_to", query.filter.year_to);
    if (query.filter.value_from) params.set("filter_value_from", query.filter.value_from);
    if (query.filter.value_to) params.set("filter_value_to", query.filter.value_to);
  }
  const res = await fetch(`${BASE}?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Помилка завантаження");
  }
  return res.json();
}

export async function fetchVehicleById(id: number): Promise<Product | null> {
  const res = await fetch(`${BASE}/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Помилка завантаження");
  }
  return res.json();
}

export async function createVehicle(data: Omit<Product, "id" | "created_at">): Promise<Product> {
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

export async function updateVehicle(id: number, data: Partial<Omit<Product, "id">>): Promise<Product> {
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

export async function deleteVehicle(id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE", cache: "no-store" });
  if (res.status === 404) return; // вже видалено — ідемпотентний успіх, щоб не показувати помилку при повторному кліку
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Помилка видалення");
  }
}

export type VehicleMediaCreated = ProductMedia;

export async function uploadVehicleMedia(vehicleId: number, file: File): Promise<VehicleMediaCreated> {
  const formData = new FormData();
  formData.set("file", file);
  const res = await fetch(`${BASE}/${vehicleId}/media`, {
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

export async function deleteVehicleMedia(vehicleId: number, mediaId: number): Promise<void> {
  const res = await fetch(`${BASE}/${vehicleId}/media/${mediaId}`, { method: "DELETE", cache: "no-store" });
  if (res.status === 404) return;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Помилка видалення медіа");
  }
}

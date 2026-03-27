import { adminGetJson } from "./client";

export type AdminCategoryRow = {
  id: string;
  name: string;
  order: number;
  _count?: { productTypes: number; tabs: number };
};

export type AdminProductTypeRow = {
  id: string;
  name: string;
  categoryId: string | null;
};

type TFn = (key: string) => string;

/** GET /api/admin/categories — нормалізація як у попередніх queryFn. */
export async function fetchAdminCategories(t: TFn): Promise<AdminCategoryRow[]> {
  const data = await adminGetJson<unknown>("/categories", t("common.loadCategoriesFailed"));
  if (Array.isArray(data)) return data as AdminCategoryRow[];
  if (data && typeof data === "object" && data !== null && "categories" in data) {
    const c = (data as { categories: unknown }).categories;
    if (Array.isArray(c)) return c as AdminCategoryRow[];
  }
  return [];
}

/** GET /api/admin/product-types */
export async function fetchAdminProductTypes(
  t: TFn,
  loadFailedKey: string = "common.loadTypesFailed"
): Promise<AdminProductTypeRow[]> {
  const data = await adminGetJson<unknown>("/product-types", t(loadFailedKey));
  if (Array.isArray(data)) return data as AdminProductTypeRow[];
  if (data && typeof data === "object" && data !== null) {
    const o = data as { productTypes?: unknown; vehicleTypes?: unknown };
    const list = o.productTypes ?? o.vehicleTypes;
    if (Array.isArray(list)) return list as AdminProductTypeRow[];
  }
  return [];
}

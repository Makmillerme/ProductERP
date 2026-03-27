/**
 * Типи та конфіг колонок для Обліку товару.
 * Product — лише базові поля + динамічні поля через EAV (по code).
 */

export type ProductMedia = {
  id: number;
  product_id: number;
  path: string;
  mime_type: string | null;
  kind: "image" | "video" | null;
  order: number;
  created_at: string;
};

/** Базові поля Product + динамічні поля по code. */
export type Product = {
  id: number;
  processed_file_id: number | null;
  product_status_id: string | null;
  product_type_id: string | null;
  category_id: string | null;
  created_at: string;
  media?: ProductMedia[];
} & Record<string, unknown>;

/** Ідентифікатори колонок: base keys + динамічні codes полів картки. */
export type ProductColumnId =
  | "id"
  | "processed_file_id"
  | "product_status_id"
  | "product_type_id"
  | "category_id"
  | "created_at"
  | string;

export type ProductColumnConfig = {
  id: ProductColumnId;
  label: string;
  defaultVisible: boolean;
  align?: "left" | "right";
  minWidth?: string;
  dataType?: string;
};

/** Мін. ширина динамічних колонок списку товарів (компактно, зліва; скрол при переповненні). */
export const TABLE_COLUMN_MIN_WIDTH = "9rem";
/** Верхня межа ширини колонки (truncate/вміщення). */
export const TABLE_COLUMN_MAX_WIDTH = "18rem";
/** Колонка «№». */
export const TABLE_INDEX_COLUMN_MIN_WIDTH = "3.5rem";
export const TABLE_INDEX_COLUMN_MAX_WIDTH = "4.5rem";


/** Динамічний фільтр: ключ = code (або code_from/code_to для діапазонів). */
export type ProductFilterState = Record<string, string>;

export type SortConfig = {
  key: ProductColumnId | null;
  dir: "asc" | "desc";
};

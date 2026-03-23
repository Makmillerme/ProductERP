/**
 * Налаштування відображення таблиці обліку товарів для категорії.
 * Зберігається в DisplayConfig.config як JSON.
 */

export type CategoryDisplayConfig = {
  /** Коди полів для пошуку. Якщо не вказано — string-поля з filterableFieldCodes. */
  searchableFieldCodes?: string[];
  /** Коди полів для фільтрації. Якщо не вказано — всі поля з картки. */
  filterableFieldCodes?: string[];
  /** Поле сортування за замовчуванням (code). */
  defaultSortKey?: string;
  /** Напрямок сортування за замовчуванням. */
  defaultSortDir?: "asc" | "desc";
  /** Колонки таблиці за замовчуванням: id + порядок. Перші елементи — видимі. */
  visibleColumnIds?: string[];
};

export const DEFAULT_DISPLAY_CONFIG: CategoryDisplayConfig = {};

export function parseDisplayConfig(json: string | null): CategoryDisplayConfig {
  if (!json?.trim()) return DEFAULT_DISPLAY_CONFIG;
  try {
    const obj = JSON.parse(json) as Record<string, unknown>;
    return {
      searchableFieldCodes:
        Array.isArray(obj.searchableFieldCodes) &&
        obj.searchableFieldCodes.every((x) => typeof x === "string")
          ? (obj.searchableFieldCodes as string[])
          : undefined,
      filterableFieldCodes:
        Array.isArray(obj.filterableFieldCodes) &&
        obj.filterableFieldCodes.every((x) => typeof x === "string")
          ? (obj.filterableFieldCodes as string[])
          : undefined,
      defaultSortKey:
        typeof obj.defaultSortKey === "string" && obj.defaultSortKey.trim()
          ? obj.defaultSortKey.trim()
          : undefined,
      defaultSortDir:
        obj.defaultSortDir === "asc" || obj.defaultSortDir === "desc"
          ? obj.defaultSortDir
          : undefined,
      visibleColumnIds:
        Array.isArray(obj.visibleColumnIds) &&
        obj.visibleColumnIds.every((x) => typeof x === "string")
          ? (obj.visibleColumnIds as string[])
          : undefined,
    };
  } catch {
    return DEFAULT_DISPLAY_CONFIG;
  }
}

export function stringifyDisplayConfig(config: CategoryDisplayConfig): string {
  return JSON.stringify(config, null, 2);
}

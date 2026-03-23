/**
 * Системний таб «Головна» — визначений у коді, завжди перший, не видаляється.
 * Запис у БД створюється при створенні категорії (transaction) та через seed.
 */

export const SYSTEM_TAB_CONFIG = {
  /** Ключ i18n для назви (productsConfig.tabsConfig.defaultTabName) */
  nameI18nKey: "productsConfig.tabsConfig.defaultTabName",
  /** Назва для збереження в БД (fallback, відображення через i18n) */
  dbName: "Головна",
  order: 0,
  isSystem: true,
} as const;

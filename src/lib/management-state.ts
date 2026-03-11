/**
 * Персистентний стан для розділу Управління.
 * Cache-first: зберігає вибір користувача, щоб при поверненні продовжити з того ж місця.
 */

const PREFIX = "management";

export const MANAGEMENT_STORAGE_KEYS = {
  /** Таб Модель даних: statuses | categories | data | card */
  dataModelTab: `${PREFIX}/data-model-tab`,
  /** Обрана категорія в табі «Картка товару» */
  cardCategoryId: `${PREFIX}/card-category-id`,
} as const;

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function getDataModelTab(): string | null {
  return getStorage()?.getItem(MANAGEMENT_STORAGE_KEYS.dataModelTab) ?? null;
}

export function setDataModelTab(tab: string): void {
  getStorage()?.setItem(MANAGEMENT_STORAGE_KEYS.dataModelTab, tab);
}

export function getCardCategoryId(): string | null {
  return getStorage()?.getItem(MANAGEMENT_STORAGE_KEYS.cardCategoryId) ?? null;
}

export function setCardCategoryId(categoryId: string): void {
  getStorage()?.setItem(MANAGEMENT_STORAGE_KEYS.cardCategoryId, categoryId);
}

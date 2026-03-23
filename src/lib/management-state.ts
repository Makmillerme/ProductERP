/**
 * Персистентний стан для розділу Управління.
 * Cache-first: зберігає вибір користувача, щоб при поверненні продовжити з того ж місця.
 */

const PREFIX = "management";

export const MANAGEMENT_STORAGE_KEYS = {
  /** Таб Модель даних: statuses | categories | data | card */
  dataModelTab: `${PREFIX}/data-model-tab`,
  /** Обрана категорія в табі «Відображення» */
  cardCategoryId: `${PREFIX}/card-category-id`,
  /** Метод відображення картки: table | kanban */
  cardViewMethod: `${PREFIX}/card-view-method`,
  /** Обраний тип товару в табі «Відображення» */
  cardProductTypeId: `${PREFIX}/card-product-type-id`,
  /** Обраний тип товару в табі «Поля та дані» (Модель даних) */
  dataModelProductTypeId: `${PREFIX}/data-model-product-type-id`,
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

export function getCardViewMethod(): "table" | "kanban" | null {
  const v = getStorage()?.getItem(MANAGEMENT_STORAGE_KEYS.cardViewMethod);
  return v === "table" || v === "kanban" ? v : null;
}

export function setCardViewMethod(method: "table" | "kanban"): void {
  getStorage()?.setItem(MANAGEMENT_STORAGE_KEYS.cardViewMethod, method);
}

export function getCardProductTypeId(): string | null {
  return getStorage()?.getItem(MANAGEMENT_STORAGE_KEYS.cardProductTypeId) ?? null;
}

export function setCardProductTypeId(productTypeId: string): void {
  const storage = getStorage();
  if (!storage) return;
  if (productTypeId) {
    storage.setItem(MANAGEMENT_STORAGE_KEYS.cardProductTypeId, productTypeId);
  } else {
    storage.removeItem(MANAGEMENT_STORAGE_KEYS.cardProductTypeId);
  }
}

export function getDataModelProductTypeId(): string | null {
  return getStorage()?.getItem(MANAGEMENT_STORAGE_KEYS.dataModelProductTypeId) ?? null;
}

export function setDataModelProductTypeId(productTypeId: string): void {
  const storage = getStorage();
  if (!storage) return;
  if (productTypeId) {
    storage.setItem(MANAGEMENT_STORAGE_KEYS.dataModelProductTypeId, productTypeId);
  } else {
    storage.removeItem(MANAGEMENT_STORAGE_KEYS.dataModelProductTypeId);
  }
}

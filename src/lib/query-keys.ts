/**
 * Фабрика ключів для TanStack Query.
 * Єдине місце для ключів серверного стану — легше інвалідація та типобезпека.
 */
export const queryKeys = {
  all: ["app"] as const,
  session: () => [...queryKeys.all, "session"] as const,
  products: () => [...queryKeys.all, "products"] as const,
  product: (id: string) => [...queryKeys.products(), id] as const,
  kanban: () => [...queryKeys.all, "kanban"] as const,
  settings: () => [...queryKeys.all, "settings"] as const,
  management: () => [...queryKeys.all, "management"] as const,
} as const;

/** Cache-first: дані управління вважаються свіжими 5 хв, менше мережевих запитів */
export const MANAGEMENT_STALE_MS = 5 * 60 * 1000;

/**
 * Префікси TanStack Query для `/api/admin/*` у Management.
 * Один джерело правди — узгоджено з invalidateQueries у фічах.
 */
export const managementAdminKeys = {
  categories: ["admin", "categories"] as const,
  productTypes: ["admin", "product-types"] as const,
  fieldDefinitions: ["admin", "field-definitions"] as const,
  statuses: ["admin", "statuses"] as const,
  roles: ["admin", "roles"] as const,
  users: ["admin", "users"] as const,
} as const;

/** Публічні ключі кешу Management (не під /api/admin). */
export const managementPublicKeys = {
  statuses: ["statuses"] as const,
} as const;

/** Ключі вкладок у конструкторі карток (invalidate за префіксом або повний key). */
export const managementTabKeys = {
  allTabDetails: ["admin", "tab-detail"] as const,
  allCategoryTabs: ["admin", "category-tabs"] as const,
  tabDetail: (tabId: string) => ["admin", "tab-detail", tabId] as const,
  categoryTabs: (categoryId: string) => ["admin", "category-tabs", categoryId] as const,
} as const;

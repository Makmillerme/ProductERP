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

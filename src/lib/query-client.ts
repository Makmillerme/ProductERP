import { QueryClient } from "@tanstack/react-query";

/**
 * Рекомендовані дефолти для проєкту (cache-first + persist):
 * - staleTime: 60s — дані вважаються свіжими, повторні запити беруться з кешу.
 * - gcTime: 24 год — для персистенції в localStorage (щоб кеш не видалявся до збереження).
 * - refetchOnWindowFocus: false — менше мережевих запитів при переключенні вкладок.
 * Після перезавантаження сторінки кеш відновлюється з localStorage — таблиця показує дані миттєво.
 */
const defaultOptions = {
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
} as const;

function makeQueryClient() {
  return new QueryClient(defaultOptions);
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

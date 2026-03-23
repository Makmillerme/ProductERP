/**
 * Query keys та cache-first хуки для products (TanStack Query).
 * Практики: стабільні ключі, setQueriesData після мутацій для миттєвого UI, інвалідація для refetch,
 * ...opts перед onSuccess щоб наш onSuccess не перезаписувався і викликав opts?.onSuccess.
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  type UseMutationOptions,
  type QueryClient,
} from "@tanstack/react-query";
import type { Product } from "./types";
import type { ProductFilterState, ProductColumnId } from "./types";
import type { ListProductsQuery, ListProductsResponse } from "./api";
import {
  fetchProducts,
  fetchProductById,
  createProduct as createProductApi,
  updateProduct as updateProductApi,
  deleteProduct as deleteProductApi,
} from "./api";

/** Фабрика ключів для products — один джерело правди для інвалідації. */
export const productsKeys = {
  all: ["products"] as const,
  lists: () => [...productsKeys.all, "list"] as const,
  list: (query: ListProductsQuery) => [...productsKeys.lists(), query] as const,
  details: () => [...productsKeys.all, "detail"] as const,
  detail: (id: number) => [...productsKeys.details(), id] as const,
};

/** Параметри списку для useProducts (з debounced search). */
export type ProductsQueryParams = {
  search: string;
  filter: ProductFilterState;
  sortKey: ProductColumnId | null;
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
  categoryId?: string | null;
  searchableFields?: string[];
};

function toListQuery(p: ProductsQueryParams): ListProductsQuery {
  return {
    search: p.search,
    filter: p.filter,
    sortKey: p.sortKey ?? undefined,
    sortDir: p.sortDir,
    page: p.page,
    pageSize: p.pageSize,
    categoryId: p.categoryId ?? undefined,
    searchableFields: p.searchableFields?.length ? p.searchableFields : undefined,
  };
}

/** Після мутацій викликати й await, щоб кеш (і персистенція) оновився. Повертає результат для логування помилок. */
export async function refetchProductsLists(
  queryClient: QueryClient
): Promise<{ success: boolean; error?: Error }> {
  try {
    await queryClient.refetchQueries({ queryKey: productsKeys.lists() });
    return { success: true };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    if (typeof console !== "undefined" && console.error) {
      console.error("[refetchProductsLists]", error);
    }
    return { success: false, error };
  }
}

/** Список товарів — cache-first: показує кеш одразу, refetch у фоні при stale. */
export function useProducts(params: ProductsQueryParams, options?: { enabled?: boolean }) {
  const query: ListProductsQuery = toListQuery(params);
  return useQuery({
    queryKey: productsKeys.list(query),
    queryFn: (): Promise<ListProductsResponse> => fetchProducts(query),
    enabled: options?.enabled !== false,
    placeholderData: keepPreviousData,
  });
}

/** Один товар по id — для sheet; кешується окремо. Медіа завантажуються лише тут (не в списку). */
export const PRODUCT_DETAIL_STALE_MS = 5 * 60 * 1000; // 5 хв — щоб не перезапитувати фото при повторному відкритті картки

export function useProduct(id: number | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: productsKeys.detail(id ?? 0),
    queryFn: () => fetchProductById(id!),
    enabled: id != null && id > 0 && (options?.enabled !== false),
    staleTime: PRODUCT_DETAIL_STALE_MS,
  });
}

/** Створення товару + оновлення кешу списків (додати на першу сторінку) + інвалідація. */
export function useCreateProduct(
  opts?: UseMutationOptions<Product, Error, Omit<Product, "id" | "created_at">>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProductApi,
    ...opts,
    onSuccess(data, variables, onMutateResult, context) {
      qc.setQueriesData<ListProductsResponse>(
        { queryKey: productsKeys.lists() },
        (old) =>
          old
            ? {
                ...old,
                items: [data, ...old.items],
                total: old.total + 1,
              }
            : old
      );
      qc.invalidateQueries({ queryKey: productsKeys.lists() });
      opts?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

/** Оновлення товару + оновлення кешу списків і деталей (оптимістично + інвалідація). */
export function useUpdateProduct(
  opts?: UseMutationOptions<Product, Error, { id: number; data: Partial<Omit<Product, "id">> }>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Product, "id">> }) =>
      updateProductApi(id, data),
    ...opts,
    onSuccess(data, variables, onMutateResult, context) {
      qc.invalidateQueries({ queryKey: productsKeys.detail(data.id) });
      qc.setQueriesData<ListProductsResponse>(
        { queryKey: productsKeys.lists() },
        (old) =>
          old
            ? {
                ...old,
                items: old.items.map((v) => (v.id === data.id ? data : v)),
              }
            : old
      );
      qc.invalidateQueries({ queryKey: productsKeys.lists() });
      opts?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

/** Видалення товару + прибрання з кешу списків і деталей (оптимістично + інвалідація). */
export function useDeleteProduct(opts?: UseMutationOptions<void, Error, number>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProductApi,
    ...opts,
    onSuccess(_data, id, onMutateResult, context) {
      qc.removeQueries({ queryKey: productsKeys.detail(id) });
      qc.setQueriesData<ListProductsResponse>(
        { queryKey: productsKeys.lists() },
        (old) =>
          old
            ? {
                ...old,
                items: old.items.filter((v) => v.id !== id),
                total: Math.max(0, old.total - 1),
              }
            : old
      );
      qc.invalidateQueries({ queryKey: productsKeys.lists() });
      opts?.onSuccess?.(undefined, id, onMutateResult, context);
    },
  });
}

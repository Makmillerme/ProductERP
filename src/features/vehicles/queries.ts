/**
 * Query keys та cache-first хуки для vehicles (TanStack Query).
 * Практики: стабільні ключі, setQueriesData після мутацій для миттєвого UI, інвалідація для refetch,
 * ...opts перед onSuccess щоб наш onSuccess не перезаписувався і викликав opts?.onSuccess.
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type QueryClient,
} from "@tanstack/react-query";
import type { Product } from "./types";
import type { ProductFilterState, ProductColumnId } from "./types";
import type { ListVehiclesQuery, ListVehiclesResponse } from "./api";
import {
  fetchVehicles,
  fetchVehicleById,
  createVehicle as createVehicleApi,
  updateVehicle as updateVehicleApi,
  deleteVehicle as deleteVehicleApi,
} from "./api";

/** Фабрика ключів для vehicles — один джерело правди для інвалідації. */
export const vehiclesKeys = {
  all: ["vehicles"] as const,
  lists: () => [...vehiclesKeys.all, "list"] as const,
  list: (query: ListVehiclesQuery) => [...vehiclesKeys.lists(), query] as const,
  details: () => [...vehiclesKeys.all, "detail"] as const,
  detail: (id: number) => [...vehiclesKeys.details(), id] as const,
};

/** Параметри списку для useVehicles (з debounced search). */
export type VehiclesQueryParams = {
  search: string;
  filter: ProductFilterState;
  sortKey: ProductColumnId | null;
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
  categoryId?: string | null;
};

function toListQuery(p: VehiclesQueryParams): ListVehiclesQuery {
  return {
    search: p.search,
    filter: p.filter,
    sortKey: p.sortKey ?? undefined,
    sortDir: p.sortDir,
    page: p.page,
    pageSize: p.pageSize,
    categoryId: p.categoryId ?? undefined,
  };
}

/** Після мутацій викликати й await, щоб кеш (і персистенція) оновився. Повертає результат для логування помилок. */
export async function refetchVehiclesLists(
  queryClient: QueryClient
): Promise<{ success: boolean; error?: Error }> {
  try {
    await queryClient.refetchQueries({ queryKey: vehiclesKeys.lists() });
    return { success: true };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    if (typeof console !== "undefined" && console.error) {
      console.error("[refetchVehiclesLists]", error);
    }
    return { success: false, error };
  }
}

/** Список авто — cache-first: показує кеш одразу, refetch у фоні при stale. */
export function useVehicles(params: VehiclesQueryParams, options?: { enabled?: boolean }) {
  const query: ListVehiclesQuery = toListQuery(params);
  return useQuery({
    queryKey: vehiclesKeys.list(query),
    queryFn: (): Promise<ListVehiclesResponse> => fetchVehicles(query),
    enabled: options?.enabled !== false,
  });
}

/** Один авто по id — для sheet; кешується окремо. Медіа завантажуються лише тут (не в списку). */
export const VEHICLE_DETAIL_STALE_MS = 5 * 60 * 1000; // 5 хв — щоб не перезапитувати фото при повторному відкритті картки

export function useVehicle(id: number | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: vehiclesKeys.detail(id ?? 0),
    queryFn: () => fetchVehicleById(id!),
    enabled: id != null && id > 0 && (options?.enabled !== false),
    staleTime: VEHICLE_DETAIL_STALE_MS,
  });
}

/** Створення товару + оновлення кешу списків (додати на першу сторінку) + інвалідація. */
export function useCreateVehicle(
  opts?: UseMutationOptions<Product, Error, Omit<Product, "id" | "created_at">>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createVehicleApi,
    ...opts,
    onSuccess(data, variables, onMutateResult, context) {
      qc.setQueriesData<ListVehiclesResponse>(
        { queryKey: vehiclesKeys.lists() },
        (old) =>
          old
            ? {
                ...old,
                items: [data, ...old.items],
                total: old.total + 1,
              }
            : old
      );
      qc.invalidateQueries({ queryKey: vehiclesKeys.lists() });
      opts?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

/** Оновлення товару + оновлення кешу списків і деталей (оптимістично + інвалідація). */
export function useUpdateVehicle(
  opts?: UseMutationOptions<Product, Error, { id: number; data: Partial<Omit<Product, "id">> }>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Product, "id">> }) =>
      updateVehicleApi(id, data),
    ...opts,
    onSuccess(data, variables, onMutateResult, context) {
      qc.invalidateQueries({ queryKey: vehiclesKeys.detail(data.id) });
      qc.setQueriesData<ListVehiclesResponse>(
        { queryKey: vehiclesKeys.lists() },
        (old) =>
          old
            ? {
                ...old,
                items: old.items.map((v) => (v.id === data.id ? data : v)),
              }
            : old
      );
      qc.invalidateQueries({ queryKey: vehiclesKeys.lists() });
      opts?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

/** Видалення авто + прибрання з кешу списків і деталей (оптимістично + інвалідація). */
export function useDeleteVehicle(opts?: UseMutationOptions<void, Error, number>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteVehicleApi,
    ...opts,
    onSuccess(_data, id, onMutateResult, context) {
      qc.removeQueries({ queryKey: vehiclesKeys.detail(id) });
      qc.setQueriesData<ListVehiclesResponse>(
        { queryKey: vehiclesKeys.lists() },
        (old) =>
          old
            ? {
                ...old,
                items: old.items.filter((v) => v.id !== id),
                total: Math.max(0, old.total - 1),
              }
            : old
      );
      qc.invalidateQueries({ queryKey: vehiclesKeys.lists() });
      opts?.onSuccess?.(undefined, id, onMutateResult, context);
    },
  });
}

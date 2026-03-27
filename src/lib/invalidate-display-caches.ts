import type { QueryClient } from "@tanstack/react-query";
import { productConfigQueryKeys } from "@/features/products/hooks/use-product-config";
import { listConfigQueryKeys } from "@/features/products/hooks/use-list-config";

/**
 * Після змін табів/полів дисплею для однієї категорії — інвалідує лише
 * list-config цієї категорії та product-config для типів товарів цієї категорії.
 */
export function invalidateCategoryDisplayCaches(
  qc: QueryClient,
  categoryId: string,
  productTypeIds: string[],
): void {
  void qc.invalidateQueries({ queryKey: listConfigQueryKeys.category(categoryId) });
  for (const id of productTypeIds) {
    void qc.invalidateQueries({ queryKey: productConfigQueryKeys.type(id) });
  }
}


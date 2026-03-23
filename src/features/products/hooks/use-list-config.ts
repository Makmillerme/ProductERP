"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/lib/locale-provider";
import type { ProductConfigResponse } from "./use-product-config";
import type { ProductColumnConfig, ProductColumnId } from "../types";
import { parseDisplayConfig } from "@/features/management/types/display-config";

type CategoryConfigResponse = ProductConfigResponse & {
  displayConfig?: string | null;
};

const listConfigKeys = {
  all: ["list-config"] as const,
  category: (categoryId: string) =>
    [...listConfigKeys.all, categoryId] as const,
};

async function fetchCategoryConfig(
  categoryId: string,
  t: (key: string) => string
): Promise<CategoryConfigResponse> {
  const res = await fetch(`/api/product-config/category/${categoryId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? t("common.loadCategoriesFailed")
    );
  }
  return res.json();
}

function getAlignForDataType(dataType: string): "left" | "right" | undefined {
  if (dataType === "integer" || dataType === "float") return "right";
  return undefined;
}

function getMinWidthForDataType(dataType: string): string | undefined {
  if (dataType === "integer" || dataType === "float") return "5rem";
  if (dataType === "date" || dataType === "datetime") return "8rem";
  return "7rem";
}

const NON_TABLE_WIDGET_TYPES = new Set<string>(["media_gallery", "file_upload"]);

function deriveTableColumnsFromTabs(
  tabs: ProductConfigResponse["tabs"]
): ProductColumnConfig[] {
  const seen = new Set<string>();
  const columns: ProductColumnConfig[] = [];

  for (const tab of tabs) {
    for (const f of tab.fields) {
      const fd = f.fieldDefinition;
      const wt = fd.widgetType ?? "";
      if (NON_TABLE_WIDGET_TYPES.has(wt)) continue;

      const id = (fd.code ?? fd.id) as ProductColumnId;
      if (!id || seen.has(id)) continue;
      seen.add(id);

      columns.push({
        id,
        label: fd.label ?? String(id),
        defaultVisible: true,
        align: getAlignForDataType(fd.dataType ?? "string"),
        minWidth: getMinWidthForDataType(fd.dataType ?? "string"),
        dataType: fd.dataType ?? "string",
      });
    }
  }

  return columns;
}

export type FilterableField = {
  code: string;
  label: string;
  dataType: string;
  /** Для integer/float — показувати два поля "від" і "до" */
  range?: boolean;
};

function deriveFilterableFieldsFromTabs(
  tabs: ProductConfigResponse["tabs"]
): FilterableField[] {
  const seen = new Set<string>();
  const result: FilterableField[] = [];

  for (const tab of tabs) {
    for (const f of tab.fields) {
      const fd = f.fieldDefinition;
      const wt = fd.widgetType ?? "";
      if (NON_TABLE_WIDGET_TYPES.has(wt)) continue;

      const code = fd.code ?? fd.id;
      if (!code || typeof code !== "string" || seen.has(code)) continue;
      seen.add(code);
      const dataType = fd.dataType ?? "string";
      result.push({
        code,
        label: fd.label ?? String(code),
        dataType,
        range: dataType === "integer" || dataType === "float",
      });
    }
  }

  return result;
}

export type ListConfig = {
  category: { id: string; name: string } | null;
  productType: { id: string; name: string } | null;
  tableColumns: ProductColumnConfig[];
  filterableFields: FilterableField[];
  searchableFieldCodes: string[];
  categoryName: string;
  /** Сортування за замовчуванням з display config. */
  defaultSort?: { key: string; dir: "asc" | "desc" };
};

export function useListConfig(categoryId: string | null) {
  const { t } = useLocale();
  const query = useQuery({
    queryKey: listConfigKeys.category(categoryId ?? ""),
    queryFn: () => fetchCategoryConfig(categoryId!, t),
    enabled: !!categoryId,
    staleTime: 30 * 1000,
  });

  const listConfig = useMemo((): ListConfig | null => {
    const data = query.data;
    if (!data) return null;

    const displayCfg = parseDisplayConfig(data.displayConfig ?? null);
    let tableColumns = deriveTableColumnsFromTabs(data.tabs);
    let filterableFields = deriveFilterableFieldsFromTabs(data.tabs);
    let searchableFieldCodes = filterableFields
      .filter((f) => f.dataType === "string")
      .map((f) => f.code);

    if (displayCfg.filterableFieldCodes?.length) {
      const allowedSet = new Set(displayCfg.filterableFieldCodes);
      filterableFields = filterableFields.filter((f) => allowedSet.has(f.code));
      searchableFieldCodes = filterableFields
        .filter((f) => f.dataType === "string")
        .map((f) => f.code);
    }
    if (displayCfg.searchableFieldCodes?.length) {
      searchableFieldCodes = displayCfg.searchableFieldCodes.filter((c) =>
        filterableFields.some((f) => f.code === c)
      );
    }

    if (displayCfg.visibleColumnIds?.length) {
      const orderSet = new Set(displayCfg.visibleColumnIds);
      const ordered = [...displayCfg.visibleColumnIds];
      const rest = tableColumns.filter((c) => !orderSet.has(c.id));
      tableColumns = [
        ...ordered
          .map((id) => tableColumns.find((c) => c.id === id))
          .filter(Boolean) as ProductColumnConfig[],
        ...rest,
      ].map((c) => ({
        ...c,
        defaultVisible: displayCfg.visibleColumnIds!.includes(c.id),
      }));
    }

    const defaultSort =
      displayCfg.defaultSortKey && displayCfg.defaultSortDir
        ? { key: displayCfg.defaultSortKey, dir: displayCfg.defaultSortDir }
        : undefined;

    return {
      category: data.category,
      productType: data.productType,
      tableColumns,
      filterableFields,
      searchableFieldCodes,
      categoryName: data.category?.name ?? t("products.categoryDefault"),
      defaultSort,
    };
  }, [query.data, t]);

  return {
    ...query,
    listConfig,
  };
}

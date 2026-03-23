"use client";

import { useQuery } from "@tanstack/react-query";

export type ProductConfigTab = {
  id: string;
  categoryId: string;
  name: string;
  icon: string | null;
  tabConfig: string | null;
  order: number;
  isSystem?: boolean;
  fields: ProductConfigTabField[];
};

export type ProductConfigTabField = {
  id: string;
  tabDefinitionId: string;
  fieldDefinitionId: string;
  productTypeId: string | null;
  order: number;
  colSpan: number;
  isRequired: boolean;
  sectionTitle: string | null;
  fieldDefinition: {
    id: string;
    code: string | null;
    label: string;
    dataType: string;
    widgetType: string;
    isSystem: boolean;
    systemColumn: string | null;
    presetValues: string | null;
    validation: string | null;
    unit: string | null;
    defaultValue: string | null;
    placeholder: string | null;
    hiddenOnCard?: boolean;
  };
};

export type ProductConfigResponse = {
  productType: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
  tabs: ProductConfigTab[];
  roleConfig: {
    visibleTabIds?: string[];
    visibleFieldIds?: string[];
    filterableFieldIds?: string[];
    searchableFieldIds?: string[];
    sortableFieldIds?: string[];
    tableColumnIds?: string[];
    defaultPageSize?: number;
  } | null;
};

const productConfigKeys = {
  all: ["product-config"] as const,
  type: (productTypeId: string) =>
    [...productConfigKeys.all, productTypeId] as const,
};

async function fetchProductConfig(
  productTypeId: string,
): Promise<ProductConfigResponse> {
  const res = await fetch(`/api/product-config/${productTypeId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? "Failed to load config",
    );
  }
  return res.json();
}

export function useProductConfig(productTypeId: string | null) {
  return useQuery({
    queryKey: productConfigKeys.type(productTypeId ?? ""),
    queryFn: () => fetchProductConfig(productTypeId!),
    enabled: !!productTypeId,
    staleTime: 5 * 60 * 1000,
  });
}

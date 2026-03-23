"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useLocale } from "@/lib/locale-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { useListConfig } from "@/features/products/hooks/use-list-config";
import { useProductConfig } from "@/features/products/hooks/use-product-config";
import { ProductDetailSheet } from "@/features/products/components/product-detail-sheet";
import {
  AddFieldDialog,
  type AddFieldItem,
} from "@/features/products/components/add-field-dialog";
import { isFieldAvailableForCategory } from "@/features/products/lib/field-utils";
import { FULL_ROW_WIDGETS } from "@/features/products/lib/grid-layout";
import { toast } from "sonner";
import { MANAGEMENT_STALE_MS } from "@/lib/query-keys";

type ProductTypeItem = { id: string; name: string; categoryId: string | null };
type FieldDefinitionItem = {
  id: string;
  code: string | null;
  label: string;
  dataType?: string;
  widgetType: string;
  presetValues?: string | null;
  validation?: string | null;
  unit?: string | null;
  defaultValue?: string | null;
  placeholder?: string | null;
  categoryIds?: string[];
  productTypeIds?: string[];
};

async function fetchProductTypes(t: (key: string) => string): Promise<ProductTypeItem[]> {
  const res = await fetch("/api/admin/product-types");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? t("common.loadTypesFailed"));
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.productTypes ?? data?.vehicleTypes ?? []);
}

async function fetchFieldDefinitions(): Promise<FieldDefinitionItem[]> {
  const res = await fetch("/api/admin/field-definitions?pageSize=500");
  if (!res.ok) return [];
  const data = await res.json();
  return data.fieldDefinitions ?? [];
}

const COLS_PER_ROW = 3;

async function fetchTabDetail(tabId: string, t: (key: string) => string) {
  const res = await fetch(`/api/admin/tabs/${tabId}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? t("productsConfig.tabsConfig.loadTabFailed"));
  }
  return res.json();
}

type ProductCardPreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string | null;
  viewMethod: "table" | "kanban";
};

export function ProductCardPreviewModal({
  open,
  onOpenChange,
  categoryId,
  viewMethod,
}: ProductCardPreviewModalProps) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [previewProductTypeId, setPreviewProductTypeId] = useState<string>("");
  const [addFieldDialogOpen, setAddFieldDialogOpen] = useState(false);
  const [activeTabIdForAdd, setActiveTabIdForAdd] = useState<string | null>(null);
  const [addFieldTarget, setAddFieldTarget] = useState<{ row: number; col: number } | null>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (open) setShouldRender(true);
    else if (shouldRender) {
      const id = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(id);
    }
  }, [open, shouldRender]);

  const { listConfig } = useListConfig(categoryId);
  const productTypeId = listConfig?.productType?.id ?? null;
  const { data: productConfig } = useProductConfig(
    open && productTypeId ? productTypeId : null
  );

  const { data: productTypes = [] } = useQuery({
    queryKey: ["admin", "product-types"],
    queryFn: () => fetchProductTypes(t),
    enabled: open && !!categoryId,
  });

  const typesForCategory = productTypes.filter((pt) => pt.categoryId === categoryId);

  const { data: allFields = [], isLoading: allFieldsLoading } = useQuery({
    queryKey: ["admin", "field-definitions"],
    queryFn: fetchFieldDefinitions,
    staleTime: MANAGEMENT_STALE_MS,
    enabled: addFieldDialogOpen,
  });

  const assignedFieldIds = useMemo(() => {
    const ids = new Set<string>();
    for (const tab of productConfig?.tabs ?? []) {
      for (const f of tab.fields ?? []) {
        ids.add(f.fieldDefinitionId);
      }
    }
    return ids;
  }, [productConfig?.tabs]);

  const groupedFields = useMemo(() => {
    if (!categoryId) return { currentCat: [], global: [], otherCats: [] };
    const unassigned = allFields.filter((f) => !assignedFieldIds.has(f.id));
    const isGlobal = (f: FieldDefinitionItem) =>
      !(f.categoryIds?.length) && !(f.productTypeIds?.length);
    const productTypeIdFilter = previewProductTypeId || null;
    const available = (f: FieldDefinitionItem) =>
      isFieldAvailableForCategory(f, categoryId, productTypeIdFilter, productTypes);
    return {
      currentCat: unassigned.filter((f) => !isGlobal(f) && available(f)),
      global: unassigned.filter(isGlobal),
      otherCats: [],
    };
  }, [allFields, assignedFieldIds, categoryId, productTypes, previewProductTypeId]);

  const addFieldMut = useMutation({
    mutationFn: async ({
      tabId,
      field,
      targetRow,
      targetCol,
    }: {
      tabId: string;
      field: AddFieldItem;
      targetRow?: number;
      targetCol?: number;
    }) => {
      const tabData = await fetchTabDetail(tabId, t);
      const existingFields = (tabData.fields ?? []) as {
        fieldDefinitionId: string;
        productTypeId: string | null;
        order: number;
        colSpan: number;
        isRequired: boolean;
        sectionTitle: string | null;
      }[];
      if (existingFields.some((f) => f.fieldDefinitionId === field.id)) {
        return tabData;
      }
      const maxOrder = existingFields.reduce(
        (max, f) => Math.max(max, f.order),
        -1
      );
      const isFullRow = FULL_ROW_WIDGETS.has(field.widgetType);
      const order =
        targetRow != null && targetCol != null
          ? targetRow * COLS_PER_ROW + targetCol
          : isFullRow
            ? (Math.floor(maxOrder / COLS_PER_ROW) + 1) * COLS_PER_ROW
            : maxOrder + 1;
      const newFields = [
        ...existingFields.map((f) => ({
          fieldDefinitionId: f.fieldDefinitionId,
          productTypeId: f.productTypeId,
          order: f.order,
          colSpan: f.colSpan,
          isRequired: f.isRequired,
          sectionTitle: f.sectionTitle,
        })),
        {
          fieldDefinitionId: field.id,
          productTypeId: null,
          order,
          colSpan: isFullRow ? 3 : 1,
          isRequired: false,
          sectionTitle: null,
        },
      ];
      const res = await fetch(`/api/admin/tabs/${tabId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: newFields }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? t("productsConfig.tabsConfig.addFieldToTabFailed"));
      }
      return res.json();
    },
    onMutate: async ({ tabId, field, targetRow, targetCol }) => {
      const ptId = listConfig?.productType?.id;
      if (!ptId) return;
      await queryClient.cancelQueries({ queryKey: ["product-config", ptId] });
      const prev = queryClient.getQueryData<{ tabs: { id: string; fields: { order: number }[] }[] }>([
        "product-config",
        ptId,
      ]);
      if (!prev?.tabs) return;
      const tab = prev.tabs.find((t) => t.id === tabId);
      const existingOrders = (tab?.fields ?? []).map((f) => f.order);
      const maxOrder = existingOrders.length > 0 ? Math.max(...existingOrders) : -1;
      const isFullRow = FULL_ROW_WIDGETS.has(field.widgetType);
      const order =
        targetRow != null && targetCol != null
          ? targetRow * COLS_PER_ROW + targetCol
          : isFullRow
            ? (Math.floor(maxOrder / COLS_PER_ROW) + 1) * COLS_PER_ROW
            : maxOrder + 1;
      const fullDef = allFields.find((f) => f.id === field.id);
      const newField = {
        id: `opt-${field.id}`,
        tabDefinitionId: tabId,
        fieldDefinitionId: field.id,
        productTypeId: null,
        order,
        colSpan: isFullRow ? 3 : 1,
        isRequired: false,
        sectionTitle: null,
        targetRow: targetRow ?? undefined,
        targetCol: targetCol ?? undefined,
        fieldDefinition: {
          id: field.id,
          code: field.code,
          label: field.label,
          dataType: fullDef?.dataType ?? "string",
          widgetType: field.widgetType,
          isSystem: false,
          systemColumn: null,
          presetValues: fullDef?.presetValues ?? null,
          validation: fullDef?.validation ?? null,
          unit: fullDef?.unit ?? null,
          defaultValue: fullDef?.defaultValue ?? null,
          placeholder: fullDef?.placeholder ?? null,
        },
      };
      queryClient.setQueryData(["product-config", ptId], {
        ...prev,
        tabs: prev.tabs.map((tab) =>
          tab.id === tabId
            ? { ...tab, fields: [...(tab.fields ?? []), newField] }
            : tab
        ),
      });
      return { prev, ptId };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.ptId && ctx?.prev) {
        queryClient.setQueryData(["product-config", ctx.ptId], ctx.prev);
      }
    },
    onSettled: () => {
      const ptId = listConfig?.productType?.id;
      if (ptId) queryClient.invalidateQueries({ queryKey: ["product-config", ptId] });
      if (categoryId) queryClient.invalidateQueries({ queryKey: ["list-config", categoryId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "tab-detail"] });
      if (categoryId) queryClient.invalidateQueries({ queryKey: ["admin", "category-tabs", categoryId] });
    },
  });

  const removeFieldMut = useMutation({
    mutationFn: async ({
      tabId,
      fieldDefinitionId,
    }: {
      tabId: string;
      fieldDefinitionId: string;
    }) => {
      const tabData = await fetchTabDetail(tabId, t);
      const existingFields = (tabData.fields ?? []) as {
        fieldDefinitionId: string;
        productTypeId: string | null;
        order: number;
        colSpan: number;
        isRequired: boolean;
        sectionTitle: string | null;
      }[];
      const newFields = existingFields
        .filter((f) => f.fieldDefinitionId !== fieldDefinitionId)
        .map((f) => ({
          fieldDefinitionId: f.fieldDefinitionId,
          productTypeId: f.productTypeId,
          order: f.order,
          colSpan: f.colSpan,
          isRequired: f.isRequired,
          sectionTitle: f.sectionTitle,
        }));
      const res = await fetch(`/api/admin/tabs/${tabId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: newFields }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? t("productsConfig.tabsConfig.removeFieldFromTabFailed"));
      }
      return res.json();
    },
    onMutate: async ({ tabId, fieldDefinitionId }) => {
      const ptId = listConfig?.productType?.id;
      if (!ptId) return;
      await queryClient.cancelQueries({ queryKey: ["product-config", ptId] });
      const prev = queryClient.getQueryData<{
        tabs: { id: string; fields: { fieldDefinitionId?: string }[] }[];
      }>(["product-config", ptId]);
      if (!prev?.tabs) return { prev: undefined, ptId: undefined };
      queryClient.setQueryData(["product-config", ptId], {
        ...prev,
        tabs: prev.tabs.map((tab) =>
          tab.id === tabId
            ? {
                ...tab,
                fields: (tab.fields ?? []).filter(
                  (f) => f.fieldDefinitionId !== fieldDefinitionId
                ),
              }
            : tab
        ),
      });
      return { prev, ptId };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.ptId && ctx?.prev) {
        queryClient.setQueryData(["product-config", ctx.ptId], ctx.prev);
      }
    },
    onSettled: () => {
      const ptId = listConfig?.productType?.id;
      if (ptId) queryClient.invalidateQueries({ queryKey: ["product-config", ptId] });
      if (categoryId) queryClient.invalidateQueries({ queryKey: ["list-config", categoryId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "tab-detail"] });
      if (categoryId) queryClient.invalidateQueries({ queryKey: ["admin", "category-tabs", categoryId] });
    },
  });

  const handleClickAddField = useCallback((tabId: string, row?: number, col?: number) => {
    setActiveTabIdForAdd(tabId);
    setAddFieldTarget(row != null && col != null ? { row, col } : null);
    setAddFieldDialogOpen(true);
  }, []);

  const handleRemoveField = useCallback(
    (tabId: string, fieldDefinitionId: string) => {
      removeFieldMut.mutate(
        { tabId, fieldDefinitionId },
        {
          onError: (err) =>
            toast.error(
              err instanceof Error ? err.message : t("errors.deleteFailed")
            ),
        }
      );
    },
    [removeFieldMut, t]
  );

  const handleSelectField = useCallback(
    (field: AddFieldItem) => {
      if (!activeTabIdForAdd) return;
      addFieldMut.mutate(
        { tabId: activeTabIdForAdd, field, targetRow: addFieldTarget?.row, targetCol: addFieldTarget?.col },
        {
          onError: (err) =>
            toast.error(
              err instanceof Error ? err.message : t("errors.saveFailed")
            ),
        }
      );
    },
    [activeTabIdForAdd, addFieldTarget, addFieldMut, t]
  );

  if (viewMethod !== "table") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("display.preview.title")}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              {t("display.preview.kanbanComingSoon")}
            </p>
          </DialogBody>
        </DialogContent>
      </Dialog>
    );
  }

  const effectiveProductTypeId =
    previewProductTypeId || listConfig?.productType?.id || null;

  if (!shouldRender) return null;

  return (
    <>
      <ProductDetailSheet
        product={null}
        open={open}
        onOpenChange={onOpenChange}
        productTypeId={effectiveProductTypeId}
        categoryLabel={listConfig?.categoryName}
        previewMode
        previewProductTypes={typesForCategory}
        previewProductTypeId={previewProductTypeId || null}
        onPreviewProductTypeChange={(id) => setPreviewProductTypeId(id)}
        onClickAddField={handleClickAddField}
        onRemoveField={handleRemoveField}
      />
      <AddFieldDialog
        open={addFieldDialogOpen}
        onOpenChange={(v) => {
          setAddFieldDialogOpen(v);
          if (!v) setAddFieldTarget(null);
        }}
        onSelectField={handleSelectField}
        groupedFields={groupedFields}
        loading={allFieldsLoading}
        disabled={addFieldMut.isPending}
        categoryName={listConfig?.categoryName}
      />
    </>
  );
}

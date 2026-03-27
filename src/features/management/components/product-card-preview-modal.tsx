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
import { ConfirmDestructiveDialog } from "@/components/confirm-destructive-dialog";
import {
  useListConfig,
  listConfigQueryKeys,
} from "@/features/products/hooks/use-list-config";
import {
  useProductConfig,
  productConfigQueryKeys,
  type ProductConfigTab,
} from "@/features/products/hooks/use-product-config";
import { ProductDetailSheet } from "@/features/products/components/product-detail-sheet";
import {
  AddFieldDialog,
  type AddFieldItem,
} from "@/features/products/components/add-field-dialog";
import { isFieldAvailableForCategory } from "@/features/products/lib/field-utils";
import { FULL_ROW_WIDGETS } from "@/features/products/lib/grid-layout";
import { toast } from "sonner";
import { MANAGEMENT_STALE_MS, managementAdminKeys, managementTabKeys } from "@/lib/query-keys";
import { fetchAdminProductTypes } from "@/lib/api/admin/catalog";
import { adminFetch, adminGetJson, adminMutationJson } from "@/lib/api/admin/client";

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
  return fetchAdminProductTypes(t) as Promise<ProductTypeItem[]>;
}

async function fetchFieldDefinitions(): Promise<FieldDefinitionItem[]> {
  const res = await adminFetch("/field-definitions?pageSize=500");
  if (!res.ok) return [];
  const data = await res.json();
  return data.fieldDefinitions ?? [];
}

const COLS_PER_ROW = 3;

type PreviewTabDetail = {
  fields?: {
    fieldDefinitionId: string;
    productTypeId: string | null;
    order: number;
    colSpan: number;
    isRequired: boolean;
    sectionTitle: string | null;
  }[];
};

async function fetchTabDetail(tabId: string, t: (key: string) => string): Promise<PreviewTabDetail> {
  return adminGetJson<PreviewTabDetail>(
    `/tabs/${tabId}`,
    t("productsConfig.tabsConfig.loadTabFailed")
  );
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
  const { t, tFormat } = useLocale();
  const queryClient = useQueryClient();
  const [previewProductTypeId, setPreviewProductTypeId] = useState<string>("");
  const [removeFieldPending, setRemoveFieldPending] = useState<{
    tabId: string;
    fieldDefinitionId: string;
    label: string;
  } | null>(null);
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
  /** Той самий резолв, що в ProductDetailSheet (прев'ю типу або перший тип категорії). */
  const resolvedProductTypeIdForConfig =
    previewProductTypeId || listConfig?.productType?.id || null;
  const previewConfigProductTypeId = open ? resolvedProductTypeIdForConfig : null;
  const { data: productConfig } = useProductConfig(previewConfigProductTypeId);

  const { data: productTypes = [] } = useQuery({
    queryKey: managementAdminKeys.productTypes,
    queryFn: () => fetchProductTypes(t),
    enabled: open && !!categoryId,
  });

  const typesForCategory = productTypes.filter((pt) => pt.categoryId === categoryId);

  const { data: allFields = [], isLoading: allFieldsLoading } = useQuery({
    queryKey: managementAdminKeys.fieldDefinitions,
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
    const available = (f: FieldDefinitionItem) =>
      isFieldAvailableForCategory(
        f,
        categoryId,
        resolvedProductTypeIdForConfig,
        productTypes
      );
    return {
      currentCat: unassigned.filter((f) => !isGlobal(f) && available(f)),
      global: unassigned.filter(isGlobal),
      otherCats: [],
    };
  }, [
    allFields,
    assignedFieldIds,
    categoryId,
    productTypes,
    resolvedProductTypeIdForConfig,
  ]);

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
        stretchInRow?: boolean;
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
          stretchInRow: f.stretchInRow ?? false,
        })),
        {
          fieldDefinitionId: field.id,
          productTypeId: null,
          order,
          colSpan: isFullRow ? 3 : 1,
          isRequired: false,
          sectionTitle: null,
          stretchInRow: false,
        },
      ];
      return adminMutationJson(`/tabs/${tabId}`, {
        method: "PATCH",
        body: { fields: newFields },
        fallbackError: t("productsConfig.tabsConfig.addFieldToTabFailed"),
      });
    },
    onMutate: async ({ tabId, field, targetRow, targetCol }) => {
      const ptId = resolvedProductTypeIdForConfig;
      if (!ptId) return;
      await queryClient.cancelQueries({ queryKey: productConfigQueryKeys.type(ptId) });
      const prev = queryClient.getQueryData<{ tabs: { id: string; fields: { order: number }[] }[] }>(
        productConfigQueryKeys.type(ptId)
      );
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
        stretchInRow: false,
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
      queryClient.setQueryData(productConfigQueryKeys.type(ptId), {
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
        queryClient.setQueryData(productConfigQueryKeys.type(ctx.ptId), ctx.prev);
      }
    },
    onSettled: (_d, _e, vars) => {
      const ptId = resolvedProductTypeIdForConfig;
      if (ptId) queryClient.invalidateQueries({ queryKey: productConfigQueryKeys.type(ptId) });
      if (categoryId) queryClient.invalidateQueries({
            queryKey: listConfigQueryKeys.category(categoryId),
          });
      queryClient.invalidateQueries({
        queryKey: managementTabKeys.tabDetail(vars.tabId),
      });
      if (categoryId) queryClient.invalidateQueries({ queryKey: managementTabKeys.categoryTabs(categoryId) });
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
        stretchInRow?: boolean;
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
          stretchInRow: f.stretchInRow ?? false,
        }));
      return adminMutationJson(`/tabs/${tabId}`, {
        method: "PATCH",
        body: { fields: newFields },
        fallbackError: t("productsConfig.tabsConfig.removeFieldFromTabFailed"),
      });
    },
    onMutate: async ({ tabId, fieldDefinitionId }) => {
      const ptId = resolvedProductTypeIdForConfig;
      if (!ptId) return;
      await queryClient.cancelQueries({ queryKey: productConfigQueryKeys.type(ptId) });
      const prev = queryClient.getQueryData<{
        tabs: { id: string; fields: { fieldDefinitionId?: string }[] }[];
      }>(productConfigQueryKeys.type(ptId));
      if (!prev?.tabs) return { prev: undefined, ptId: undefined };
      queryClient.setQueryData(productConfigQueryKeys.type(ptId), {
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
        queryClient.setQueryData(productConfigQueryKeys.type(ctx.ptId), ctx.prev);
      }
    },
    onSettled: (_d, _e, vars) => {
      const ptId = resolvedProductTypeIdForConfig;
      if (ptId) queryClient.invalidateQueries({ queryKey: productConfigQueryKeys.type(ptId) });
      if (categoryId) queryClient.invalidateQueries({
            queryKey: listConfigQueryKeys.category(categoryId),
          });
      queryClient.invalidateQueries({
        queryKey: managementTabKeys.tabDetail(vars.tabId),
      });
      if (categoryId) queryClient.invalidateQueries({ queryKey: managementTabKeys.categoryTabs(categoryId) });
    },
  });

  const handleClickAddField = useCallback((tabId: string, row?: number, col?: number) => {
    setActiveTabIdForAdd(tabId);
    setAddFieldTarget(row != null && col != null ? { row, col } : null);
    setAddFieldDialogOpen(true);
  }, []);

  const resolveFieldLabel = useCallback(
    (tabId: string, fieldDefinitionId: string) => {
      const tabs = productConfig?.tabs as ProductConfigTab[] | undefined;
      const tab = tabs?.find((x) => x.id === tabId);
      const fld = tab?.fields?.find((f) => f.fieldDefinitionId === fieldDefinitionId);
      return fld?.fieldDefinition?.label ?? fieldDefinitionId;
    },
    [productConfig?.tabs]
  );

  const handleRemoveField = useCallback(
    (tabId: string, fieldDefinitionId: string) => {
      setRemoveFieldPending({
        tabId,
        fieldDefinitionId,
        label: resolveFieldLabel(tabId, fieldDefinitionId),
      });
    },
    [resolveFieldLabel]
  );

  const handleConfirmRemoveField = useCallback(() => {
    if (!removeFieldPending) return;
    const { tabId, fieldDefinitionId } = removeFieldPending;
    removeFieldMut.mutate(
      { tabId, fieldDefinitionId },
      {
        onSuccess: () => setRemoveFieldPending(null),
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : t("errors.deleteFailed")
          ),
      }
    );
  }, [removeFieldPending, removeFieldMut, t]);

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

  if (!shouldRender) return null;

  return (
    <>
      <ProductDetailSheet
        product={null}
        open={open}
        onOpenChange={onOpenChange}
        productTypeId={resolvedProductTypeIdForConfig}
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
      <ConfirmDestructiveDialog
        open={removeFieldPending != null}
        onOpenChange={(open) => {
          if (!open) setRemoveFieldPending(null);
        }}
        title={t("productsConfig.tabsConfig.confirmRemoveFieldTitle")}
        description={
          removeFieldPending
            ? tFormat("productsConfig.tabsConfig.confirmRemoveFieldDescription", {
                label: removeFieldPending.label,
              })
            : undefined
        }
        cancelLabel={t("productsConfig.common.cancel")}
        confirmLabel={t("users.delete")}
        confirmPending={removeFieldMut.isPending}
        onConfirm={handleConfirmRemoveField}
      />
    </>
  );
}

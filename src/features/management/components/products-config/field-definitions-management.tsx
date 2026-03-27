"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { AlertDialogBody } from "@/components/ui/alert-dialog";
import { SHEET_CONTENT_CLASS, SHEET_INPUT_CLASS, SHEET_HEADER_CLASS, SHEET_BODY_CLASS, SHEET_BODY_SCROLL_CLASS, SHEET_FOOTER_CLASS, SHEET_FORM_GAP, SHEET_FORM_PADDING, SHEET_FIELD_GAP } from "@/config/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableCellText,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MgmtTableColGroup } from "@/components/mgmt-table-colgroup";
import {
  MGMT_COLGROUP_5_FIELD_DEFS,
  mgmtTableLayoutClass,
  mgmtTableHeaderRowClass,
  mgmtTableHeadClass,
  mgmtTableCellPrimaryClass,
  mgmtTableCellMutedSmClass,
  mgmtTableCellNumericClass,
} from "@/config/management-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDestructiveDialog } from "@/components/confirm-destructive-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MANAGEMENT_STALE_MS, managementAdminKeys, managementTabKeys } from "@/lib/query-keys";
import { productConfigQueryKeys } from "@/features/products/hooks/use-product-config";
import { listConfigQueryKeys } from "@/features/products/hooks/use-list-config";
import { slugify } from "@/lib/slugify";
import {
  WIDGET_TYPES,
  FIELD_TEMPLATES,
  VALIDATION_OPTIONS,
  WIDGETS_WITHOUT_VALIDATION,
  WIDGETS_WITH_PRESETS,
  WIDGETS_WITH_FORMULA,
  WIDGETS_WITH_PLACEHOLDER,
  WIDGETS_WITHOUT_DEFAULT_VALUE,
  BOOLEAN_PRESET_VALUES_JSON,
  FILE_SIZE_UNITS,
  bytesToFileSizeDisplay,
  fileSizeDisplayToBytes,
  getDefaultDataTypeForWidget,
  getDataTypesForWidget,
  buildValidationJson,
  parseValidationJson,
  type DataType,
  type WidgetType,
  type FileSizeUnit,
} from "@/config/field-constructor";
import {
  MEASUREMENT_CATEGORIES,
  findUnitInCategories,
  CUSTOM_UNIT_VALUE,
} from "@/config/measurement-units";
import {
  normalizeCompositePresetValues,
} from "@/config/composite-field";
import { CompositeSubFieldsEditor } from "./composite-subfields-editor";
import { DocumentFoldersEditor } from "./document-folders-editor";
import { OptionsEditor } from "./options-editor";
import { FormulaEditor } from "./formula-editor";
import { validatePresetValuesForWidget } from "@/lib/validate-preset-values";
import {
  optionsMatchDataType,
  parsePresetValues,
  parseOptionsWithLayout,
  stringifyOptionsWithLayout,
  validateFormula,
} from "@/features/products/lib/field-utils";
import { useLocale } from "@/lib/locale-provider";
import { fetchAdminCategories, fetchAdminProductTypes } from "@/lib/api/admin/catalog";
import { adminGetJson, adminMutationJson, adminDeleteAllowMissing } from "@/lib/api/admin/client";
import { invalidateCategoryDisplayCaches } from "@/lib/invalidate-display-caches";
import { TableWithPagination } from "@/components/table-with-pagination";
import { TablePaginationBar } from "@/components/table-pagination-bar";
import { ManagementListLoading, TableEmptyMessageRow } from "@/components/management-list-states";
import type { FieldDefinitionItem } from "./types";

async function fetchCategories(
  t: (key: string) => string
): Promise<{ id: string; name: string; order: number }[]> {
  return fetchAdminCategories(t) as Promise<{ id: string; name: string; order: number }[]>;
}

async function fetchProductTypes(
  t: (key: string) => string
): Promise<{ id: string; name: string; categoryId: string | null }[]> {
  return fetchAdminProductTypes(t) as Promise<
    { id: string; name: string; categoryId: string | null }[]
  >;
}

const PAGE_SIZES = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 20;

async function fetchFieldDefinitions(
  params: {
    search: string;
    page: number;
    pageSize: number;
    categoryId?: string;
    productTypeId?: string;
  },
  t: (key: string) => string
): Promise<{ fieldDefinitions: FieldDefinitionItem[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.categoryId) searchParams.set("categoryId", params.categoryId);
  if (params.productTypeId) searchParams.set("productTypeId", params.productTypeId);
  searchParams.set("page", String(params.page));
  searchParams.set("pageSize", String(params.pageSize));
  const data = await adminGetJson<{
    fieldDefinitions?: FieldDefinitionItem[];
    total?: number;
  }>(`/field-definitions?${searchParams.toString()}`, t("fieldDefinitions.loadFieldsFailed"));
  return {
    fieldDefinitions: data.fieldDefinitions ?? [],
    total: data.total ?? 0,
  };
}

async function createFieldDefinition(
  body: {
    code?: string | null;
    label: string;
    dataType: string;
    widgetType: string;
    systemColumn?: string | null;
    presetValues?: string | null;
    validation?: string | null;
    unit?: string | null;
    defaultValue?: string | null;
    placeholder?: string | null;
    hiddenOnCard?: boolean;
    categoryIds?: string[];
    productTypeIds?: string[];
  },
  t: (key: string) => string
) {
  return adminMutationJson("/field-definitions", {
    method: "POST",
    body,
    fallbackError: t("fieldDefinitions.createFieldFailed"),
  });
}

async function updateFieldDefinition(
  id: string,
  body: {
    label?: string;
    code?: string | null;
    dataType?: string;
    widgetType?: string;
    systemColumn?: string | null;
    presetValues?: string | null;
    validation?: string | null;
    unit?: string | null;
    defaultValue?: string | null;
    placeholder?: string | null;
    hiddenOnCard?: boolean;
    categoryIds?: string[];
    productTypeIds?: string[];
  },
  t: (key: string) => string
) {
  return adminMutationJson(`/field-definitions/${id}`, {
    method: "PATCH",
    body,
    fallbackError: t("fieldDefinitions.saveFieldFailed"),
  });
}

async function deleteFieldDefinition(id: string, t: (key: string) => string) {
  await adminDeleteAllowMissing(
    `/field-definitions/${id}`,
    t("fieldDefinitions.deleteFieldFailed")
  );
}

type FieldDefinitionDeleteUsageResponse = {
  usage: {
    tabPlacements: Array<{
      categoryName: string;
      tabName: string;
      productTypeName: string | null;
    }>;
    productValuesCount: number;
  };
};

async function fetchFieldDefinitionDeleteUsage(
  id: string,
  t: (key: string) => string
): Promise<FieldDefinitionDeleteUsageResponse> {
  return adminGetJson<FieldDefinitionDeleteUsageResponse>(
    `/field-definitions/${id}?usage=1`,
    t("fieldDefinitions.loadFieldsFailed")
  );
}

type FieldDefinitionsManagementProps = {
  categoryId?: string;
  productTypeId?: string;
  openCreateForCategoryId?: string | null;
  onClearCreateIntent?: () => void;
};

export function FieldDefinitionsManagement({
  categoryId,
  productTypeId,
  openCreateForCategoryId,
  onClearCreateIntent,
}: FieldDefinitionsManagementProps = {}) {
  const queryClient = useQueryClient();
  const { t, tFormat } = useLocale();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedField, setSelectedField] =
    useState<FieldDefinitionItem | null>(null);
  const [isCreate, setIsCreate] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageInputValue, setPageInputValue] = useState("1");

  const [label, setLabel] = useState("");
  const [code, setCode] = useState("");
  const [dataType, setDataType] = useState("string");
  const [widgetType, setWidgetType] = useState<WidgetType>("text_input");
  const [presetValues, setPresetValues] = useState("");
  const [validation, setValidation] = useState("");
  const [validationValues, setValidationValues] = useState<
    Record<string, string | number | boolean>
  >({});
  const [unit, setUnit] = useState("");
  const [unitCategory, setUnitCategory] = useState<string | null>(null);
  const [unitDimension, setUnitDimension] = useState<string | null>(null);
  const [placeholder, setPlaceholder] = useState("");
  const [defaultValue, setDefaultValue] = useState("");
  const [hiddenOnCard, setHiddenOnCard] = useState(false);
  const [fieldCategoryIds, setFieldCategoryIds] = useState<string[]>([]);
  const [fieldProductTypeIds, setFieldProductTypeIds] = useState<string[]>([]);
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataTypeChangeModal, setDataTypeChangeModal] = useState<{
    open: boolean;
    newDataType: string;
  }>({ open: false, newDataType: "" });
  const [fieldDeleteDialogOpen, setFieldDeleteDialogOpen] = useState(false);

  const listParams = useMemo(
    () => ({
      search: search.trim(),
      page,
      pageSize,
      categoryId: categoryId || undefined,
      productTypeId: productTypeId || undefined,
    }),
    [search, page, pageSize, categoryId, productTypeId]
  );

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [...managementAdminKeys.fieldDefinitions, listParams],
    queryFn: () => fetchFieldDefinitions(listParams, t),
    staleTime: MANAGEMENT_STALE_MS,
    placeholderData: keepPreviousData,
  });

  const fieldDefinitions = data?.fieldDefinitions ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const { data: categories = [] } = useQuery({
    queryKey: [...managementAdminKeys.categories],
    queryFn: () => fetchCategories(t),
    staleTime: MANAGEMENT_STALE_MS,
  });
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories]
  );

  const { data: allProductTypes = [] } = useQuery({
    queryKey: [...managementAdminKeys.productTypes],
    queryFn: () => fetchProductTypes(t),
    staleTime: MANAGEMENT_STALE_MS,
  });

  const productTypesByCategory = useMemo(() => {
    const map = new Map<string, { id: string; name: string }[]>();
    for (const vt of allProductTypes) {
      const catId = vt.categoryId ?? "__uncategorized__";
      if (!map.has(catId)) map.set(catId, []);
      map.get(catId)!.push({ id: vt.id, name: vt.name });
    }
    return map;
  }, [allProductTypes]);

  useEffect(() => {
    setPageInputValue(String(page));
  }, [page]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSearch(searchInput.trim());
      setPage(1);
    },
    [searchInput]
  );

  const handlePageInputBlur = useCallback(() => {
    const n = parseInt(pageInputValue, 10);
    const clamped = Number.isNaN(n) ? page : Math.max(1, Math.min(totalPages, n));
    setPage(clamped);
    setPageInputValue(String(clamped));
  }, [pageInputValue, totalPages, page]);

  const handlePageInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handlePageInputBlur();
    },
    [handlePageInputBlur]
  );

  const goToPage = useCallback(
    (p: number) => {
      const clamped = Math.max(1, Math.min(totalPages, p));
      setPage(clamped);
    },
    [totalPages]
  );

  const applyFieldScopeToDisplayCaches = useCallback(
    (categoryIds: string[], productTypeIds: string[]) => {
      const hasScope = categoryIds.length > 0 || productTypeIds.length > 0;
      if (!hasScope) {
        void queryClient.invalidateQueries({ queryKey: productConfigQueryKeys.all });
        void queryClient.invalidateQueries({ queryKey: listConfigQueryKeys.all });
        void queryClient.invalidateQueries({ queryKey: managementTabKeys.allTabDetails });
        void queryClient.invalidateQueries({ queryKey: managementTabKeys.allCategoryTabs });
        return;
      }

      const byCat = new Map<string, Set<string>>();
      const ensureCat = (catId: string) => {
        if (!byCat.has(catId)) byCat.set(catId, new Set());
        return byCat.get(catId)!;
      };

      for (const catId of categoryIds) {
        const typesInCat = allProductTypes.filter((pt) => pt.categoryId === catId);
        const picked =
          productTypeIds.length === 0
            ? typesInCat.map((pt) => pt.id)
            : typesInCat
                .filter((pt) => productTypeIds.includes(pt.id))
                .map((pt) => pt.id);
        if (picked.length === 0) {
          invalidateCategoryDisplayCaches(queryClient, catId, []);
        } else {
          const set = ensureCat(catId);
          for (const tid of picked) set.add(tid);
        }
      }

      for (const ptId of productTypeIds) {
        const pt = allProductTypes.find((x) => x.id === ptId);
        if (pt?.categoryId) ensureCat(pt.categoryId).add(ptId);
      }

      for (const [catId, typeSet] of byCat) {
        invalidateCategoryDisplayCaches(queryClient, catId, [...typeSet]);
        void queryClient.invalidateQueries({
          queryKey: managementTabKeys.categoryTabs(catId),
        });
      }
    },
    [queryClient, allProductTypes]
  );

  const createMut = useMutation({
    mutationFn: (body: Parameters<typeof createFieldDefinition>[0]) =>
      createFieldDefinition(body, t),
    onSuccess: (_created, body) => {
      void queryClient.invalidateQueries({ queryKey: managementAdminKeys.fieldDefinitions });
      applyFieldScopeToDisplayCaches(body.categoryIds ?? [], body.productTypeIds ?? []);
      toast.success(t("toasts.fieldCreated"));
    },
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof updateFieldDefinition>[1];
      prevCategoryIds: string[];
      prevProductTypeIds: string[];
    }) => updateFieldDefinition(id, body, t),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: managementAdminKeys.fieldDefinitions });
      const key = [...managementAdminKeys.fieldDefinitions, listParams] as const;
      const prev = queryClient.getQueryData<{
        fieldDefinitions: FieldDefinitionItem[];
        total: number;
      }>(key);
      if (!prev) return { prev: undefined, key };
      const { id, body } = variables;
      const next = prev.fieldDefinitions.map((f) =>
        f.id === id
          ? {
              ...f,
              ...(body.label !== undefined && { label: body.label }),
              ...(body.code !== undefined && { code: body.code }),
              ...(body.dataType !== undefined && { dataType: body.dataType }),
              ...(body.widgetType !== undefined && { widgetType: body.widgetType }),
              ...(body.systemColumn !== undefined && { systemColumn: body.systemColumn }),
              ...(body.presetValues !== undefined && { presetValues: body.presetValues }),
              ...(body.validation !== undefined && { validation: body.validation }),
              ...(body.unit !== undefined && { unit: body.unit }),
              ...(body.defaultValue !== undefined && { defaultValue: body.defaultValue }),
              ...(body.placeholder !== undefined && { placeholder: body.placeholder }),
              ...(body.hiddenOnCard !== undefined && { hiddenOnCard: body.hiddenOnCard }),
              ...(body.categoryIds !== undefined && { categoryIds: body.categoryIds }),
              ...(body.productTypeIds !== undefined && { productTypeIds: body.productTypeIds }),
            }
          : f
      );
      queryClient.setQueryData(key, { ...prev, fieldDefinitions: next });
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev != null && ctx.key) queryClient.setQueryData(ctx.key, ctx.prev);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: managementAdminKeys.fieldDefinitions });
      const { body, prevCategoryIds, prevProductTypeIds } = variables;
      const cats = new Set([...prevCategoryIds, ...(body.categoryIds ?? [])]);
      const types = new Set([...prevProductTypeIds, ...(body.productTypeIds ?? [])]);
      applyFieldScopeToDisplayCaches([...cats], [...types]);
      toast.success(t("toasts.fieldSaved"));
    },
  });

  const deleteMut = useMutation({
    mutationFn: (vars: {
      id: string;
      categoryIds: string[];
      productTypeIds: string[];
    }) => deleteFieldDefinition(vars.id, t),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: managementAdminKeys.fieldDefinitions });
      const key = [...managementAdminKeys.fieldDefinitions, listParams] as const;
      const prev = queryClient.getQueryData<{
        fieldDefinitions: FieldDefinitionItem[];
        total: number;
      }>(key);
      if (!prev) return { prev: undefined, key };
      queryClient.setQueryData(key, {
        fieldDefinitions: prev.fieldDefinitions.filter((f) => f.id !== vars.id),
        total: Math.max(0, prev.total - 1),
      });
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev != null && ctx.key) queryClient.setQueryData(ctx.key, ctx.prev);
    },
    onSuccess: (_void, vars) => {
      void queryClient.invalidateQueries({ queryKey: managementAdminKeys.fieldDefinitions });
      applyFieldScopeToDisplayCaches(vars.categoryIds, vars.productTypeIds);
      toast.success(t("toasts.fieldDeleted"));
    },
  });

  const resetForm = (initialCategoryIds?: string[], initialProductTypeIds?: string[]) => {
    setLabel("");
    setCode("");
    setDataType("string");
    setWidgetType("text_input");
    setPresetValues("");
    setValidation("");
    setValidationValues({});
    setUnit("");
    setUnitCategory(null);
    setUnitDimension(null);
    setPlaceholder("");
    setDefaultValue("");
    setHiddenOnCard(false);
    setFieldCategoryIds(initialCategoryIds ?? (categoryId ? [categoryId] : []));
    setFieldProductTypeIds(initialProductTypeIds ?? (productTypeId ? [productTypeId] : []));
    setCodeManuallyEdited(false);
  };

  const openForCreate = (initialCategoryId?: string | null, initialProductTypeId?: string | null) => {
    setSelectedField(null);
    setIsCreate(true);
    const catIds = initialCategoryId ? [initialCategoryId] : (categoryId ? [categoryId] : []);
    const typeIds = initialProductTypeId ? [initialProductTypeId] : (productTypeId ? [productTypeId] : []);
    resetForm(catIds, typeIds);
    setSheetOpen(true);
  };

  useEffect(() => {
    if (!openCreateForCategoryId) return;
    setSelectedField(null);
    setIsCreate(true);
    resetForm([openCreateForCategoryId], []);
    setSheetOpen(true);
    onClearCreateIntent?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- resetForm is stable in effect intent
  }, [openCreateForCategoryId]);

  const openForEdit = (fd: FieldDefinitionItem) => {
    setSelectedField(fd);
    setIsCreate(false);
    setLabel(fd.label);
    setCode(fd.code ?? "");
    setDataType(fd.dataType);
    setWidgetType(fd.widgetType as WidgetType);
    setPresetValues(fd.presetValues ?? "");
    setValidation(fd.validation ?? "");
    setValidationValues(parseValidationJson(fd.validation));
    setHiddenOnCard(fd.hiddenOnCard ?? false);
    setFieldCategoryIds(fd.categoryIds ?? []);
    setFieldProductTypeIds(fd.productTypeIds ?? []);
    const unitVal = fd.unit ?? "";
    setUnit(unitVal);
    const { categoryId, dimensionValue } = findUnitInCategories(unitVal);
    setUnitCategory(categoryId);
    setUnitDimension(dimensionValue);
    setPlaceholder(fd.placeholder ?? "");
    setDefaultValue(fd.defaultValue ?? "");
    setCodeManuallyEdited(true);
    setSheetOpen(true);
  };

  const openFromTemplate = (tmpl: (typeof FIELD_TEMPLATES)[number]) => {
    setSelectedField(null);
    setIsCreate(true);
    setLabel(t(tmpl.labelKey));
    setCode("");
    setCodeManuallyEdited(false);
    setWidgetType(tmpl.widgetType);
    setDataType(tmpl.dataType ?? "string");
    setPresetValues("");
    setValidation("");
    setValidationValues({});
    setUnit("");
    setUnitCategory(null);
    setUnitDimension(null);
    setPlaceholder("");
    setDefaultValue("");
    setFieldCategoryIds(categoryId ? [categoryId] : []);
    setFieldProductTypeIds(productTypeId ? [productTypeId] : []);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setSelectedField(null);
    setIsCreate(false);
  };

  useEffect(() => {
    if (isCreate && !codeManuallyEdited) {
      setCode(slugify(label));
    }
  }, [label, isCreate, codeManuallyEdited]);

  useEffect(() => {
    const defaultType = getDefaultDataTypeForWidget(widgetType);
    if (defaultType) {
      const allowed = getDataTypesForWidget(widgetType);
      setDataType((prev) =>
        allowed.includes(prev as DataType) ? prev : defaultType
      );
    }
  }, [widgetType]);

  const applyDataTypeChange = useCallback((newDataType: string) => {
    setDataType(newDataType);
    if (newDataType !== "integer" && newDataType !== "float") {
      setUnit("");
      setUnitCategory(null);
      setUnitDimension(null);
    }
  }, []);

  const handleDataTypeChange = useCallback(
    (newDataType: string) => {
      if (newDataType === dataType) return;

      const hasPresets = WIDGETS_WITH_PRESETS.includes(widgetType);
      const hasBooleanImplicitOptions = dataType === "boolean" || newDataType === "boolean";
      const hasExplicitOptions =
        presetValues.trim() && parsePresetValues(presetValues).length > 0;
      const hasOptions =
        hasPresets && (hasBooleanImplicitOptions || hasExplicitOptions);

      if (!hasOptions) {
        applyDataTypeChange(newDataType);
        return;
      }

      if (hasBooleanImplicitOptions) {
        setDataTypeChangeModal({ open: true, newDataType });
        return;
      }

      if (!optionsMatchDataType(presetValues, newDataType)) {
        toast.error(
          t("fieldDefinitions.cannotChangeDataType")
        );
        return;
      }

      applyDataTypeChange(newDataType);
    },
    [dataType, presetValues, widgetType, applyDataTypeChange, t]
  );

  const needsPresetValues = WIDGETS_WITH_PRESETS.includes(widgetType);

  const confirmDataTypeChange = useCallback(() => {
    if (dataTypeChangeModal.open) {
      applyDataTypeChange(dataTypeChangeModal.newDataType);
      setPresetValues("");
      setDataTypeChangeModal({ open: false, newDataType: "" });
    }
  }, [dataTypeChangeModal, applyDataTypeChange]);

  const showFieldDeleteButton =
    !isCreate && selectedField != null && !selectedField.isSystem;

  const fieldIdForDeleteUsage = fieldDeleteDialogOpen
    ? selectedField?.id
    : undefined;
  const { data: fieldDeleteUsage, isFetching: fieldDeleteUsageLoading } =
    useQuery({
      queryKey: [...managementAdminKeys.fieldDefinitions, "delete-usage", fieldIdForDeleteUsage],
      queryFn: () =>
        fetchFieldDefinitionDeleteUsage(fieldIdForDeleteUsage!, t),
      enabled: Boolean(fieldIdForDeleteUsage),
    });

  const needsFormula = WIDGETS_WITH_FORMULA.includes(widgetType);
  const needsValidation = !WIDGETS_WITHOUT_VALIDATION.includes(widgetType);
  const dataTypeOptions = getDataTypesForWidget(widgetType);
  const needsDataType = dataTypeOptions.length > 0;

  const handleSave = async () => {
    const trimmedLabel = label.trim();
    const trimmedCode = code.trim();

    if (!trimmedLabel) {
      toast.error(t("validationRequired.fieldName"));
      return;
    }

    let effectivePresetValues: string | null = null;
    if (needsPresetValues) {
      if (widgetType === "composite" && presetValues.trim()) {
        effectivePresetValues = normalizeCompositePresetValues(
          presetValues.trim(),
          BOOLEAN_PRESET_VALUES_JSON
        );
      } else if (dataType === "boolean") {
        effectivePresetValues = BOOLEAN_PRESET_VALUES_JSON;
      } else if (presetValues.trim()) {
        effectivePresetValues = presetValues.trim();
      }
    }

    if (effectivePresetValues) {
      const presetError = validatePresetValuesForWidget(effectivePresetValues, widgetType);
      if (presetError) {
        toast.error(presetError);
        return;
      }
    }

    if (needsFormula && validation.trim()) {
      const formulaError = validateFormula(validation.trim());
      if (formulaError) {
        toast.error(formulaError);
        return;
      }
    }

    setSaving(true);
    try {
      if (isCreate) {
        await createMut.mutateAsync({
          label: trimmedLabel,
          code: trimmedCode || undefined,
          dataType,
          widgetType,
          systemColumn: null,
          presetValues: needsPresetValues ? effectivePresetValues : null,
          validation: needsFormula
            ? validation.trim() || null
            : buildValidationJson(dataType as DataType, validationValues as Record<string, string | number | boolean>) ?? null,
          unit: (dataType === "integer" || dataType === "float") ? (unit.trim() || null) : null,
          defaultValue: WIDGETS_WITHOUT_DEFAULT_VALUE.includes(widgetType) ? null : (defaultValue.trim() || null),
          placeholder: WIDGETS_WITH_PLACEHOLDER.includes(widgetType) ? (placeholder.trim() || null) : null,
          hiddenOnCard: ["number_input", "calculated"].includes(widgetType) ? hiddenOnCard : false,
          categoryIds: fieldCategoryIds,
          productTypeIds: fieldProductTypeIds,
        });
      } else if (selectedField) {
        const body: Parameters<typeof updateFieldDefinition>[1] = {
          label: trimmedLabel,
          code: trimmedCode || null,
          dataType,
          widgetType,
          systemColumn: null,
          presetValues: needsPresetValues ? effectivePresetValues : null,
          validation: needsFormula
            ? validation.trim() || null
            : buildValidationJson(dataType as DataType, validationValues as Record<string, string | number | boolean>) ?? null,
          defaultValue: WIDGETS_WITHOUT_DEFAULT_VALUE.includes(widgetType) ? null : (defaultValue.trim() || null),
          placeholder: WIDGETS_WITH_PLACEHOLDER.includes(widgetType) ? (placeholder.trim() || null) : null,
          unit: (dataType === "integer" || dataType === "float") ? (unit.trim() || null) : null,
          hiddenOnCard: ["number_input", "calculated"].includes(widgetType) ? hiddenOnCard : false,
          categoryIds: fieldCategoryIds,
          productTypeIds: fieldProductTypeIds,
        };
        await updateMut.mutateAsync({
          id: selectedField.id,
          body,
          prevCategoryIds: selectedField.categoryIds ?? [],
          prevProductTypeIds: selectedField.productTypeIds ?? [],
        });
      }
      closeSheet();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteField = async () => {
    if (!selectedField || deleteMut.isPending) return;
    try {
      await deleteMut.mutateAsync({
        id: selectedField.id,
        categoryIds: selectedField.categoryIds ?? [],
        productTypeIds: selectedField.productTypeIds ?? [],
      });
      setFieldDeleteDialogOpen(false);
      closeSheet();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("errors.deleteFailed")
      );
    }
  };

  const isEmpty = fieldDefinitions.length === 0;
  const emptyMessage =
    total === 0 && !search.trim()
      ? t("fieldDefinitions.emptyCreate")
      : t("common.emptySearch");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("fieldDefinitions.widgetsLabel")}</span>
        {FIELD_TEMPLATES.map((tmpl) => (
          <Button
            key={tmpl.id}
            variant="outline"
            size="sm"
            onClick={() => openFromTemplate(tmpl)}
            className="h-8 text-xs"
          >
            {t(tmpl.labelKey)}
          </Button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        <form
          onSubmit={handleSearchSubmit}
          className="relative min-w-0 flex-1 max-w-sm"
        >
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t("fieldDefinitions.searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 pl-9 bg-background"
          />
        </form>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("fieldDefinitions.addField")}
          onClick={() => openForCreate(categoryId || null, productTypeId || null)}
          className="shrink-0 size-9"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : t("fieldDefinitions.loadFieldsFailed")}
        </p>
      )}

      {isLoading && !fieldDefinitions.length ? (
        <ManagementListLoading />
      ) : (
        <TableWithPagination
          pagination={
            <TablePaginationBar
              page={page}
              totalPages={totalPages}
              pageInputValue={pageInputValue}
              onPageInputChange={setPageInputValue}
              onPageInputBlur={handlePageInputBlur}
              onPageInputKeyDown={handlePageInputKeyDown}
              goToPage={goToPage}
              pageSize={pageSize}
              pageSizes={PAGE_SIZES}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          }
        >
          <Table className={mgmtTableLayoutClass}>
            <MgmtTableColGroup widths={MGMT_COLGROUP_5_FIELD_DEFS} />
            <TableHeader>
              <TableRow className={mgmtTableHeaderRowClass}>
                <TableHead className={mgmtTableHeadClass}>
                  {t("fieldDefinitions.name")}
                </TableHead>
                <TableHead className={`${mgmtTableHeadClass} hidden sm:table-cell`}>
                  {t("fieldDefinitions.code")}
                </TableHead>
                <TableHead className={mgmtTableHeadClass}>
                  {t("fieldDefinitions.dataType")}
                </TableHead>
                <TableHead className={mgmtTableHeadClass}>
                  {t("fieldDefinitions.display")}
                </TableHead>
                <TableHead className={mgmtTableHeadClass}>
                  {t("fieldDefinitions.usagesCount")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isEmpty ? (
                <TableEmptyMessageRow colSpan={5}>{emptyMessage}</TableEmptyMessageRow>
              ) : (
                fieldDefinitions.map((fd) => (
                  <TableRow
                    key={fd.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openForEdit(fd)}
                  >
                    <TableCell className={mgmtTableCellPrimaryClass} title={fd.label}>
                      <TableCellText>{fd.label}</TableCellText>
                    </TableCell>
                    <TableCell className={`${mgmtTableCellMutedSmClass} hidden sm:table-cell`} title={fd.code ?? undefined}>
                      <TableCellText>{fd.code ?? "—"}</TableCellText>
                    </TableCell>
                    <TableCell className={mgmtTableCellMutedSmClass}>
                      <TableCellText>
                        {fd.widgetType === "composite" ? "—" : (t(`dataTypes.${fd.dataType}`) ?? fd.dataType)}
                      </TableCellText>
                    </TableCell>
                    <TableCell className={mgmtTableCellMutedSmClass}>
                      <TableCellText>
                        {t(`widgetTypesShort.${fd.widgetType}`) || t(`widgetTypes.${fd.widgetType}`) || fd.widgetType}
                      </TableCellText>
                    </TableCell>
                    <TableCell className={mgmtTableCellNumericClass}>
                      <TableCellText className="tabular-nums">{fd._count?.tabFields ?? 0}</TableCellText>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableWithPagination>
      )}

      <Sheet open={sheetOpen} onOpenChange={(open) => !open && closeSheet()}>
        <SheetContent
          side="right"
          className={SHEET_CONTENT_CLASS}
          aria-describedby={undefined}
        >
          <SheetHeader className={SHEET_HEADER_CLASS}>
            <SheetTitle className="text-base font-semibold sm:text-lg">
              {isCreate
                ? t("fieldDefinitions.newField")
                : (selectedField?.label ?? t("fieldDefinitions.fieldLabel"))}
            </SheetTitle>
          </SheetHeader>

          <div className={SHEET_BODY_CLASS}>
            <div className={SHEET_BODY_SCROLL_CLASS}>
              <div className={cn("grid", SHEET_FORM_GAP, SHEET_FORM_PADDING)}>
                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="fd-label">{t("fieldDefinitions.name")}</Label>
                  <Input
                    id="fd-label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder={t("fieldDefinitions.labelPlaceholder")}
                    disabled={saving}
                    className={SHEET_INPUT_CLASS}
                  />
                </div>

                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="fd-code">{t("fieldDefinitions.codeOptional")}</Label>
                  <Input
                    id="fd-code"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (isCreate) setCodeManuallyEdited(true);
                    }}
                    placeholder={t("fieldDefinitions.codePlaceholder")}
                    disabled={saving}
                    className={SHEET_INPUT_CLASS}
                  />
                  {isCreate && (
                    <p className="text-xs text-muted-foreground">
                      {t("fieldDefinitions.codeAutoHint")}
                    </p>
                  )}
                </div>

                <div className={cn("grid gap-3", needsDataType && "grid-cols-2")}>
                  <div className="grid gap-2">
                    <Label htmlFor="fd-widget-type">{t("fieldDefinitions.display")}</Label>
                    <Select
                      value={widgetType}
                      onValueChange={(v) => setWidgetType(v as WidgetType)}
                      disabled={saving}
                    >
                      <SelectTrigger id="fd-widget-type" className={SHEET_INPUT_CLASS}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WIDGET_TYPES.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {t(opt.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {needsDataType && (
                    <div className="grid gap-2">
                      <Label htmlFor="fd-data-type">{t("fieldDefinitions.dataType")}</Label>
                      <Select
                        value={dataType}
                        onValueChange={handleDataTypeChange}
                        disabled={saving}
                      >
                        <SelectTrigger id="fd-data-type" className={SHEET_INPUT_CLASS}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dataTypeOptions.map((dt) => (
                            <SelectItem key={dt} value={dt}>
                              {t(`dataTypes.${dt}`) ?? dt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {needsPresetValues && (
                  <div className={cn("grid", SHEET_FIELD_GAP)}>
                    {widgetType === "composite" ? (
                      <div className={cn("grid", SHEET_FIELD_GAP)}>
                        <Label>{t("fieldDefinitions.compositeSubfields")}</Label>
                        <CompositeSubFieldsEditor
                          value={presetValues}
                          onChange={setPresetValues}
                          disabled={saving}
                        />
                      </div>
                    ) : widgetType === "file_upload" ? (
                      <DocumentFoldersEditor
                        value={presetValues}
                        onChange={setPresetValues}
                        disabled={saving}
                      />
                    ) : dataType === "boolean" ? (
                      <div className={cn("grid", SHEET_FIELD_GAP)}>
                        <Label>{t("fieldSettings.options")}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t("composite.booleanFixedOptions")}
                        </p>
                      </div>
                    ) : (widgetType === "radio" || widgetType === "multiselect") ? (
                      <div className={cn("grid", SHEET_FORM_GAP)}>
                        <div className={cn("grid", SHEET_FIELD_GAP)}>
                          <Label htmlFor="fd-layout">{t("composite.layout")}</Label>
                          <Select
                            value={parseOptionsWithLayout(presetValues || null).layout}
                            onValueChange={(v) =>
                              setPresetValues(
                                stringifyOptionsWithLayout(
                                  v as "row" | "column",
                                  parseOptionsWithLayout(presetValues || null).options
                                )
                              )
                            }
                            disabled={saving}
                          >
                            <SelectTrigger id="fd-layout" className={SHEET_INPUT_CLASS}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="row">{t("composite.layoutRow")}</SelectItem>
                              <SelectItem value="column">{t("composite.layoutColumn")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className={cn("grid", SHEET_FIELD_GAP)}>
                          <Label htmlFor="fd-presets">{t("fieldSettings.options")}</Label>
                          <OptionsEditor
                            value={
                              (() => {
                                const { options } = parseOptionsWithLayout(presetValues || null);
                                return options.length > 0 ? JSON.stringify(options) : "";
                              })()
                            }
                            onChange={(v) =>
                              setPresetValues(
                                stringifyOptionsWithLayout(
                                  parseOptionsWithLayout(presetValues || null).layout,
                                  parsePresetValues(v || null)
                                )
                              )
                            }
                            dataType={dataType as DataType}
                            disabled={saving}
                            placeholder={t("fieldDefinitions.optionNamePlaceholder")}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className={cn("grid", SHEET_FIELD_GAP)}>
                        <Label htmlFor="fd-presets">{t("fieldSettings.options")}</Label>
                        <OptionsEditor
                          value={presetValues}
                          onChange={setPresetValues}
                          dataType={dataType as DataType}
                          disabled={saving}
                          placeholder={t("fieldDefinitions.optionNamePlaceholder")}
                        />
                      </div>
                    )}
                  </div>
                )}

                {needsFormula && (
                  <FormulaEditor
                    value={validation}
                    onChange={setValidation}
                    numericFields={fieldDefinitions
                      .filter(
                        (fd) =>
                          (fd.dataType === "integer" || fd.dataType === "float") &&
                          fd.widgetType !== "calculated" &&
                          (fd.code ?? fd.id) !== (selectedField?.code ?? selectedField?.id ?? code)
                      )
                      .map((fd) => ({
                        code: fd.code ?? fd.id,
                        label: fd.label,
                      }))}
                    disabled={saving}
                    id="fd-formula"
                    className={SHEET_INPUT_CLASS}
                  />
                )}

                {needsValidation && (() => {
                  let opts = VALIDATION_OPTIONS[dataType as DataType] ?? [];
                  if (widgetType !== "textarea") {
                    opts = opts.filter((o) => o.key !== "minRows" && o.key !== "maxRows");
                  }
                  if (["select", "multiselect", "radio"].includes(widgetType)) {
                    opts = opts.filter(
                      (o) =>
                        o.key !== "minLength" &&
                        o.key !== "maxLength" &&
                        o.key !== "min" &&
                        o.key !== "max" &&
                        o.key !== "step" &&
                        o.key !== "decimalPlaces" &&
                        o.key !== "useThousandSeparator"
                    );
                  }
                  if (widgetType !== "text_input") {
                    opts = opts.filter((o) => o.key !== "format" && o.key !== "pattern" && o.key !== "patternMessage");
                  } else if (String(validationValues.format ?? "") !== "custom") {
                    opts = opts.filter((o) => o.key !== "pattern" && o.key !== "patternMessage");
                  }
                  if (opts.length === 0) return null;
                  const renderOpt = (opt: (typeof opts)[number]) => {
                    if (opt.inputType === "fileSize") {
                      const bytes = Number(validationValues[opt.key]) || 0;
                      const { value: displayValue, unit: displayUnit } =
                        bytes > 0 ? bytesToFileSizeDisplay(bytes) : { value: 0, unit: "KB" as FileSizeUnit };
                      return (
                        <div className="flex gap-2 flex-1 min-w-0">
                          <Input
                            id={`fd-val-${opt.key}`}
                            type="number"
                            min={0}
                            step="any"
                            value={displayValue || ""}
                            onChange={(e) => {
                              const raw = e.target.value === "" ? 0 : Number(e.target.value);
                              const val = raw < 0 ? 0 : raw;
                              const bytes = fileSizeDisplayToBytes(val, displayUnit);
                              setValidationValues((prev) => ({ ...prev, [opt.key]: bytes }));
                            }}
                            placeholder={t(opt.hintKey)}
                            disabled={saving}
                            className={SHEET_INPUT_CLASS}
                          />
                          <Select
                            value={displayUnit}
                            onValueChange={(v) => {
                              const bytes = fileSizeDisplayToBytes(displayValue || 0, v as FileSizeUnit);
                              setValidationValues((prev) => ({ ...prev, [opt.key]: bytes }));
                            }}
                            disabled={saving}
                          >
                            <SelectTrigger className={cn(SHEET_INPUT_CLASS, "w-[7rem] shrink-0")}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FILE_SIZE_UNITS.map((u) => (
                                <SelectItem key={u.value} value={u.value}>
                                  {t(u.labelKey)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    }
                    if (opt.inputType === "number") {
                      const v = validationValues[opt.key];
                      const numValue =
                        v != null && typeof v !== "boolean" ? v : "";
                      const min =
                        opt.key === "minRows" || opt.key === "maxRows"
                          ? 1
                          : opt.key === "minLength" || opt.key === "maxLength"
                            ? 0
                            : undefined;
                      return (
                        <Input
                          id={`fd-val-${opt.key}`}
                          type="number"
                          min={min}
                          value={numValue}
                          onChange={(e) => {
                            const raw = e.target.value === "" ? "" : Number(e.target.value);
                            const value =
                              typeof raw === "number" && min !== undefined && raw < min ? min : raw;
                            setValidationValues((prev) => ({ ...prev, [opt.key]: value }));
                          }}
                          placeholder={t(opt.hintKey)}
                          disabled={saving}
                          className={SHEET_INPUT_CLASS}
                        />
                      );
                    }
                    if (opt.key === "required" || opt.inputType === "checkbox") {
                      return (
                        <input
                          type="checkbox"
                          id={`fd-val-${opt.key}`}
                          checked={!!validationValues[opt.key]}
                          onChange={(e) =>
                            setValidationValues((prev) => ({
                              ...prev,
                              [opt.key]: e.target.checked,
                            }))
                          }
                          disabled={saving}
                          className="size-4"
                        />
                      );
                    }
                    if (opt.inputType === "select" && opt.selectOptions) {
                      return (
                        <Select
                          value={String(validationValues[opt.key] ?? "")}
                          onValueChange={(v) =>
                            setValidationValues((prev) => ({ ...prev, [opt.key]: v }))
                          }
                          disabled={saving}
                        >
                          <SelectTrigger id={`fd-val-${opt.key}`} className={SHEET_INPUT_CLASS}>
                            <SelectValue placeholder={t(opt.hintKey)} />
                          </SelectTrigger>
                          <SelectContent>
                            {opt.selectOptions.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {t(o.labelKey)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    }
                    return (
                      <Input
                        id={`fd-val-${opt.key}`}
                        value={String(validationValues[opt.key] ?? "")}
                        onChange={(e) =>
                          setValidationValues((prev) => ({
                            ...prev,
                            [opt.key]: e.target.value,
                          }))
                        }
                        placeholder={t(opt.hintKey)}
                        disabled={saving}
                        className={SHEET_INPUT_CLASS}
                      />
                    );
                  };
                  const minMaxPairs: [string, string][] = [
                    ["minLength", "maxLength"],
                    ["min", "max"],
                    ["minRows", "maxRows"],
                  ];
                  const paired = minMaxPairs.find(([a, b]) => opts.some((o) => o.key === a) && opts.some((o) => o.key === b));
                  const others = opts.filter((o) => !paired?.includes(o.key));
                  return (
                    <div className="grid gap-3">
                      <div className="flex flex-col gap-2">
                        {others.map((opt) => (
                          <div key={opt.key} className="flex items-center gap-2">
                            <Label htmlFor={`fd-val-${opt.key}`} className="min-w-[8rem] shrink-0 text-sm font-normal">
                              {t(opt.labelKey)}
                            </Label>
                            {renderOpt(opt)}
                          </div>
                        ))}
                        {paired && (
                          <div className="grid grid-cols-2 gap-3">
                            {paired.map((key) => {
                              const opt = opts.find((o) => o.key === key);
                              if (!opt) return null;
                              return (
                                <div key={opt.key} className="grid gap-2">
                                  <Label htmlFor={`fd-val-${opt.key}`} className="text-sm font-normal">
                                    {t(opt.labelKey)}
                                  </Label>
                                  {renderOpt(opt)}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {widgetType !== "composite" && (dataType === "integer" || dataType === "float") && (
                <div className="grid gap-3">
                  <Label>{t("fieldSettings.unit")}</Label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label
                        htmlFor="fd-unit-category"
                        className="text-xs font-normal text-muted-foreground"
                      >
                        {t("fieldSettings.unitCategory")}
                      </Label>
                      <Select
                        value={unitCategory ?? ""}
                        onValueChange={(v) => {
                          setUnitCategory(v || null);
                          setUnitDimension(null);
                          setUnit(v ? "" : "");
                        }}
                        disabled={saving}
                      >
                        <SelectTrigger
                          id="fd-unit-category"
                          className={SHEET_INPUT_CLASS}
                        >
                          <SelectValue placeholder={t("common.selectCategoryPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {MEASUREMENT_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label
                        htmlFor="fd-unit-dimension"
                        className="text-xs font-normal text-muted-foreground"
                      >
                        Розмірність
                      </Label>
                      <Select
                        value={unitDimension ?? ""}
                        onValueChange={(v) => {
                          setUnitDimension(v || null);
                          if (v === CUSTOM_UNIT_VALUE) {
                            setUnit("");
                          } else if (v) {
                            const cat = MEASUREMENT_CATEGORIES.find(
                              (c) => c.id === unitCategory
                            );
                            const dim = cat?.dimensions.find((d) => d.value === v);
                            setUnit(dim?.label ?? "");
                          } else {
                            setUnit("");
                          }
                        }}
                        disabled={saving || !unitCategory}
                      >
                        <SelectTrigger
                          id="fd-unit-dimension"
                          className={SHEET_INPUT_CLASS}
                        >
                          <SelectValue placeholder={t("fieldDefinitions.selectDimensionPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {unitCategory
                            ? MEASUREMENT_CATEGORIES.find(
                                (c) => c.id === unitCategory
                              )?.dimensions.map((dim) => (
                                <SelectItem
                                  key={dim.value}
                                  value={dim.value}
                                >
                                  {dim.label}
                                </SelectItem>
                              )) ?? []
                            : []}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {unitDimension === CUSTOM_UNIT_VALUE && (
                    <div className="grid gap-2">
                      <Label
                        htmlFor="fd-unit-custom"
                        className="text-xs font-normal text-muted-foreground"
                      >
                        Власне значення
                      </Label>
                      <Input
                        id="fd-unit-custom"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder={t("fieldDefinitions.unitPlaceholder")}
                        disabled={saving}
                        className={SHEET_INPUT_CLASS}
                      />
                    </div>
                  )}
                </div>
                )}

                {WIDGETS_WITH_PLACEHOLDER.includes(widgetType) && (
                <div className="grid gap-2">
                  <Label htmlFor="fd-placeholder">Placeholder</Label>
                  <Input
                    id="fd-placeholder"
                    value={placeholder}
                    onChange={(e) => setPlaceholder(e.target.value)}
                    placeholder={t("fieldDefinitions.placeholderHint")}
                    disabled={saving}
                    className={SHEET_INPUT_CLASS}
                  />
                </div>
                )}

                {widgetType !== "composite" && !WIDGETS_WITHOUT_DEFAULT_VALUE.includes(widgetType) && (
                  <div className="grid gap-2">
                    <Label htmlFor="fd-default">
                      {t("fieldDefinitions.defaultValue")}
                    </Label>
                    <Input
                      id="fd-default"
                      value={defaultValue}
                      onChange={(e) => setDefaultValue(e.target.value)}
                      placeholder={t("fieldDefinitions.optionalPlaceholder")}
                      disabled={saving}
                      className={SHEET_INPUT_CLASS}
                    />
                  </div>
                )}

                {(widgetType === "number_input" || widgetType === "calculated") && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="fd-hidden-on-card"
                      checked={hiddenOnCard}
                      onCheckedChange={(v) => setHiddenOnCard(!!v)}
                      disabled={saving}
                    />
                    <Label htmlFor="fd-hidden-on-card" className="text-sm font-normal cursor-pointer">
                      {t("fieldDefinitions.hiddenOnCard")}
                    </Label>
                  </div>
                )}

                <div className="grid gap-3">
                  <Label>{t("fieldDefinitions.categoriesAndTypes")}</Label>
                  <div className="flex flex-col gap-4 rounded-md border p-3">
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-muted-foreground">{t("fieldDefinitions.categories")}</span>
                      <p className="text-xs text-muted-foreground">
                        {t("fieldDefinitions.categoriesHint")}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {sortedCategories.map((cat) => {
                          const checked = fieldCategoryIds.includes(cat.id);
                          const toggle = () => {
                            if (checked) {
                              setFieldCategoryIds((prev) => prev.filter((id) => id !== cat.id));
                              setFieldProductTypeIds((prev) =>
                                prev.filter((id) => {
                                  const vt = allProductTypes.find((t) => t.id === id);
                                  return !vt || vt.categoryId !== cat.id;
                                })
                              );
                            } else {
                              setFieldCategoryIds((prev) => [...prev, cat.id].sort());
                            }
                          };
                          return (
                            <label
                              key={cat.id}
                              className="flex items-center gap-2 cursor-pointer text-sm"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={toggle}
                                disabled={saving}
                              />
                              {cat.name}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    {fieldCategoryIds.length > 0 && (
                      <div className="flex flex-col gap-2 border-t pt-3">
                        <span className="text-sm font-medium text-muted-foreground">{t("fieldDefinitions.productTypes")}</span>
                        <p className="text-xs text-muted-foreground">
                          {t("fieldDefinitions.productTypesHint")}
                        </p>
                        <div className="flex flex-col gap-2">
                          {fieldCategoryIds.map((catId) => {
                            const types = productTypesByCategory.get(catId) ?? [];
                            const cat = sortedCategories.find((c) => c.id === catId);
                            if (types.length === 0) return null;
                            return (
                              <div key={catId} className="flex flex-col gap-1.5">
                                <span className="text-xs font-medium">{cat?.name ?? catId}</span>
                                <div className="flex flex-wrap gap-2 pl-2">
                                  {types.map((vt) => {
                                    const checked = fieldProductTypeIds.includes(vt.id);
                                    return (
                                      <label
                                        key={vt.id}
                                        className="flex items-center gap-2 cursor-pointer text-sm"
                                      >
                                        <Checkbox
                                          checked={checked}
                                          onCheckedChange={(v) => {
                                            if (v) {
                                              setFieldProductTypeIds((prev) =>
                                                [...prev, vt.id].sort()
                                              );
                                            } else {
                                              setFieldProductTypeIds((prev) =>
                                                prev.filter((id) => id !== vt.id)
                                              );
                                            }
                                          }}
                                          disabled={saving}
                                        />
                                        {vt.name}
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className={SHEET_FOOTER_CLASS}>
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <div>
                {showFieldDeleteButton ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFieldDeleteDialogOpen(true)}
                    disabled={saving || deleteMut.isPending}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  >
                    {t("productsConfig.common.delete")}
                  </Button>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeSheet}
                  disabled={saving}
                >
                  {t("productsConfig.common.cancel")}
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && !deleteMut.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  {isCreate ? t("productsConfig.common.create") : t("productsConfig.common.save")}
                </Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDestructiveDialog
        open={dataTypeChangeModal.open}
        onOpenChange={(open) =>
          !open && setDataTypeChangeModal({ open: false, newDataType: "" })
        }
        title={t("fieldDefinitions.dataTypeChangeTitle")}
        description={t("fieldDefinitions.dataTypeChangeDesc")}
        cancelLabel={t("productsConfig.common.cancel")}
        confirmLabel={t("fieldDefinitions.continue")}
        confirmTone="default"
        onConfirm={confirmDataTypeChange}
      />

      <ConfirmDestructiveDialog
        open={fieldDeleteDialogOpen}
        onOpenChange={setFieldDeleteDialogOpen}
        title={
          selectedField
            ? tFormat("fieldDefinitions.deleteConfirmTitle", {
                label: selectedField.label,
              })
            : ""
        }
        description={t("fieldDefinitions.deleteConfirmDescription")}
        cancelLabel={t("productsConfig.common.cancel")}
        confirmLabel={t("productsConfig.common.delete")}
        confirmPending={deleteMut.isPending}
        confirmPendingLabel={t("productsConfig.common.deleting")}
        onConfirm={confirmDeleteField}
      >
        {fieldDeleteUsageLoading ? (
          <AlertDialogBody>
            <p className="text-sm text-muted-foreground">
              {t("fieldDefinitions.deleteConfirmUsageLoading")}
            </p>
          </AlertDialogBody>
        ) : fieldDeleteUsage?.usage ? (
          <AlertDialogBody className="max-h-[40vh] overflow-y-auto">
            <p className="text-sm font-medium">
              {t("fieldDefinitions.deleteConfirmTabsHeading")}
            </p>
            {fieldDeleteUsage.usage.tabPlacements.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {t("fieldDefinitions.deleteConfirmNoTabs")}
              </p>
            ) : (
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                {fieldDeleteUsage.usage.tabPlacements.map((p, i) => {
                  const typePart = p.productTypeName
                    ? tFormat("fieldDefinitions.deleteConfirmTypePart", {
                        name: p.productTypeName,
                      })
                    : "";
                  return (
                    <li key={`${p.categoryName}-${p.tabName}-${i}`}>
                      {tFormat("fieldDefinitions.deleteConfirmTabLine", {
                        category: p.categoryName,
                        tab: p.tabName,
                        typePart,
                      })}
                    </li>
                  );
                })}
              </ul>
            )}
            {fieldDeleteUsage.usage.productValuesCount > 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {tFormat("fieldDefinitions.deleteConfirmValues", {
                  count: String(
                    fieldDeleteUsage.usage.productValuesCount
                  ),
                })}
              </p>
            ) : null}
          </AlertDialogBody>
        ) : null}
      </ConfirmDestructiveDialog>
    </div>
  );
}

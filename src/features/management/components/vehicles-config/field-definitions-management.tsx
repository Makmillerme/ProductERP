"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { SHEET_CONTENT_CLASS, SHEET_INPUT_CLASS, SHEET_HEADER_CLASS, SHEET_BODY_CLASS, SHEET_BODY_SCROLL_CLASS, SHEET_FOOTER_CLASS, SHEET_FORM_GAP, SHEET_FORM_PADDING, SHEET_FIELD_GAP } from "@/config/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MANAGEMENT_STALE_MS } from "@/lib/query-keys";
import { slugify } from "@/lib/slugify";
import {
  DATA_TYPES,
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
  validateFormula,
} from "@/features/vehicles/lib/field-utils";
import { useLocale } from "@/lib/locale-provider";
import { TableWithPagination } from "@/components/table-with-pagination";
import type { FieldDefinitionItem } from "./types";

const FIELD_DEFS_KEY = ["admin", "field-definitions"] as const;

const PAGE_SIZES = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 20;

const DATA_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  DATA_TYPES.map((o) => [o.value, o.label])
);

const WIDGET_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  WIDGET_TYPES.map((o) => [o.value, o.label])
);

async function fetchFieldDefinitions(params: {
  search: string;
  page: number;
  pageSize: number;
}): Promise<{ fieldDefinitions: FieldDefinitionItem[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  searchParams.set("page", String(params.page));
  searchParams.set("pageSize", String(params.pageSize));
  const res = await fetch(`/api/admin/field-definitions?${searchParams.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Помилка завантаження полів");
  }
  const data = await res.json();
  return {
    fieldDefinitions: data.fieldDefinitions ?? [],
    total: data.total ?? 0,
  };
}

async function createFieldDefinition(body: {
  code: string;
  label: string;
  dataType: string;
  widgetType: string;
  presetValues?: string | null;
  validation?: string | null;
  unit?: string | null;
  defaultValue?: string | null;
  placeholder?: string | null;
  hiddenOnCard?: boolean;
}) {
  const res = await fetch("/api/admin/field-definitions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Помилка створення поля");
  return data;
}

async function updateFieldDefinition(
  id: string,
  body: {
    label?: string;
    code?: string;
    dataType?: string;
    widgetType?: string;
    presetValues?: string | null;
    validation?: string | null;
    unit?: string | null;
    defaultValue?: string | null;
    placeholder?: string | null;
    hiddenOnCard?: boolean;
  }
) {
  const res = await fetch(`/api/admin/field-definitions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Помилка збереження поля");
  return data;
}

async function deleteFieldDefinition(id: string) {
  const res = await fetch(`/api/admin/field-definitions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Помилка видалення поля");
  }
}

export function FieldDefinitionsManagement() {
  const queryClient = useQueryClient();
  const { t } = useLocale();

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
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataTypeChangeModal, setDataTypeChangeModal] = useState<{
    open: boolean;
    newDataType: string;
  }>({ open: false, newDataType: "" });

  const listParams = useMemo(
    () => ({ search: search.trim(), page, pageSize }),
    [search, page, pageSize]
  );

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [...FIELD_DEFS_KEY, listParams],
    queryFn: () => fetchFieldDefinitions(listParams),
    staleTime: MANAGEMENT_STALE_MS,
  });

  const fieldDefinitions = data?.fieldDefinitions ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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

  const createMut = useMutation({
    mutationFn: createFieldDefinition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FIELD_DEFS_KEY });
      toast.success("Поле створено");
    },
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof updateFieldDefinition>[1];
    }) => updateFieldDefinition(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FIELD_DEFS_KEY });
      toast.success("Поле збережено");
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteFieldDefinition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FIELD_DEFS_KEY });
      toast.success("Поле видалено");
    },
  });

  const resetForm = () => {
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
    setCodeManuallyEdited(false);
  };

  const openForCreate = () => {
    setSelectedField(null);
    setIsCreate(true);
    resetForm();
    setSheetOpen(true);
  };

  const openForEdit = (fd: FieldDefinitionItem) => {
    setSelectedField(fd);
    setIsCreate(false);
    setLabel(fd.label);
    setCode(fd.code);
    setDataType(fd.dataType);
    setWidgetType(fd.widgetType as WidgetType);
    setPresetValues(fd.presetValues ?? "");
    setValidation(fd.validation ?? "");
    setValidationValues(parseValidationJson(fd.validation));
    setHiddenOnCard(fd.hiddenOnCard ?? false);
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

  const openFromTemplate = (t: (typeof FIELD_TEMPLATES)[number]) => {
    setSelectedField(null);
    setIsCreate(true);
    setLabel(t.label);
    setCode("");
    setCodeManuallyEdited(false);
    setWidgetType(t.widgetType);
    setDataType(t.dataType ?? "string");
    setPresetValues("");
    setValidation("");
    setValidationValues({});
    setUnit("");
    setUnitCategory(null);
    setUnitDimension(null);
    setPlaceholder("");
    setDefaultValue("");
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
          "Неможливо змінити тип — існуючі опції не відповідають новому типу даних"
        );
        return;
      }

      applyDataTypeChange(newDataType);
    },
    [dataType, presetValues, widgetType, applyDataTypeChange]
  );

  const needsPresetValues = WIDGETS_WITH_PRESETS.includes(widgetType);

  const confirmDataTypeChange = useCallback(() => {
    if (dataTypeChangeModal.open) {
      applyDataTypeChange(dataTypeChangeModal.newDataType);
      setPresetValues("");
      setDataTypeChangeModal({ open: false, newDataType: "" });
    }
  }, [dataTypeChangeModal, applyDataTypeChange]);

  const canDelete =
    !isCreate &&
    selectedField &&
    !selectedField.isSystem &&
    (selectedField._count?.tabFields ?? 0) === 0;

  const needsFormula = WIDGETS_WITH_FORMULA.includes(widgetType);
  const needsValidation = !WIDGETS_WITHOUT_VALIDATION.includes(widgetType);
  const dataTypeOptions = getDataTypesForWidget(widgetType);
  const needsDataType = dataTypeOptions.length > 0;

  const handleSave = async () => {
    const trimmedLabel = label.trim();
    const trimmedCode = code.trim();

    if (!trimmedLabel) {
      toast.error("Вкажіть назву поля");
      return;
    }
    if (!trimmedCode) {
      toast.error("Вкажіть код поля");
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
          code: trimmedCode,
          dataType,
          widgetType,
          presetValues: needsPresetValues ? effectivePresetValues : null,
          validation: needsFormula
            ? validation.trim() || null
            : buildValidationJson(dataType as DataType, validationValues as Record<string, string | number | boolean>) ?? null,
          unit: (dataType === "integer" || dataType === "float") ? (unit.trim() || null) : null,
          defaultValue: WIDGETS_WITHOUT_DEFAULT_VALUE.includes(widgetType) ? null : (defaultValue.trim() || null),
          placeholder: WIDGETS_WITH_PLACEHOLDER.includes(widgetType) ? (placeholder.trim() || null) : null,
          hiddenOnCard: ["number_input", "calculated"].includes(widgetType) ? hiddenOnCard : false,
        });
      } else if (selectedField) {
        const body: Parameters<typeof updateFieldDefinition>[1] = {
          label: trimmedLabel,
          code: trimmedCode,
          dataType,
          widgetType,
          presetValues: needsPresetValues ? effectivePresetValues : null,
          validation: needsFormula
            ? validation.trim() || null
            : buildValidationJson(dataType as DataType, validationValues as Record<string, string | number | boolean>) ?? null,
          defaultValue: WIDGETS_WITHOUT_DEFAULT_VALUE.includes(widgetType) ? null : (defaultValue.trim() || null),
          placeholder: WIDGETS_WITH_PLACEHOLDER.includes(widgetType) ? (placeholder.trim() || null) : null,
          unit: (dataType === "integer" || dataType === "float") ? (unit.trim() || null) : null,
          hiddenOnCard: ["number_input", "calculated"].includes(widgetType) ? hiddenOnCard : false,
        };
        await updateMut.mutateAsync({ id: selectedField.id, body });
      }
      closeSheet();
    } catch (e) {
      const msg =
        e instanceof Error && e.message === "Code already exists"
          ? t("fieldDefinitions.codeAlreadyExists")
          : e instanceof Error
            ? e.message
            : "Помилка збереження";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedField) return;
    setSaving(true);
    try {
      await deleteMut.mutateAsync(selectedField.id);
      closeSheet();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Помилка видалення");
    } finally {
      setSaving(false);
    }
  };

  const isEmpty = fieldDefinitions.length === 0;
  const emptyMessage =
    total === 0 && !search.trim()
      ? "Ще немає полів. Натисніть «+», щоб додати перше."
      : "За пошуком нічого не знайдено.";
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Віджети:</span>
          {FIELD_TEMPLATES.map((t) => (
            <Button
              key={t.id}
              variant="outline"
              size="sm"
              onClick={() => openFromTemplate(t)}
              className="h-8 text-xs"
            >
              {t.label}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon"
            aria-label="Додати поле"
            onClick={openForCreate}
            className="size-8 shrink-0"
          >
            <Plus className="size-4" />
          </Button>
        </div>
        <form
          onSubmit={handleSearchSubmit}
          className="relative min-w-0 max-w-sm"
        >
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Пошук по назві, коду або типу..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 pl-9 bg-background"
          />
        </form>
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Помилка завантаження"}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <TableWithPagination
          pagination={
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="flex items-center justify-center [&_svg]:block [&_svg]:m-auto"
                  aria-label="На початок"
                  disabled={!canPrev}
                  onClick={() => goToPage(1)}
                >
                  <ChevronsLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="flex items-center justify-center [&_svg]:block [&_svg]:m-auto"
                  aria-label="Попередня сторінка"
                  disabled={!canPrev}
                  onClick={() => goToPage(page - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="flex items-center gap-1.5 px-2 text-sm text-muted-foreground">
                  Сторінка
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageInputValue}
                    onChange={(e) => setPageInputValue(e.target.value)}
                    onBlur={handlePageInputBlur}
                    onKeyDown={handlePageInputKeyDown}
                    className="h-8 w-14 text-center"
                    aria-label="Номер сторінки"
                  />
                  з {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="flex items-center justify-center [&_svg]:block [&_svg]:m-auto"
                  aria-label="Наступна сторінка"
                  disabled={!canNext}
                  onClick={() => goToPage(page + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="flex items-center justify-center [&_svg]:block [&_svg]:m-auto"
                  aria-label="В кінець"
                  disabled={!canNext}
                  onClick={() => goToPage(totalPages)}
                >
                  <ChevronsRight className="size-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Рядків на сторінці:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="default"
                      className="gap-2 min-w-[4.5rem] justify-between"
                      aria-label="Кількість рядків на сторінці"
                    >
                      {pageSize}
                      <ChevronDown className="size-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuRadioGroup
                      value={String(pageSize)}
                      onValueChange={(v) => {
                        setPageSize(Number(v));
                        setPage(1);
                      }}
                    >
                      {PAGE_SIZES.map((n) => (
                        <DropdownMenuRadioItem key={n} value={String(n)}>
                          {n}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          }
        >
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="h-11 px-3 text-left align-middle">
                  Назва
                </TableHead>
                <TableHead className="h-11 px-3 text-left align-middle hidden sm:table-cell">
                  Код
                </TableHead>
                <TableHead className="h-11 px-3 text-left align-middle w-28">
                  Тип даних
                </TableHead>
                <TableHead className="h-11 px-3 text-left align-middle w-32">
                  Відображення
                </TableHead>
                <TableHead className="h-11 px-3 text-left align-middle w-28">
                  Використань
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isEmpty ? (
                <TableRow key="empty" className="hover:bg-transparent">
                  <TableCell plain colSpan={5} className="h-24 align-middle">
                    <div className="flex min-h-[8rem] w-full flex-col items-center justify-center gap-2 py-10 text-center">
                      <p className="text-sm text-muted-foreground px-4">
                        {emptyMessage}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                fieldDefinitions.map((fd) => (
                  <TableRow
                    key={fd.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openForEdit(fd)}
                  >
                    <TableCell className="h-11 px-3 text-left align-middle font-medium">
                      {fd.label}
                    </TableCell>
                    <TableCell className="h-11 px-3 text-left align-middle text-muted-foreground text-sm hidden sm:table-cell">
                      {fd.code}
                    </TableCell>
                    <TableCell className="h-11 px-3 text-left align-middle text-muted-foreground text-sm">
                      {fd.widgetType === "composite" ? "—" : (DATA_TYPE_LABELS[fd.dataType] ?? fd.dataType)}
                    </TableCell>
                    <TableCell className="h-11 px-3 text-left align-middle text-muted-foreground text-sm">
                      {WIDGET_TYPE_LABELS[fd.widgetType] ?? fd.widgetType}
                    </TableCell>
                    <TableCell className="h-11 px-3 text-left align-middle text-muted-foreground text-sm tabular-nums">
                      {fd._count?.tabFields ?? 0}
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
                ? "Нове поле"
                : (selectedField?.label ?? "Поле")}
            </SheetTitle>
          </SheetHeader>

          <div className={SHEET_BODY_CLASS}>
            <div className={SHEET_BODY_SCROLL_CLASS}>
              <div className={cn("grid", SHEET_FORM_GAP, SHEET_FORM_PADDING)}>
                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="fd-label">Назва</Label>
                  <Input
                    id="fd-label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Наприклад: Пробіг"
                    disabled={saving}
                    className={SHEET_INPUT_CLASS}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="fd-code">Код</Label>
                  <Input
                    id="fd-code"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (isCreate) setCodeManuallyEdited(true);
                    }}
                    placeholder="Наприклад: mileage"
                    disabled={saving}
                    className={SHEET_INPUT_CLASS}
                  />
                  {isCreate && (
                    <p className="text-xs text-muted-foreground">
                      Генерується автоматично з назви
                    </p>
                  )}
                </div>

                <div className={cn("grid gap-3", needsDataType && "grid-cols-2")}>
                  <div className="grid gap-2">
                    <Label htmlFor="fd-widget-type">Відображення</Label>
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
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {needsDataType && (
                    <div className="grid gap-2">
                      <Label htmlFor="fd-data-type">Тип даних</Label>
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
                              {DATA_TYPE_LABELS[dt] ?? dt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {needsPresetValues && (
                  <div className="grid gap-2">
                    {widgetType === "composite" ? (
                      <>
                        <Label>Підполя складеного поля</Label>
                        <CompositeSubFieldsEditor
                          value={presetValues}
                          onChange={setPresetValues}
                          disabled={saving}
                        />
                      </>
                    ) : widgetType === "file_upload" ? (
                      <DocumentFoldersEditor
                        value={presetValues}
                        onChange={setPresetValues}
                        disabled={saving}
                      />
                    ) : dataType === "boolean" ? (
                      <>
                        <Label>Опції</Label>
                        <p className="text-sm text-muted-foreground">
                          Так / Ні (фіксовані опції)
                        </p>
                      </>
                    ) : (
                      <>
                        <Label htmlFor="fd-presets">{t("fieldSettings.options")}</Label>
                        <OptionsEditor
                          value={presetValues}
                          onChange={setPresetValues}
                          dataType={dataType as DataType}
                          disabled={saving}
                          placeholder="Назва опції"
                        />
                      </>
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
                          (fd.systemColumn ?? fd.code) !==
                            (selectedField?.systemColumn ?? selectedField?.code ?? code)
                      )
                      .map((fd) => ({
                        code: fd.systemColumn ?? fd.code,
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
                            placeholder={opt.hint}
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
                                  {u.label}
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
                          placeholder={opt.hint}
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
                            <SelectValue placeholder={opt.hint} />
                          </SelectTrigger>
                          <SelectContent>
                            {opt.selectOptions.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
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
                        placeholder={opt.hint}
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
                              {opt.label}
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
                                    {opt.label}
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
                  <Label>Одиниці вимірювання</Label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label
                        htmlFor="fd-unit-category"
                        className="text-xs font-normal text-muted-foreground"
                      >
                        Категорія
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
                          <SelectValue placeholder="Оберіть категорію" />
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
                          <SelectValue placeholder="Оберіть розмірність" />
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
                        placeholder="Наприклад: км/год, од/м³"
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
                    placeholder="Текст-підказка для поля"
                    disabled={saving}
                    className={SHEET_INPUT_CLASS}
                  />
                </div>
                )}

                {widgetType !== "composite" && !WIDGETS_WITHOUT_DEFAULT_VALUE.includes(widgetType) && (
                  <div className="grid gap-2">
                    <Label htmlFor="fd-default">
                      Значення за замовчуванням
                    </Label>
                    <Input
                      id="fd-default"
                      value={defaultValue}
                      onChange={(e) => setDefaultValue(e.target.value)}
                      placeholder="Необовʼязково"
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
                      Приховано на картці товару
                    </Label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <SheetFooter className={SHEET_FOOTER_CLASS}>
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <div>
                {canDelete && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDelete}
                    disabled={saving}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  >
                    {saving && deleteMut.isPending ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    Видалити
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeSheet}
                  disabled={saving}
                >
                  Скасувати
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && !deleteMut.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  {isCreate ? "Створити" : "Зберегти"}
                </Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={dataTypeChangeModal.open}
        onOpenChange={(open) =>
          !open && setDataTypeChangeModal({ open: false, newDataType: "" })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Змінити тип даних?</AlertDialogTitle>
            <AlertDialogDescription>
              Зміна типу даних очистить усі опції. Цю дію не можна скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDataTypeChange}>
              Продовжити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

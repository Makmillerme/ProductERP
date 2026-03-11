"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCardCategoryId,
  setCardCategoryId,
} from "@/lib/management-state";
import { MANAGEMENT_STALE_MS } from "@/lib/query-keys";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { SHEET_CONTENT_CLASS, SHEET_INPUT_CLASS, SHEET_HEADER_CLASS, SHEET_BODY_CLASS, SHEET_FOOTER_CLASS, SHEET_FORM_GAP, SHEET_FORM_PADDING, SHEET_FIELD_GAP, SHEET_SCROLL_CLASS } from "@/config/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Loader2, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { slugify } from "@/lib/slugify";
import type {
  CategoryItem,
  VehicleTypeItem,
  TabDefinitionItem,
  TabFieldItem,
  FieldDefinitionItem,
} from "./types";

const CATEGORIES_KEY = ["admin", "categories"] as const;
const FIELD_DEFS_KEY = ["admin", "field-definitions"] as const;

/** Таб = сторінка. Контент будується з полів різних типів. */
const WIDGET_TYPE_LABELS: Record<string, string> = {
  text_input: "Текст",
  number_input: "Число",
  select: "Список",
  multiselect: "Мультивибір",
  checkbox: "Прапорець",
  radio: "Радіо",
  textarea: "Область",
  datepicker: "Дата",
  currency_input: "Валюта",
};

async function fetchCategories(): Promise<CategoryItem[]> {
  const res = await fetch("/api/admin/categories");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Помилка завантаження категорій");
  }
  const data = await res.json();
  return data.categories ?? data ?? [];
}

async function fetchVehicleTypes(): Promise<VehicleTypeItem[]> {
  const res = await fetch("/api/admin/vehicle-types");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Помилка завантаження типів авто");
  }
  const data = await res.json();
  return data.vehicleTypes ?? data ?? [];
}

async function fetchTabsForCategory(categoryId: string): Promise<TabDefinitionItem[]> {
  const res = await fetch(`/api/admin/categories/${categoryId}/tabs`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Помилка завантаження табів");
  }
  return res.json();
}

async function fetchTabDetail(
  tabId: string
): Promise<TabDefinitionItem & { fields: TabFieldItem[] }> {
  const res = await fetch(`/api/admin/tabs/${tabId}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Помилка завантаження табу");
  }
  return res.json();
}

async function fetchFieldDefinitions(): Promise<FieldDefinitionItem[]> {
  const res = await fetch("/api/admin/field-definitions?pageSize=500");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Помилка завантаження полів");
  }
  const data = await res.json();
  return data.fieldDefinitions ?? [];
}

async function createTabApi(
  categoryId: string,
  body: {
    name: string;
    code: string;
    icon?: string;
    order?: number;
  }
) {
  const res = await fetch(`/api/admin/categories/${categoryId}/tabs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Помилка створення табу");
  return data;
}

interface TabFieldInput {
  fieldDefinitionId: string;
  productTypeId?: string | null;
  order?: number;
  colSpan?: number;
  isRequired?: boolean;
  sectionTitle?: string | null;
}

async function updateTabApi(
  tabId: string,
  body: {
    name?: string;
    icon?: string;
    order?: number;
    fields?: TabFieldInput[];
  }
) {
  const res = await fetch(`/api/admin/tabs/${tabId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Помилка збереження табу");
  return data;
}

async function deleteTabApi(tabId: string) {
  const res = await fetch(`/api/admin/tabs/${tabId}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Помилка видалення табу");
  }
}

type AssignedField = {
  fieldDefinitionId: string;
  productTypeId: string | null;
  order: number;
  colSpan: number;
  isRequired: boolean;
  sectionTitle: string;
  fieldDefinition: FieldDefinitionItem;
};

export function TabsConfigManagement() {
  const queryClient = useQueryClient();
  const hasInitializedCategoryRef = useRef(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [isCreate, setIsCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [tabName, setTabName] = useState("");
  const [tabCode, setTabCode] = useState("");
  const [tabIcon, setTabIcon] = useState("");
  const [tabOrder, setTabOrder] = useState(0);
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);

  const [assignedFields, setAssignedFields] = useState<AssignedField[]>([]);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [deleteTabDialogOpen, setDeleteTabDialogOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: [...CATEGORIES_KEY],
    queryFn: fetchCategories,
    staleTime: MANAGEMENT_STALE_MS,
  });

  const { data: vehicleTypes = [] } = useQuery({
    queryKey: ["admin", "vehicle-types"],
    queryFn: fetchVehicleTypes,
    staleTime: MANAGEMENT_STALE_MS,
  });

  /** За замовчуванням: перша категорія по порядку. Зберігаємо вибір користувача для повернення. */
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories]
  );

  useEffect(() => {
    if (categories.length === 0) return;
    const ids = new Set(categories.map((c) => c.id));

    if (selectedCategoryId && !ids.has(selectedCategoryId)) {
      const first = sortedCategories[0];
      if (first) {
        setSelectedCategoryId(first.id);
        setCardCategoryId(first.id);
      } else {
        setSelectedCategoryId("");
      }
      return;
    }

    if (hasInitializedCategoryRef.current) return;
    hasInitializedCategoryRef.current = true;

    const savedId = getCardCategoryId();
    const savedExists = savedId && ids.has(savedId);
    if (savedExists) {
      setSelectedCategoryId(savedId);
    } else {
      const first = sortedCategories[0];
      if (first) {
        setSelectedCategoryId(first.id);
        setCardCategoryId(first.id);
      }
    }
  }, [categories, sortedCategories, selectedCategoryId]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setCardCategoryId(categoryId);
  };

  const typesForCategory = useMemo(
    () => vehicleTypes.filter((vt) => vt.categoryId === selectedCategoryId),
    [vehicleTypes, selectedCategoryId]
  );

  const tabsQueryKey = ["admin", "category-tabs", selectedCategoryId];
  const { data: tabs = [], isLoading: tabsLoading } = useQuery({
    queryKey: tabsQueryKey,
    queryFn: () => fetchTabsForCategory(selectedCategoryId),
    enabled: !!selectedCategoryId,
    staleTime: MANAGEMENT_STALE_MS,
  });

  const { data: tabDetail, isLoading: tabDetailLoading } = useQuery({
    queryKey: ["admin", "tab-detail", editingTabId],
    queryFn: () => fetchTabDetail(editingTabId!),
    enabled: !!editingTabId && !isCreate,
    staleTime: MANAGEMENT_STALE_MS,
  });

  const { data: allFields = [] } = useQuery({
    queryKey: [...FIELD_DEFS_KEY],
    queryFn: fetchFieldDefinitions,
    staleTime: MANAGEMENT_STALE_MS,
  });

  useEffect(() => {
    if (tabDetail?.fields) {
      setAssignedFields(
        tabDetail.fields.map((f) => ({
          fieldDefinitionId: f.fieldDefinitionId,
          productTypeId: f.productTypeId ?? null,
          order: f.order,
          colSpan: f.colSpan,
          isRequired: f.isRequired,
          sectionTitle: f.sectionTitle ?? "",
          fieldDefinition: f.fieldDefinition,
        }))
      );
    }
  }, [tabDetail]);

  useEffect(() => {
    if (isCreate && !codeManuallyEdited) {
      setTabCode(slugify(tabName));
    }
  }, [tabName, isCreate, codeManuallyEdited]);

  const unassignedFields = useMemo(() => {
    const ids = new Set(assignedFields.map((f) => f.fieldDefinitionId));
    return allFields.filter((f) => !ids.has(f.id));
  }, [allFields, assignedFields]);

  const sortedTabs = useMemo(
    () => [...tabs].sort((a, b) => a.order - b.order),
    [tabs]
  );

  const createMut = useMutation({
    mutationFn: (body: Parameters<typeof createTabApi>[1]) =>
      createTabApi(selectedCategoryId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tabsQueryKey });
      toast.success("Таб створено");
    },
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof updateTabApi>[1];
    }) => updateTabApi(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tabsQueryKey });
      queryClient.invalidateQueries({
        queryKey: ["admin", "tab-detail", editingTabId],
      });
      toast.success("Таб збережено");
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteTabApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tabsQueryKey });
      toast.success("Таб видалено");
    },
  });

  const openForCreate = () => {
    setIsCreate(true);
    setEditingTabId(null);
    setTabName("");
    setTabCode("");
    setTabIcon("");
    setTabOrder(tabs.length);
    setCodeManuallyEdited(false);
    setAssignedFields([]);
    setShowFieldPicker(false);
    setSheetOpen(true);
  };

  const openForEdit = (tab: TabDefinitionItem) => {
    setIsCreate(false);
    setEditingTabId(tab.id);
    setTabName(tab.name);
    setTabCode(tab.code);
    setTabIcon(tab.icon ?? "");
    setTabOrder(tab.order);
    setCodeManuallyEdited(true);
    setAssignedFields([]);
    setShowFieldPicker(false);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingTabId(null);
    setIsCreate(false);
  };

  const handleSave = async () => {
    const trimmedName = tabName.trim();
    const trimmedCode = tabCode.trim();
    if (!trimmedName || !trimmedCode) {
      toast.error("Вкажіть назву та код табу");
      return;
    }

    setSaving(true);
    try {
      if (isCreate) {
        await createMut.mutateAsync({
          name: trimmedName,
          code: trimmedCode,
          icon: tabIcon.trim() || undefined,
          order: tabOrder,
        });
      } else if (editingTabId) {
        const body: Parameters<typeof updateTabApi>[1] = {
          name: trimmedName,
          icon: tabIcon.trim() || undefined,
          order: tabOrder,
          fields: assignedFields.map((f) => ({
            fieldDefinitionId: f.fieldDefinitionId,
            productTypeId: f.productTypeId || null,
            order: f.order,
            colSpan: f.colSpan,
            isRequired: f.isRequired,
            sectionTitle: f.sectionTitle || null,
          })),
        };
        await updateMut.mutateAsync({ id: editingTabId, body });
      }
      closeSheet();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTabId) return;
    setSaving(true);
    try {
      await deleteMut.mutateAsync(editingTabId);
      closeSheet();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Помилка видалення");
    } finally {
      setSaving(false);
    }
  };

  const addField = (field: FieldDefinitionItem) => {
    setAssignedFields((prev) => [
      ...prev,
      {
        fieldDefinitionId: field.id,
        productTypeId: null,
        order: prev.length,
        colSpan: 1,
        isRequired: false,
        sectionTitle: "",
        fieldDefinition: field,
      },
    ]);
  };

  const removeField = (fieldDefId: string) => {
    setAssignedFields((prev) =>
      prev.filter((f) => f.fieldDefinitionId !== fieldDefId)
    );
  };

  const updateFieldProp = (
    index: number,
    key: "order" | "colSpan" | "isRequired" | "sectionTitle" | "productTypeId",
    value: number | boolean | string | null
  ) => {
    setAssignedFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [key]: value } : f))
    );
  };

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Щоб створювати картки товару, спочатку створіть категорію.
        </p>
        <p className="text-xs text-muted-foreground/80">
          Перейдіть на таб «Категорії» та натисніть «+», щоб додати першу.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Оберіть категорію" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCategoryId && (
          <Button
            variant="outline"
            size="icon"
            aria-label="Додати таб"
            onClick={openForCreate}
            className="shrink-0 size-9"
          >
            <Plus className="size-4" />
          </Button>
        )}
      </div>

      {!selectedCategoryId ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Оберіть категорію для управління табами та полями
        </p>
      ) : tabsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : sortedTabs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Немає табів. Натисніть «+» для створення.
        </p>
      ) : (
        <div className="grid gap-2">
          {sortedTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => openForEdit(tab)}
              className="flex items-center gap-3 rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
            >
              <span className="text-xs tabular-nums text-muted-foreground w-6 text-right shrink-0">
                {tab.order}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{tab.name}</span>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {tab._count?.fields ?? 0} полів
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>{tab.code}</span>
                  {tab.icon && (
                    <>
                      <span>·</span>
                      <span>{tab.icon}</span>
                    </>
                  )}
                </div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={(open) => !open && closeSheet()}>
        <SheetContent
          side="right"
          className={SHEET_CONTENT_CLASS}
          aria-describedby={undefined}
        >
          <SheetHeader className={SHEET_HEADER_CLASS}>
            <SheetTitle className="text-base font-semibold sm:text-lg">
              {isCreate ? "Новий таб" : tabName || "Таб"}
            </SheetTitle>
          </SheetHeader>

          <div className={SHEET_BODY_CLASS}>
            <div className={cn("min-h-0 min-w-0 flex-1 py-1.5", SHEET_SCROLL_CLASS)}>
              <div className={cn("flex flex-col gap-4", SHEET_FORM_PADDING)}>
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="tab-name">Назва</Label>
                    <Input
                      id="tab-name"
                      value={tabName}
                      onChange={(e) => setTabName(e.target.value)}
                      placeholder="Загальні дані"
                      disabled={saving}
                      className={SHEET_INPUT_CLASS}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tab-code">Код</Label>
                    <Input
                      id="tab-code"
                      value={tabCode}
                      onChange={(e) => {
                        setTabCode(e.target.value);
                        if (isCreate) setCodeManuallyEdited(true);
                      }}
                      placeholder="general"
                      disabled={saving || !isCreate}
                      className={SHEET_INPUT_CLASS}
                    />
                    {isCreate && (
                      <p className="text-xs text-muted-foreground">
                        Генерується автоматично з назви
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="tab-icon">Іконка (Lucide)</Label>
                      <Input
                        id="tab-icon"
                        value={tabIcon}
                        onChange={(e) => setTabIcon(e.target.value)}
                        placeholder="truck"
                        disabled={saving}
                        className={SHEET_INPUT_CLASS}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tab-order">Порядок</Label>
                      <Input
                        id="tab-order"
                        type="number"
                        value={tabOrder}
                        onChange={(e) => setTabOrder(Number(e.target.value))}
                        disabled={saving}
                        className={SHEET_INPUT_CLASS}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Призначені поля ({assignedFields.length})
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFieldPicker((v) => !v)}
                        disabled={saving}
                      >
                        <Plus className="mr-1 size-3" />
                        Додати
                      </Button>
                    </div>

                    {!isCreate && tabDetailLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : assignedFields.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">
                        Поля ще не призначені
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {assignedFields.map((f, idx) => (
                          <div
                            key={f.fieldDefinitionId}
                            className="rounded-md border p-2.5 text-sm"
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="min-w-0">
                                <span className="font-medium">
                                  {f.fieldDefinition.label}
                                </span>
                                <span className="ml-2 text-xs text-muted-foreground">
                                  {f.fieldDefinition.code} ·{" "}
                                  {WIDGET_TYPE_LABELS[f.fieldDefinition.widgetType] ?? f.fieldDefinition.widgetType}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() =>
                                  removeField(f.fieldDefinitionId)
                                }
                                disabled={saving}
                              >
                                <X className="size-3.5" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Порядок
                                </Label>
                                <Input
                                  type="number"
                                  value={f.order}
                                  onChange={(e) =>
                                    updateFieldProp(
                                      idx,
                                      "order",
                                      Number(e.target.value)
                                    )
                                  }
                                  className="h-8 text-xs"
                                  disabled={saving}
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  ColSpan
                                </Label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={4}
                                  value={f.colSpan}
                                  onChange={(e) =>
                                    updateFieldProp(
                                      idx,
                                      "colSpan",
                                      Number(e.target.value)
                                    )
                                  }
                                  className="h-8 text-xs"
                                  disabled={saving}
                                />
                              </div>
                              <div className="flex items-end gap-1.5 pb-1">
                                <Checkbox
                                  id={`req-${f.fieldDefinitionId}`}
                                  checked={f.isRequired}
                                  onCheckedChange={(v) =>
                                    updateFieldProp(idx, "isRequired", !!v)
                                  }
                                  disabled={saving}
                                />
                                <Label
                                  htmlFor={`req-${f.fieldDefinitionId}`}
                                  className="text-xs leading-none"
                                >
                                  Обовʼязкове
                                </Label>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Секція
                                </Label>
                                <Input
                                  value={f.sectionTitle}
                                  onChange={(e) =>
                                    updateFieldProp(
                                      idx,
                                      "sectionTitle",
                                      e.target.value
                                    )
                                  }
                                  placeholder="--"
                                  className="h-8 text-xs"
                                  disabled={saving}
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Тип авто
                                </Label>
                                <Select
                                  value={f.productTypeId ?? "__all__"}
                                  onValueChange={(v) =>
                                    updateFieldProp(
                                      idx,
                                      "productTypeId",
                                      v === "__all__" ? null : v
                                    )
                                  }
                                  disabled={saving}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__all__">Усі типи</SelectItem>
                                    {typesForCategory.map((vt) => (
                                      <SelectItem key={vt.id} value={vt.id}>
                                        {vt.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {showFieldPicker && (
                      <>
                        <Separator />
                        <Label className="text-sm font-medium">
                          Доступні поля ({unassignedFields.length})
                        </Label>
                        {unassignedFields.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            Усі поля вже призначені
                          </p>
                        ) : (
                          <div className={cn("flex flex-col gap-1 max-h-48 rounded-md border p-2", SHEET_SCROLL_CLASS)}>
                            {unassignedFields.map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted/50"
                                onClick={() => addField(f)}
                                disabled={saving}
                              >
                                <Plus className="size-3 shrink-0 text-muted-foreground" />
                                <span className="font-medium">{f.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {f.code} · {WIDGET_TYPE_LABELS[f.widgetType] ?? f.widgetType}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className={SHEET_FOOTER_CLASS}>
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <div>
                {!isCreate && editingTabId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDeleteTabDialogOpen(true)}
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

      <AlertDialog open={deleteTabDialogOpen} onOpenChange={setDeleteTabDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити таб?</AlertDialogTitle>
            <AlertDialogDescription>
              Буде видалено також усі призначені до нього поля. Цю дію не можна скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                setDeleteTabDialogOpen(false);
                handleDelete();
              }}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving && deleteMut.isPending ? "Видалення…" : "Видалити"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

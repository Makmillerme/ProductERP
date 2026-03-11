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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SHEET_CONTENT_CLASS, SHEET_INPUT_CLASS, SHEET_HEADER_CLASS, SHEET_BODY_CLASS, SHEET_BODY_SCROLL_CLASS, SHEET_FOOTER_CLASS, SHEET_FORM_GAP, SHEET_FORM_PADDING, SHEET_FIELD_GAP } from "@/config/sheet";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/slugify";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import { DeleteVehicleTypeDialog } from "./delete-vehicle-type-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Loader2,
  ChevronRight,
  FolderOpen,
  Folder,
  MoreHorizontal,
  Pencil,
  Trash2,
  CornerDownRight,
} from "lucide-react";
import { toast } from "sonner";
import { MANAGEMENT_STALE_MS } from "@/lib/query-keys";
import type { CategoryItem, VehicleTypeItem } from "./types";

const CATEGORIES_KEY = ["admin", "categories"] as const;
const VEHICLE_TYPES_KEY = ["admin", "vehicle-types"] as const;

// ── API helpers ──────────────────────────────────────────────

async function fetchCategories(): Promise<CategoryItem[]> {
  const res = await fetch("/api/admin/categories");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Помилка завантаження категорій");
  }
  const data = await res.json();
  return data.categories ?? data ?? [];
}

async function createCategory(body: {
  name: string;
  code: string;
  description?: string | null;
  icon?: string | null;
  order?: number;
}) {
  const res = await fetch("/api/admin/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Помилка створення категорії");
  return data;
}

async function updateCategory(
  id: string,
  body: {
    name?: string;
    code?: string;
    description?: string | null;
    icon?: string | null;
    order?: number;
  }
) {
  const res = await fetch(`/api/admin/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Помилка збереження категорії");
  return data;
}

async function deleteCategory(id: string) {
  const res = await fetch(`/api/admin/categories/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Помилка видалення категорії");
  }
}

async function fetchVehicleTypes(): Promise<VehicleTypeItem[]> {
  const res = await fetch("/api/admin/vehicle-types");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Помилка завантаження типів");
  }
  const data = await res.json();
  return data.vehicleTypes ?? data ?? [];
}

async function createVehicleType(body: {
  name: string;
  code: string;
  description?: string | null;
  categoryId?: string | null;
}) {
  const res = await fetch("/api/admin/vehicle-types", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Помилка створення типу");
  return data;
}

async function updateVehicleType(
  id: string,
  body: {
    name?: string;
    code?: string;
    description?: string | null;
    categoryId?: string | null;
  }
) {
  const res = await fetch(`/api/admin/vehicle-types/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Помилка збереження типу");
  return data;
}

async function deleteVehicleType(id: string) {
  const res = await fetch(`/api/admin/vehicle-types/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Помилка видалення типу");
  }
}

// ── Types ────────────────────────────────────────────────────

type TreeCategory = CategoryItem & { types: VehicleTypeItem[] };

// ── Component ────────────────────────────────────────────────

export function CategoriesManagement() {
  const queryClient = useQueryClient();
  const [hasMounted, setHasMounted] = useState(false);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Category sheet state
  const [catSheetOpen, setCatSheetOpen] = useState(false);
  const [catIsCreate, setCatIsCreate] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [catName, setCatName] = useState("");
  const [catCode, setCatCode] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [catIcon, setCatIcon] = useState("");
  const [catOrder, setCatOrder] = useState(0);
  const [catCodeManuallyEdited, setCatCodeManuallyEdited] = useState(false);
  const [catSaving, setCatSaving] = useState(false);

  // VehicleType sheet state
  const [vtSheetOpen, setVtSheetOpen] = useState(false);
  const [vtIsCreate, setVtIsCreate] = useState(false);
  const [vtSelected, setVtSelected] = useState<VehicleTypeItem | null>(null);
  const [vtParentCategoryId, setVtParentCategoryId] = useState<string | null>(null);
  const [vtName, setVtName] = useState("");
  const [vtCode, setVtCode] = useState("");
  const [vtDescription, setVtDescription] = useState("");
  const [vtCodeManuallyEdited, setVtCodeManuallyEdited] = useState(false);
  const [vtSaving, setVtSaving] = useState(false);

  // Delete vehicle type confirmation
  const [pendingDeleteVt, setPendingDeleteVt] = useState<{
    id: string;
    name: string;
    vehiclesCount: number;
    closeSheetAfter?: boolean;
  } | null>(null);

  // Delete category confirmation
  const [pendingDeleteCat, setPendingDeleteCat] = useState<{
    id: string;
    name: string;
    typesCount: number;
    closeSheetAfter?: boolean;
  } | null>(null);

  // ── Queries ──

  const {
    data: categories = [],
    isLoading: catLoading,
    isError: catIsError,
    error: catError,
  } = useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: fetchCategories,
    staleTime: MANAGEMENT_STALE_MS,
  });

  const { data: allVehicleTypes = [] } = useQuery({
    queryKey: VEHICLE_TYPES_KEY,
    queryFn: fetchVehicleTypes,
    staleTime: MANAGEMENT_STALE_MS,
  });

  // ── Tree data ──

  const treeData = useMemo<TreeCategory[]>(() => {
    const sorted = [...categories].sort((a, b) => a.order - b.order);
    return sorted.map((cat) => ({
      ...cat,
      types: allVehicleTypes.filter((vt) => vt.categoryId === cat.id),
    }));
  }, [categories, allVehicleTypes]);

  const filteredTree = useMemo(() => {
    if (!search.trim()) return treeData;
    const q = search.trim().toLowerCase();
    return treeData.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.types.some(
          (t) => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q)
        )
    );
  }, [treeData, search]);

  const toggleOpen = useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSearch(searchInput.trim());
    },
    [searchInput]
  );

  // ── Mutations ──

  const createCatMut = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Категорію створено");
    },
  });

  const updateCatMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateCategory>[1] }) =>
      updateCategory(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Категорію збережено");
    },
  });

  const deleteCatMut = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      queryClient.invalidateQueries({ queryKey: VEHICLE_TYPES_KEY });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Категорію видалено");
    },
  });

  const createVtMut = useMutation({
    mutationFn: createVehicleType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICLE_TYPES_KEY });
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Тип товару створено");
    },
  });

  const updateVtMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateVehicleType>[1] }) =>
      updateVehicleType(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICLE_TYPES_KEY });
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Тип товару збережено");
    },
  });

  const deleteVtMut = useMutation({
    mutationFn: deleteVehicleType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICLE_TYPES_KEY });
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Тип товару видалено");
    },
  });

  // ── Effects ──

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (catIsCreate && !catCodeManuallyEdited) setCatCode(slugify(catName));
  }, [catName, catIsCreate, catCodeManuallyEdited]);

  useEffect(() => {
    if (vtIsCreate && !vtCodeManuallyEdited) setVtCode(slugify(vtName));
  }, [vtName, vtIsCreate, vtCodeManuallyEdited]);

  // ── Category sheet handlers ──

  const openCatCreate = () => {
    setCatIsCreate(true);
    setEditingCategory(null);
    setCatName("");
    setCatCode("");
    setCatDescription("");
    setCatIcon("");
    setCatOrder(categories.length);
    setCatCodeManuallyEdited(false);
    setCatSheetOpen(true);
  };

  const openCatEdit = (cat: CategoryItem) => {
    setCatIsCreate(false);
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatCode(cat.code);
    setCatDescription(cat.description ?? "");
    setCatIcon(cat.icon ?? "");
    setCatOrder(cat.order);
    setCatCodeManuallyEdited(true);
    setCatSheetOpen(true);
  };

  const closeCatSheet = () => {
    setCatSheetOpen(false);
    setEditingCategory(null);
    setCatIsCreate(false);
  };

  const handleCatSave = async () => {
    const trimmedName = catName.trim();
    const trimmedCode = catCode.trim();
    if (!trimmedName || !trimmedCode) {
      toast.error("Вкажіть назву та код категорії");
      return;
    }
    setCatSaving(true);
    try {
      if (catIsCreate) {
        await createCatMut.mutateAsync({
          name: trimmedName,
          code: trimmedCode,
          description: catDescription.trim() || null,
          icon: catIcon.trim() || null,
          order: catOrder,
        });
      } else if (editingCategory) {
        await updateCatMut.mutateAsync({
          id: editingCategory.id,
          body: {
            name: trimmedName,
            code: trimmedCode,
            description: catDescription.trim() || null,
            icon: catIcon.trim() || null,
            order: catOrder,
          },
        });
      }
      closeCatSheet();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Помилка збереження");
    } finally {
      setCatSaving(false);
    }
  };

  const requestDeleteCategory = useCallback(
    (cat: { id: string; name: string }, typesCount: number, closeSheetAfter?: boolean) => {
      setPendingDeleteCat({ id: cat.id, name: cat.name, typesCount, closeSheetAfter });
    },
    []
  );

  const handleCatDelete = () => {
    if (!editingCategory) return;
    const typesCount = treeData.find((c) => c.id === editingCategory.id)?.types.length ?? 0;
    requestDeleteCategory(editingCategory, typesCount, true);
  };

  const requestDeleteVehicleType = useCallback(
    (vt: VehicleTypeItem, closeSheetAfter?: boolean) => {
      setPendingDeleteVt({
        id: vt.id,
        name: vt.name,
        vehiclesCount: vt._count?.products ?? 0,
        closeSheetAfter,
      });
    },
    []
  );

  // ── VehicleType sheet handlers ──

  const openVtCreate = (categoryId: string) => {
    setVtIsCreate(true);
    setVtSelected(null);
    setVtParentCategoryId(categoryId);
    setVtName("");
    setVtCode("");
    setVtDescription("");
    setVtCodeManuallyEdited(false);
    setVtSheetOpen(true);
    setOpenIds((prev) => new Set(prev).add(categoryId));
  };

  const openVtEdit = (vt: VehicleTypeItem) => {
    setVtIsCreate(false);
    setVtSelected(vt);
    setVtParentCategoryId(vt.categoryId);
    setVtName(vt.name);
    setVtCode(vt.code);
    setVtDescription(vt.description ?? "");
    setVtCodeManuallyEdited(true);
    setVtSheetOpen(true);
  };

  const closeVtSheet = () => {
    setVtSheetOpen(false);
    setVtSelected(null);
    setVtIsCreate(false);
  };

  const handleVtSave = async () => {
    const trimmedName = vtName.trim();
    const trimmedCode = vtCode.trim();
    if (!trimmedName || !trimmedCode) {
      toast.error("Вкажіть назву та код типу товару");
      return;
    }
    setVtSaving(true);
    try {
      if (vtIsCreate) {
        await createVtMut.mutateAsync({
          name: trimmedName,
          code: trimmedCode,
          description: vtDescription.trim() || null,
          categoryId: vtParentCategoryId,
        });
      } else if (vtSelected) {
        await updateVtMut.mutateAsync({
          id: vtSelected.id,
          body: {
            name: trimmedName,
            code: trimmedCode,
            description: vtDescription.trim() || null,
          },
        });
      }
      closeVtSheet();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Помилка збереження");
    } finally {
      setVtSaving(false);
    }
  };

  const handleVtDelete = () => {
    if (!vtSelected) return;
    requestDeleteVehicleType(vtSelected, true);
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Search + Add Category */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        <form onSubmit={handleSearchSubmit} className="relative min-w-0 flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Пошук категорій та типів…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 pl-9 bg-background"
          />
        </form>
        <Button
          variant="outline"
          size="icon"
          aria-label="Додати категорію"
          onClick={openCatCreate}
          className="shrink-0 size-9"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {catIsError && (
        <p className="text-sm text-destructive">
          {catError instanceof Error ? catError.message : "Помилка завантаження"}
        </p>
      )}

      {/* Tree */}
      {!hasMounted || catLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTree.length === 0 ? (
        <div className="flex min-h-[10rem] w-full flex-col items-center justify-center gap-2 rounded-md border py-10 text-center">
          <p className="text-sm text-muted-foreground px-4">
            {categories.length === 0
              ? "Ще немає категорій. Натисніть «+», щоб додати першу."
              : "За пошуком нічого не знайдено."}
          </p>
        </div>
      ) : (
        <div className="rounded-md border divide-y p-2">
          {filteredTree.map((cat) => {
            const isOpen = openIds.has(cat.id);
            return (
              <Collapsible
                key={cat.id}
                open={isOpen}
                onOpenChange={() => toggleOpen(cat.id)}
              >
                {/* ── Category row ── */}
                <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/50 transition-colors">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm p-0.5"
                      aria-label={isOpen ? "Згорнути" : "Розгорнути"}
                    >
                      <ChevronRight
                        className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          isOpen ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                  </CollapsibleTrigger>

                  {isOpen ? (
                    <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <Folder className="size-4 shrink-0 text-muted-foreground" />
                  )}

                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left rounded-sm p-0.5 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => openCatEdit(cat)}
                  >
                    <span className="font-medium text-sm truncate">{cat.name}</span>
                    <Badge variant="secondary" className="text-xs font-normal shrink-0">
                      {cat.code}
                    </Badge>
                    {cat.description && (
                      <span className="text-xs text-muted-foreground truncate hidden md:inline">
                        {cat.description}
                      </span>
                    )}
                  </button>

                  <span className="text-xs text-muted-foreground tabular-nums shrink-0 hidden sm:inline">
                    {cat.types.length} типів
                  </span>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative z-10 size-7 shrink-0"
                    aria-label="Додати тип товару"
                    onClick={() => openVtCreate(cat.id)}
                  >
                    <Plus className="size-3.5" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative z-10 size-7 shrink-0">
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => openCatEdit(cat)}>
                        <Pencil className="mr-2 size-3.5" />
                        Редагувати
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openVtCreate(cat.id)}>
                        <Plus className="mr-2 size-3.5" />
                        Додати тип
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => requestDeleteCategory(cat, cat.types.length)}
                      >
                        <Trash2 className="mr-2 size-3.5" />
                        Видалити
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* ── Child vehicle types ── */}
                <CollapsibleContent>
                  <div className="divide-y border-t bg-muted/20">
                    {cat.types.length === 0 ? (
                      <div className="flex items-center gap-2 py-3 pl-12 pr-3">
                        <CornerDownRight className="size-3.5 shrink-0 text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground">
                          Немає типів товару.{" "}
                          <button
                            type="button"
                            className="underline hover:text-foreground"
                            onClick={() => openVtCreate(cat.id)}
                          >
                            Додати
                          </button>
                        </span>
                      </div>
                    ) : (
                      cat.types.map((vt) => (
                        <div
                          key={vt.id}
                          className="flex items-center gap-2 py-2 pl-12 pr-3 hover:bg-muted/50 transition-colors"
                        >
                          <CornerDownRight className="size-3.5 shrink-0 text-muted-foreground/40" />

                          <button
                            type="button"
                            className="flex min-w-0 flex-1 items-center gap-2.5 text-left rounded-sm p-0.5 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => openVtEdit(vt)}
                          >
                            <span className="text-sm truncate">{vt.name}</span>
                            <Badge variant="outline" className="text-xs font-normal shrink-0">
                              {vt.code}
                            </Badge>
                            {vt.isAutoDetected && (
                              <Badge variant="secondary" className="text-xs font-normal shrink-0">
                                Автодетект
                              </Badge>
                            )}
                          </button>

                          <span className="text-xs text-muted-foreground tabular-nums shrink-0 hidden sm:inline">
                            {vt._count?.products ?? 0} од.
                          </span>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-7 shrink-0">
                                <MoreHorizontal className="size-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => openVtEdit(vt)}>
                                <Pencil className="mr-2 size-3.5" />
                                Редагувати
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => requestDeleteVehicleType(vt)}
                              >
                                <Trash2 className="mr-2 size-3.5" />
                                Видалити
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* ── Category Sheet ── */}
      <Sheet open={catSheetOpen} onOpenChange={(open) => !open && closeCatSheet()}>
        <SheetContent
          side="right"
          className={SHEET_CONTENT_CLASS}
          aria-describedby={undefined}
        >
          <SheetHeader className={SHEET_HEADER_CLASS}>
            <SheetTitle className="text-base font-semibold sm:text-lg">
              {catIsCreate ? "Нова категорія" : (editingCategory?.name ?? "Категорія")}
            </SheetTitle>
          </SheetHeader>

          <div className={SHEET_BODY_CLASS}>
            <div className={SHEET_BODY_SCROLL_CLASS}>
              <div className={cn("grid", SHEET_FORM_GAP, SHEET_FORM_PADDING)}>
                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="cat-name">Назва</Label>
                  <Input
                    id="cat-name"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="Наприклад: Вантажні авто"
                    disabled={catSaving}
                    className={SHEET_INPUT_CLASS}
                  />
                </div>
                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="cat-code">Код</Label>
                  <Input
                    id="cat-code"
                    value={catCode}
                    onChange={(e) => {
                      setCatCode(e.target.value);
                      if (catIsCreate) setCatCodeManuallyEdited(true);
                    }}
                    placeholder="Наприклад: trucks"
                    disabled={catSaving}
                    className={SHEET_INPUT_CLASS}
                  />
                  {catIsCreate && (
                    <p className="text-xs text-muted-foreground">
                      Генерується автоматично з назви
                    </p>
                  )}
                </div>
                <div className={cn("grid grid-cols-2", SHEET_FORM_GAP)}>
                  <div className={cn("grid", SHEET_FIELD_GAP)}>
                    <Label htmlFor="cat-icon">Іконка (Lucide)</Label>
                    <Input
                      id="cat-icon"
                      value={catIcon}
                      onChange={(e) => setCatIcon(e.target.value)}
                      placeholder="truck"
                      disabled={catSaving}
                      className={SHEET_INPUT_CLASS}
                    />
                  </div>
                  <div className={cn("grid", SHEET_FIELD_GAP)}>
                    <Label htmlFor="cat-order">Порядок</Label>
                    <Input
                      id="cat-order"
                      type="number"
                      value={catOrder}
                      onChange={(e) => setCatOrder(Number(e.target.value))}
                      disabled={catSaving}
                      className={SHEET_INPUT_CLASS}
                    />
                  </div>
                </div>
                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="cat-desc">Опис (необовʼязково)</Label>
                  <Textarea
                    id="cat-desc"
                    value={catDescription}
                    onChange={(e) => setCatDescription(e.target.value)}
                    placeholder="Короткий опис категорії"
                    disabled={catSaving}
                    rows={3}
                    className={SHEET_INPUT_CLASS}
                  />
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className={SHEET_FOOTER_CLASS}>
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <div>
                {!catIsCreate && editingCategory && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCatDelete}
                    disabled={catSaving}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  >
                    {catSaving && deleteCatMut.isPending && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Видалити
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={closeCatSheet} disabled={catSaving}>
                  Скасувати
                </Button>
                <Button onClick={handleCatSave} disabled={catSaving}>
                  {catSaving && !deleteCatMut.isPending && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {catIsCreate ? "Створити" : "Зберегти"}
                </Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── VehicleType Sheet ── */}
      <Sheet open={vtSheetOpen} onOpenChange={(open) => !open && closeVtSheet()}>
        <SheetContent
          side="right"
          className={SHEET_CONTENT_CLASS}
          aria-describedby={undefined}
        >
          <SheetHeader className={SHEET_HEADER_CLASS}>
            <SheetTitle className="text-base font-semibold sm:text-lg">
              {vtIsCreate ? "Новий тип товару" : (vtSelected?.name ?? "Тип товару")}
            </SheetTitle>
          </SheetHeader>

          <div className={SHEET_BODY_CLASS}>
            <div className={SHEET_BODY_SCROLL_CLASS}>
              <div className={cn("grid", SHEET_FORM_GAP, SHEET_FORM_PADDING)}>
                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="vt-name">Назва</Label>
                  <Input
                    id="vt-name"
                    value={vtName}
                    onChange={(e) => setVtName(e.target.value)}
                    placeholder="Наприклад: Тягач, Піддон"
                    disabled={vtSaving}
                    className={SHEET_INPUT_CLASS}
                  />
                </div>
                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="vt-code">Код</Label>
                  <Input
                    id="vt-code"
                    value={vtCode}
                    onChange={(e) => {
                      setVtCode(e.target.value);
                      if (vtIsCreate) setVtCodeManuallyEdited(true);
                    }}
                    placeholder="Наприклад: tyagach"
                    disabled={vtSaving}
                    className={SHEET_INPUT_CLASS}
                  />
                  {vtIsCreate && (
                    <p className="text-xs text-muted-foreground">
                      Генерується автоматично з назви
                    </p>
                  )}
                </div>
                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="vt-desc">Опис (необовʼязково)</Label>
                  <Textarea
                    id="vt-desc"
                    value={vtDescription}
                    onChange={(e) => setVtDescription(e.target.value)}
                    placeholder="Короткий опис типу товару"
                    disabled={vtSaving}
                    rows={3}
                    className={SHEET_INPUT_CLASS}
                  />
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className={SHEET_FOOTER_CLASS}>
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <div>
                {!vtIsCreate && vtSelected && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleVtDelete}
                    disabled={vtSaving}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  >
                    {vtSaving && deleteVtMut.isPending && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Видалити
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={closeVtSheet} disabled={vtSaving}>
                  Скасувати
                </Button>
                <Button onClick={handleVtSave} disabled={vtSaving}>
                  {vtSaving && !deleteVtMut.isPending && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {vtIsCreate ? "Створити" : "Зберегти"}
                </Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DeleteCategoryDialog
        open={pendingDeleteCat !== null}
        onOpenChange={(open) => !open && setPendingDeleteCat(null)}
        category={pendingDeleteCat ? { id: pendingDeleteCat.id, name: pendingDeleteCat.name, typesCount: pendingDeleteCat.typesCount } : null}
        onSuccess={() => {
          if (pendingDeleteCat?.closeSheetAfter) closeCatSheet();
        }}
        onDelete={(id) => deleteCatMut.mutateAsync(id)}
      />
      <DeleteVehicleTypeDialog
        open={pendingDeleteVt !== null}
        onOpenChange={(open) => !open && setPendingDeleteVt(null)}
        vehicleType={
          pendingDeleteVt
            ? {
                id: pendingDeleteVt.id,
                name: pendingDeleteVt.name,
                vehiclesCount: pendingDeleteVt.vehiclesCount,
              }
            : null
        }
        onSuccess={() => {
          if (pendingDeleteVt?.closeSheetAfter) closeVtSheet();
        }}
        onDelete={(id) => deleteVtMut.mutateAsync(id)}
      />
    </div>
  );
}

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
import { DeleteCategoryDialog } from "./delete-category-dialog";
import { DeleteProductTypeDialog } from "./delete-product-type-dialog";
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
import { useLocale } from "@/lib/locale-provider";
import { MANAGEMENT_STALE_MS, managementAdminKeys } from "@/lib/query-keys";
import { fetchAdminCategories, fetchAdminProductTypes } from "@/lib/api/admin/catalog";
import { adminMutationJson, adminDeleteAllowMissing } from "@/lib/api/admin/client";
import { ManagementListLoading } from "@/components/management-list-states";
import type { CategoryItem, ProductTypeItem } from "./types";

// ── API helpers ──────────────────────────────────────────────

type TFn = (key: string) => string;

async function fetchCategories(t: TFn): Promise<CategoryItem[]> {
  return fetchAdminCategories(t) as Promise<CategoryItem[]>;
}

async function createCategory(
  body: {
    name: string;
    description?: string | null;
    icon?: string | null;
    order?: number;
  },
  t: TFn
) {
  return adminMutationJson("/categories", {
    method: "POST",
    body,
    fallbackError: t("productsConfig.categoriesConfig.createCategoryFailed"),
  });
}

async function updateCategory(
  id: string,
  body: {
    name?: string;
    description?: string | null;
    icon?: string | null;
    order?: number;
  },
  t: TFn
) {
  return adminMutationJson(`/categories/${id}`, {
    method: "PATCH",
    body,
    fallbackError: t("productsConfig.categoriesConfig.saveCategoryFailed"),
  });
}

async function deleteCategory(id: string, t: TFn) {
  await adminDeleteAllowMissing(
    `/categories/${id}`,
    t("productsConfig.categoriesConfig.deleteCategoryFailed")
  );
}

async function fetchProductTypes(t: TFn): Promise<ProductTypeItem[]> {
  return fetchAdminProductTypes(t) as Promise<ProductTypeItem[]>;
}

async function createProductType(
  body: {
    name: string;
    description?: string | null;
    categoryId?: string | null;
  },
  t: TFn
) {
  return adminMutationJson("/product-types", {
    method: "POST",
    body,
    fallbackError: t("productsConfig.categoriesConfig.createTypeFailed"),
  });
}

async function updateProductType(
  id: string,
  body: {
    name?: string;
    description?: string | null;
    categoryId?: string | null;
  },
  t: TFn
) {
  return adminMutationJson(`/product-types/${id}`, {
    method: "PATCH",
    body,
    fallbackError: t("productsConfig.categoriesConfig.saveTypeFailed"),
  });
}

async function deleteProductType(id: string, t: TFn) {
  await adminDeleteAllowMissing(
    `/product-types/${id}`,
    t("productsConfig.categoriesConfig.deleteTypeFailed")
  );
}

// ── Types ────────────────────────────────────────────────────

type TreeCategory = CategoryItem & { types: ProductTypeItem[] };

// ── Component ────────────────────────────────────────────────

export function CategoriesManagement() {
  const { t } = useLocale();
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
  const [catDescription, setCatDescription] = useState("");
  const [catIcon, setCatIcon] = useState("");
  const [catOrder, setCatOrder] = useState(0);
  const [catSaving, setCatSaving] = useState(false);

  // ProductType sheet state
  const [vtSheetOpen, setVtSheetOpen] = useState(false);
  const [vtIsCreate, setVtIsCreate] = useState(false);
  const [vtSelected, setVtSelected] = useState<ProductTypeItem | null>(null);
  const [vtParentCategoryId, setVtParentCategoryId] = useState<string | null>(null);
  const [vtName, setVtName] = useState("");
  const [vtDescription, setVtDescription] = useState("");
  const [vtSaving, setVtSaving] = useState(false);

  // Delete product type confirmation
  const [pendingDeleteVt, setPendingDeleteVt] = useState<{
    id: string;
    name: string;
    productsCount: number;
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
    queryKey: managementAdminKeys.categories,
    queryFn: () => fetchCategories(t),
    staleTime: MANAGEMENT_STALE_MS,
  });

  const { data: allProductTypes = [] } = useQuery({
    queryKey: managementAdminKeys.productTypes,
    queryFn: () => fetchProductTypes(t),
    staleTime: MANAGEMENT_STALE_MS,
  });

  // ── Tree data ──

  const treeData = useMemo<TreeCategory[]>(() => {
    const sorted = [...categories].sort((a, b) => a.order - b.order);
    return sorted.map((cat) => ({
      ...cat,
      types: allProductTypes.filter((vt) => vt.categoryId === cat.id),
    }));
  }, [categories, allProductTypes]);

  const filteredTree = useMemo(() => {
    if (!search.trim()) return treeData;
    const q = search.trim().toLowerCase();
    return treeData.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.types.some((t) => t.name.toLowerCase().includes(q))
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
    mutationFn: (body: Parameters<typeof createCategory>[0]) => createCategory(body, t),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: managementAdminKeys.categories });
      const prev = queryClient.getQueryData<CategoryItem[]>(managementAdminKeys.categories);
      if (!prev) return { prev: undefined, optimisticId: "" };
      const optimisticId = `optimistic-cat-${Date.now()}`;
      const optimistic: CategoryItem = {
        id: optimisticId,
        name: body.name.trim(),
        description: body.description?.trim() ?? null,
        icon: body.icon?.trim() ?? null,
        order: body.order ?? 0,
        _count: { productTypes: 0, tabs: 1 },
      };
      queryClient.setQueryData(
        managementAdminKeys.categories,
        [...prev, optimistic].sort((a, b) => a.order - b.order)
      );
      return { prev, optimisticId };
    },
    onError: (_e, _b, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(managementAdminKeys.categories, ctx.prev);
    },
    onSuccess: (data, _body, ctx) => {
      const row = data as CategoryItem;
      const list = queryClient.getQueryData<CategoryItem[]>(managementAdminKeys.categories);
      if (list && ctx?.optimisticId) {
        queryClient.setQueryData(
          managementAdminKeys.categories,
          list.map((c) =>
            c.id === ctx.optimisticId
              ? { ...row, _count: { productTypes: 0, tabs: 1 } }
              : c
          )
        );
      } else {
        void queryClient.invalidateQueries({ queryKey: managementAdminKeys.categories });
      }
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(t("toasts.categoryCreated"));
    },
  });

  const updateCatMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateCategory>[1] }) =>
      updateCategory(id, body, t),
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: managementAdminKeys.categories });
      const prev = queryClient.getQueryData<CategoryItem[]>(managementAdminKeys.categories);
      if (!prev) return { prev: undefined };
      queryClient.setQueryData(
        managementAdminKeys.categories,
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                ...(body.name !== undefined && { name: body.name }),
                ...(body.description !== undefined && { description: body.description }),
                ...(body.icon !== undefined && { icon: body.icon }),
                ...(body.order !== undefined && { order: body.order }),
              }
            : c
        )
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(managementAdminKeys.categories, ctx.prev);
    },
    onSuccess: (data, { id }) => {
      const row = data as CategoryItem;
      const list = queryClient.getQueryData<CategoryItem[]>(managementAdminKeys.categories);
      if (list) {
        queryClient.setQueryData(
          managementAdminKeys.categories,
          list.map((c) => (c.id === id ? { ...c, ...row, _count: c._count } : c))
        );
      }
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(t("toasts.categorySaved"));
    },
  });

  const deleteCatMut = useMutation({
    mutationFn: (id: string) => deleteCategory(id, t),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: managementAdminKeys.categories });
      await queryClient.cancelQueries({ queryKey: managementAdminKeys.productTypes });
      const prevCats = queryClient.getQueryData<CategoryItem[]>(managementAdminKeys.categories);
      const prevTypes = queryClient.getQueryData<ProductTypeItem[]>(managementAdminKeys.productTypes);
      if (!prevCats) return { prevCats: undefined, prevTypes: undefined };
      queryClient.setQueryData(
        managementAdminKeys.categories,
        prevCats.filter((c) => c.id !== id)
      );
      if (prevTypes) {
        queryClient.setQueryData(
          managementAdminKeys.productTypes,
          prevTypes.filter((vt) => vt.categoryId !== id)
        );
      }
      return { prevCats, prevTypes };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prevCats) queryClient.setQueryData(managementAdminKeys.categories, ctx.prevCats);
      if (ctx?.prevTypes) queryClient.setQueryData(managementAdminKeys.productTypes, ctx.prevTypes);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(t("toasts.categoryDeleted"));
    },
  });

  const createVtMut = useMutation({
    mutationFn: (body: Parameters<typeof createProductType>[0]) => createProductType(body, t),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: managementAdminKeys.productTypes });
      await queryClient.cancelQueries({ queryKey: managementAdminKeys.categories });
      const prevTypes = queryClient.getQueryData<ProductTypeItem[]>(managementAdminKeys.productTypes);
      const prevCats = queryClient.getQueryData<CategoryItem[]>(managementAdminKeys.categories);
      if (!prevTypes) return { prevTypes: undefined, prevCats: undefined, optimisticId: "", catId: null };
      const optimisticId = `optimistic-vt-${Date.now()}`;
      const catId = body.categoryId ?? null;
      const optimistic: ProductTypeItem = {
        id: optimisticId,
        categoryId: catId,
        name: body.name.trim(),
        description: body.description?.trim() ?? null,
        isAutoDetected: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { products: 0 },
      };
      queryClient.setQueryData(managementAdminKeys.productTypes, [...prevTypes, optimistic]);
      if (prevCats && catId) {
        queryClient.setQueryData(
          managementAdminKeys.categories,
          prevCats.map((c) =>
            c.id === catId
              ? {
                  ...c,
                  _count: {
                    productTypes: (c._count?.productTypes ?? 0) + 1,
                    tabs: c._count?.tabs ?? 0,
                  },
                }
              : c
          )
        );
      }
      return { prevTypes, prevCats, optimisticId, catId };
    },
    onError: (_e, _b, ctx) => {
      if (ctx?.prevTypes) queryClient.setQueryData(managementAdminKeys.productTypes, ctx.prevTypes);
      if (ctx?.prevCats) queryClient.setQueryData(managementAdminKeys.categories, ctx.prevCats);
    },
    onSuccess: (data, _body, ctx) => {
      const row = data as ProductTypeItem;
      const types = queryClient.getQueryData<ProductTypeItem[]>(managementAdminKeys.productTypes);
      if (types && ctx?.optimisticId) {
        queryClient.setQueryData(
          managementAdminKeys.productTypes,
          types.map((vt) => (vt.id === ctx.optimisticId ? row : vt))
        );
      } else {
        void queryClient.invalidateQueries({ queryKey: managementAdminKeys.productTypes });
      }
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(t("toasts.productTypeCreated"));
    },
  });

  const updateVtMut = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof updateProductType>[1];
    }) => updateProductType(id, body, t),
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: managementAdminKeys.productTypes });
      const prevTypes = queryClient.getQueryData<ProductTypeItem[]>(managementAdminKeys.productTypes);
      if (!prevTypes) return { prevTypes: undefined };
      queryClient.setQueryData(
        managementAdminKeys.productTypes,
        prevTypes.map((vt) =>
          vt.id === id
            ? {
                ...vt,
                ...(body.name !== undefined && { name: body.name }),
                ...(body.description !== undefined && { description: body.description }),
                ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
              }
            : vt
        )
      );
      return { prevTypes };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevTypes) queryClient.setQueryData(managementAdminKeys.productTypes, ctx.prevTypes);
    },
    onSuccess: (data, { id }) => {
      const row = data as ProductTypeItem;
      const types = queryClient.getQueryData<ProductTypeItem[]>(managementAdminKeys.productTypes);
      if (types) {
        queryClient.setQueryData(
          managementAdminKeys.productTypes,
          types.map((vt) => (vt.id === id ? { ...vt, ...row } : vt))
        );
      }
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(t("toasts.productTypeSaved"));
    },
  });

  const deleteVtMut = useMutation({
    mutationFn: (id: string) => deleteProductType(id, t),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: managementAdminKeys.productTypes });
      await queryClient.cancelQueries({ queryKey: managementAdminKeys.categories });
      const prevTypes = queryClient.getQueryData<ProductTypeItem[]>(managementAdminKeys.productTypes);
      const prevCats = queryClient.getQueryData<CategoryItem[]>(managementAdminKeys.categories);
      const removed = prevTypes?.find((vt) => vt.id === id);
      if (prevTypes) {
        queryClient.setQueryData(
          managementAdminKeys.productTypes,
          prevTypes.filter((vt) => vt.id !== id)
        );
      }
      if (prevCats && removed?.categoryId) {
        const cid = removed.categoryId;
        queryClient.setQueryData(
          managementAdminKeys.categories,
          prevCats.map((c) =>
            c.id === cid
              ? {
                  ...c,
                  _count: {
                    productTypes: Math.max(0, (c._count?.productTypes ?? 0) - 1),
                    tabs: c._count?.tabs ?? 0,
                  },
                }
              : c
          )
        );
      }
      return { prevTypes, prevCats };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prevTypes) queryClient.setQueryData(managementAdminKeys.productTypes, ctx.prevTypes);
      if (ctx?.prevCats) queryClient.setQueryData(managementAdminKeys.categories, ctx.prevCats);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(t("toasts.productTypeDeleted"));
    },
  });

  // ── Effects ──

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // ── Category sheet handlers ──

  const openCatCreate = () => {
    setCatIsCreate(true);
    setEditingCategory(null);
    setCatName("");
    setCatDescription("");
    setCatIcon("");
    setCatOrder(categories.length);
    setCatSheetOpen(true);
  };

  const openCatEdit = (cat: CategoryItem) => {
    setCatIsCreate(false);
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDescription(cat.description ?? "");
    setCatIcon(cat.icon ?? "");
    setCatOrder(cat.order);
    setCatSheetOpen(true);
  };

  const closeCatSheet = () => {
    setCatSheetOpen(false);
    setEditingCategory(null);
    setCatIsCreate(false);
  };

  const handleCatSave = async () => {
    const trimmedName = catName.trim();
    if (!trimmedName) {
      toast.error(t("validationRequired.categoryName"));
      return;
    }
    setCatSaving(true);
    try {
      if (catIsCreate) {
        await createCatMut.mutateAsync({
          name: trimmedName,
          description: catDescription.trim() || null,
          icon: catIcon.trim() || null,
          order: catOrder,
        });
      } else if (editingCategory) {
        await updateCatMut.mutateAsync({
          id: editingCategory.id,
          body: {
            name: trimmedName,
            description: catDescription.trim() || null,
            icon: catIcon.trim() || null,
            order: catOrder,
          },
        });
      }
      closeCatSheet();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("errors.saveFailed"));
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

  const requestDeleteProductType = useCallback(
    (vt: ProductTypeItem, closeSheetAfter?: boolean) => {
      setPendingDeleteVt({
        id: vt.id,
        name: vt.name,
        productsCount: vt._count?.products ?? 0,
        closeSheetAfter,
      });
    },
    []
  );

  // ── ProductType sheet handlers ──

  const openVtCreate = (categoryId: string) => {
    setVtIsCreate(true);
    setVtSelected(null);
    setVtParentCategoryId(categoryId);
    setVtName("");
    setVtDescription("");
    setVtSheetOpen(true);
    setOpenIds((prev) => new Set(prev).add(categoryId));
  };

  const openVtEdit = (vt: ProductTypeItem) => {
    setVtIsCreate(false);
    setVtSelected(vt);
    setVtParentCategoryId(vt.categoryId);
    setVtName(vt.name);
    setVtDescription(vt.description ?? "");
    setVtSheetOpen(true);
  };

  const closeVtSheet = () => {
    setVtSheetOpen(false);
    setVtSelected(null);
    setVtIsCreate(false);
  };

  const handleVtSave = async () => {
    const trimmedName = vtName.trim();
    if (!trimmedName) {
      toast.error(t("validationRequired.productTypeName"));
      return;
    }
    setVtSaving(true);
    try {
      if (vtIsCreate) {
        await createVtMut.mutateAsync({
          name: trimmedName,
          description: vtDescription.trim() || null,
          categoryId: vtParentCategoryId,
        });
      } else if (vtSelected) {
        await updateVtMut.mutateAsync({
          id: vtSelected.id,
          body: {
            name: trimmedName,
            description: vtDescription.trim() || null,
          },
        });
      }
      closeVtSheet();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("errors.saveFailed"));
    } finally {
      setVtSaving(false);
    }
  };

  const handleVtDelete = () => {
    if (!vtSelected) return;
    requestDeleteProductType(vtSelected, true);
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Search + Add Category */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        <form onSubmit={handleSearchSubmit} className="relative min-w-0 flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t("productsConfig.categoriesConfig.searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 pl-9 bg-background"
          />
        </form>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("productsConfig.categoriesConfig.addCategory")}
          onClick={openCatCreate}
          className="shrink-0 size-9"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {catIsError && (
        <p className="text-sm text-destructive">
          {catError instanceof Error ? catError.message : t("errors.loadFailed")}
        </p>
      )}

      {/* Tree */}
      {!hasMounted || catLoading ? (
        <ManagementListLoading />
      ) : filteredTree.length === 0 ? (
        <div className="flex min-h-[10rem] w-full flex-col items-center justify-center gap-2 rounded-md border py-10 text-center">
          <p className="text-sm text-muted-foreground px-4">
            {categories.length === 0
              ? t("productsConfig.categoriesConfig.emptyCreate")
              : t("common.emptySearch")}
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
                      aria-label={isOpen ? t("productsConfig.categoriesConfig.collapse") : t("productsConfig.categoriesConfig.expand")}
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
                    aria-label={t("productsConfig.categoriesConfig.addProductType")}
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
                        {t("productsConfig.common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openVtCreate(cat.id)}>
                        <Plus className="mr-2 size-3.5" />
                        {t("productsConfig.common.addType")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => requestDeleteCategory(cat, cat.types.length)}
                      >
                        <Trash2 className="mr-2 size-3.5" />
                        {t("productsConfig.common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* ── Child product types ── */}
                <CollapsibleContent>
                  <div className="divide-y border-t bg-muted/20">
                    {cat.types.length === 0 ? (
                      <div className="flex items-center gap-2 py-3 pl-12 pr-3">
                        <CornerDownRight className="size-3.5 shrink-0 text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground">
                          {t("productsConfig.emptyStates.noProductTypes")}{" "}
                          <button
                            type="button"
                            className="underline hover:text-foreground"
                            onClick={() => openVtCreate(cat.id)}
                          >
                            {t("productsConfig.common.add")}
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
                            {vt.isAutoDetected && (
                              <Badge variant="secondary" className="text-xs font-normal shrink-0">
                                {t("productsConfig.emptyStates.autoDetect")}
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
                                {t("productsConfig.common.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => requestDeleteProductType(vt)}
                              >
                                <Trash2 className="mr-2 size-3.5" />
                                {t("productsConfig.common.delete")}
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
              {catIsCreate ? t("productsConfig.categoriesConfig.newCategory") : (editingCategory?.name ?? t("productsConfig.categoriesConfig.categoryLabel"))}
            </SheetTitle>
          </SheetHeader>

          <div className={SHEET_BODY_CLASS}>
            <div className={SHEET_BODY_SCROLL_CLASS}>
              <div className={cn("grid", SHEET_FORM_GAP, SHEET_FORM_PADDING)}>
                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="cat-name">{t("productsConfig.common.name")}</Label>
                  <Input
                    id="cat-name"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder={t("productsConfig.categoriesConfig.categoryNamePlaceholder")}
                    disabled={catSaving}
                    className={SHEET_INPUT_CLASS}
                  />
                </div>
                <div className={cn("grid grid-cols-2", SHEET_FORM_GAP)}>
                  <div className={cn("grid", SHEET_FIELD_GAP)}>
                    <Label htmlFor="cat-icon">{t("productsConfig.common.icon")}</Label>
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
                    <Label htmlFor="cat-order">{t("productsConfig.common.order")}</Label>
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
                  <Label htmlFor="cat-desc">{t("productsConfig.common.description")}</Label>
                  <Textarea
                    id="cat-desc"
                    value={catDescription}
                    onChange={(e) => setCatDescription(e.target.value)}
                    placeholder={t("productsConfig.categoriesConfig.categoryDescPlaceholder")}
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
                    {t("productsConfig.common.delete")}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={closeCatSheet} disabled={catSaving}>
                  {t("productsConfig.common.cancel")}
                </Button>
                <Button onClick={handleCatSave} disabled={catSaving}>
                  {catSaving && !deleteCatMut.isPending && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {catIsCreate ? t("productsConfig.common.create") : t("productsConfig.common.save")}
                </Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── ProductType Sheet ── */}
      <Sheet open={vtSheetOpen} onOpenChange={(open) => !open && closeVtSheet()}>
        <SheetContent
          side="right"
          className={SHEET_CONTENT_CLASS}
          aria-describedby={undefined}
        >
          <SheetHeader className={SHEET_HEADER_CLASS}>
            <SheetTitle className="text-base font-semibold sm:text-lg">
              {vtIsCreate ? t("productsConfig.categoriesConfig.newProductType") : (vtSelected?.name ?? t("productsConfig.categoriesConfig.productTypeLabel"))}
            </SheetTitle>
          </SheetHeader>

          <div className={SHEET_BODY_CLASS}>
            <div className={SHEET_BODY_SCROLL_CLASS}>
              <div className={cn("grid", SHEET_FORM_GAP, SHEET_FORM_PADDING)}>
                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="vt-name">{t("productsConfig.common.name")}</Label>
                  <Input
                    id="vt-name"
                    value={vtName}
                    onChange={(e) => setVtName(e.target.value)}
                    placeholder={t("productsConfig.categoriesConfig.productTypeNamePlaceholder")}
                    disabled={vtSaving}
                    className={SHEET_INPUT_CLASS}
                  />
                </div>
                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="vt-desc">{t("productsConfig.common.description")}</Label>
                  <Textarea
                    id="vt-desc"
                    value={vtDescription}
                    onChange={(e) => setVtDescription(e.target.value)}
                    placeholder={t("productsConfig.categoriesConfig.productTypeDescPlaceholder")}
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
                    {t("productsConfig.common.delete")}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={closeVtSheet} disabled={vtSaving}>
                  {t("productsConfig.common.cancel")}
                </Button>
                <Button onClick={handleVtSave} disabled={vtSaving}>
                  {vtSaving && !deleteVtMut.isPending && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {vtIsCreate ? t("productsConfig.common.create") : t("productsConfig.common.save")}
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
      <DeleteProductTypeDialog
        open={pendingDeleteVt !== null}
        onOpenChange={(open) => !open && setPendingDeleteVt(null)}
        productType={
          pendingDeleteVt
            ? {
                id: pendingDeleteVt.id,
                name: pendingDeleteVt.name,
                productsCount: pendingDeleteVt.productsCount,
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

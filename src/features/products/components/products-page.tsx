"use client";

import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  type CSSProperties,
} from "react";
import { useQueryState } from "nuqs";
import { useIsRestoring, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLocale } from "@/lib/locale-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  Table2,
  KanbanSquare,
  Search,
  Filter,
  Settings2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Inbox,
} from "lucide-react";
import {
  TABLE_COLUMN_MAX_WIDTH,
  TABLE_COLUMN_MIN_WIDTH,
  TABLE_INDEX_COLUMN_MAX_WIDTH,
  TABLE_INDEX_COLUMN_MIN_WIDTH,
  type Product,
  type ProductColumnConfig,
  type ProductColumnId,
  type SortConfig,
} from "../types";
import { useListConfig } from "../hooks/use-list-config";
import { useStatuses } from "../hooks/use-statuses";
import { TableWithPagination } from "@/components/table-with-pagination";
import { TablePaginationBar } from "@/components/table-pagination-bar";
import { ManagementListLoading } from "@/components/management-list-states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ProductDetailSheet } from "./product-detail-sheet";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, refetchProductsLists, productsKeys } from "../queries";
import { formatDateForDisplay, formatDateTimeForDisplay } from "../lib/field-utils";

const VIEW_VALUES = ["table", "kanban"] as const;
type ViewMode = (typeof VIEW_VALUES)[number];

const VIEW_ICONS: Record<ViewMode, typeof Table2> = {
  table: Table2,
  kanban: KanbanSquare,
};

const defaultFilter: Record<string, string> = {};

const EMPTY_TABLE_COLUMNS: ProductColumnConfig[] = [];

const PAGE_SIZES = [10, 20, 30, 50, 75, 100] as const;
const DEFAULT_PAGE_SIZE = 20;

const VISIBLE_COLUMNS_STORAGE_KEY = "products-table-visible-columns";

function loadVisibleColumnIds(
  columns: { id: ProductColumnId; defaultVisible?: boolean }[]
): Set<ProductColumnId> {
  const defaultVisible = new Set(
    columns.filter((c) => c.defaultVisible).map((c) => c.id)
  );
  if (typeof window === "undefined") return defaultVisible;
  try {
    const raw = localStorage.getItem(VISIBLE_COLUMNS_STORAGE_KEY);
    if (!raw) return defaultVisible;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaultVisible;
    const validIds = new Set(columns.map((c) => c.id));
    const saved = parsed.filter((id): id is ProductColumnId =>
      typeof id === "string" && validIds.has(id as ProductColumnId)
    );
    if (saved.length === 0) return defaultVisible;
    return new Set(saved);
  } catch {
    return defaultVisible;
  }
}

function saveVisibleColumnIds(ids: Set<ProductColumnId>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VISIBLE_COLUMNS_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

function formatCell(
  value: string | number | null | undefined,
  column: { id: ProductColumnId; dataType?: string }
): string {
  if (value == null || value === "" || typeof value === "object") return "—";
  const dt = column.dataType ?? "string";

  if ((dt === "date" || dt === "datetime") && typeof value === "string") {
    return dt === "datetime" ? formatDateTimeForDisplay(value) : formatDateForDisplay(value);
  }
  if (column.id === "description" && typeof value === "string") {
    const maxLen = 60;
    return value.length <= maxLen ? value : value.slice(0, maxLen).trim() + "…";
  }
  if (dt === "integer" || dt === "float") {
    const n = typeof value === "number" ? value : parseFloat(String(value));
    if (!Number.isNaN(n)) {
      if (dt === "integer" || column.id === "power_kw" || column.id === "year_model") {
        return String(Math.round(n));
      }
      return new Intl.NumberFormat("uk-UA").format(n);
    }
  }
  if (typeof value === "string" && (dt === "integer" || dt === "float")) {
    const n = parseFloat(value);
    if (!Number.isNaN(n)) return new Intl.NumberFormat("uk-UA").format(n);
  }
  return String(value);
}

function productListDataColumnStyle(col: ProductColumnConfig): CSSProperties {
  return {
    minWidth: col.minWidth ?? TABLE_COLUMN_MIN_WIDTH,
    maxWidth: TABLE_COLUMN_MAX_WIDTH,
    verticalAlign: "middle",
  };
}

const indexColumnStyle: CSSProperties = {
  minWidth: TABLE_INDEX_COLUMN_MIN_WIDTH,
  maxWidth: TABLE_INDEX_COLUMN_MAX_WIDTH,
  verticalAlign: "middle",
};

type ProductsPageProps = {
  /** Фільтр по категорії (для /catalog/[categoryId]) */
  categoryId?: string | null;
};

export function ProductsPage({ categoryId }: ProductsPageProps = {}) {
  const { t } = useLocale();
  const [view, setView] = useQueryState("view", {
    defaultValue: "table",
    parse: (v) => (VIEW_VALUES.includes(v as ViewMode) ? (v as ViewMode) : "table"),
    serialize: (v) => v,
  });

  const Icon = VIEW_ICONS[view as ViewMode];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 min-w-[140px] justify-between">
              <Icon className="size-4" />
              {view === "table" ? t("products.viewTable") : t("products.viewKanban")}
              <ChevronDown className="size-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            <DropdownMenuRadioGroup value={view} onValueChange={(v) => setView(v as ViewMode)}>
              <DropdownMenuRadioItem value="table" className="gap-2">
                <Table2 className="size-4" />
                {t("products.viewTable")}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="kanban" className="gap-2">
                <KanbanSquare className="size-4" />
                {t("products.viewKanban")}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {view === "table" && (
        <div className="flex flex-col gap-4">
          <ProductsTableClient categoryId={categoryId} />
        </div>
      )}
      {view === "kanban" && (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center text-muted-foreground">
          {t("products.kanbanComingSoon")}
        </div>
      )}
    </div>
  );
}

/** Дані з API (фільтр і сортування на бекенді). */
function ProductsTableView({ categoryId }: { categoryId?: string | null } = {}) {
  const { t, tFormat } = useLocale();
  const { listConfig, isLoading: listConfigLoading } = useListConfig(categoryId ?? null);
  const { options: statusOptions, statuses } = useStatuses();
  const statusNameById = useMemo(
    () => Object.fromEntries(statuses.map((s) => [s.id, s.name])),
    [statuses]
  );
  const tableColumnsSource = listConfig?.tableColumns ?? EMPTY_TABLE_COLUMNS;
  const categoryLabel = listConfig?.categoryName ?? t("products.categoryDefault");

  const tableColumnIdsKey = useMemo(
    () => tableColumnsSource.map((c) => c.id).sort().join(","),
    [tableColumnsSource]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [filter, setFilter] = useState<Record<string, string>>(defaultFilter);
  const [sort, setSort] = useState<SortConfig>({ key: "created_at", dir: "desc" });
  const hasAppliedDefaultSort = useRef(false);
  useEffect(() => {
    if (hasAppliedDefaultSort.current || !listConfig?.defaultSort) return;
    const ds = listConfig.defaultSort;
    if (ds.key && (ds.dir === "asc" || ds.dir === "desc")) {
      hasAppliedDefaultSort.current = true;
      setSort({ key: ds.key, dir: ds.dir });
    }
  }, [listConfig?.defaultSort]);
  const [visibleColumnIds, setVisibleColumnIds] = useState<Set<ProductColumnId>>(
    () => loadVisibleColumnIds(tableColumnsSource)
  );

  useEffect(() => {
    setVisibleColumnIds((prev) => {
      const validIds = new Set(tableColumnsSource.map((c) => c.id));
      const filtered = [...prev].filter((id) => validIds.has(id));
      if (filtered.length === 0) {
        return new Set(
          tableColumnsSource.filter((c) => c.defaultVisible).map((c) => c.id)
        );
      }
      return new Set(filtered);
    });
  }, [tableColumnsSource, tableColumnIdsKey]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [hasOpenedSheetEver, setHasOpenedSheetEver] = useState(false);

  useEffect(() => {
    if (detailSheetOpen || createSheetOpen) setHasOpenedSheetEver(true);
  }, [detailSheetOpen, createSheetOpen]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useQueryState("pageSize", {
    defaultValue: DEFAULT_PAGE_SIZE,
    parse: (v) => {
      const n = parseInt(v, 10);
      return PAGE_SIZES.includes(n as (typeof PAGE_SIZES)[number]) ? n : DEFAULT_PAGE_SIZE;
    },
    serialize: (v) => String(v),
  });
  const pageSizeNum =
    typeof pageSize === "number"
      ? ((PAGE_SIZES as readonly number[]).includes(pageSize) ? pageSize : DEFAULT_PAGE_SIZE)
      : parseInt(String(pageSize), 10) || DEFAULT_PAGE_SIZE;
  const pageSizeClamped = (PAGE_SIZES as readonly number[]).includes(pageSizeNum)
    ? pageSizeNum
    : DEFAULT_PAGE_SIZE;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    saveVisibleColumnIds(visibleColumnIds);
  }, [mounted, visibleColumnIds]);

  useEffect(() => {
    const tid = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(tid);
  }, [searchQuery]);

  const selectCategoryPrompt = !categoryId ? t("products.selectCategoryPrompt") : null;
  const configureFieldsHint =
    categoryId && !listConfigLoading && tableColumnsSource.length === 0
      ? t("products.configureFieldsPrompt")
      : null;

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch,
      filter,
      sortKey: sort.key,
      sortDir: sort.dir,
      page,
      pageSize: pageSizeClamped,
      categoryId: categoryId ?? undefined,
      searchableFields: listConfig?.searchableFieldCodes,
    }),
    [debouncedSearch, filter, sort.key, sort.dir, page, pageSizeClamped, categoryId, listConfig?.searchableFieldCodes]
  );

  const { data, isLoading: loading, error: listErrorQuery } = useProducts(
    queryParams,
    { enabled: !!categoryId && tableColumnsSource.length > 0 }
  );
  const isRestoring = useIsRestoring();
  const queryClient = useQueryClient();
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  /** Після відновлення кешу з localStorage — один раз інвалідуємо списки, щоб таблиця оновилась (інакше staleTime 60s тримає старі дані). */
  const didInvalidateAfterRestore = useRef(false);
  useEffect(() => {
    if (!isRestoring && mounted && !didInvalidateAfterRestore.current) {
      didInvalidateAfterRestore.current = true;
      queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
    }
  }, [isRestoring, mounted, queryClient]);

  /** Показувати рядок "Завантаження..." тільки коли кеш уже відновлено і йде реальний запит без даних. Під час restore не показуємо, щоб уникнути блимання. */
  const showLoadingRow = !isRestoring && loading && items.length === 0;

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  useEffect(() => {
    if (total === 0) return;
    const totalPagesNew = Math.max(1, Math.ceil(total / pageSizeClamped));
    setPage((p) => (p > totalPagesNew ? totalPagesNew : p));
  }, [total, pageSizeClamped]);

  const visibleColumns = useMemo(
    () => tableColumnsSource.filter((c) => visibleColumnIds.has(c.id)),
    [tableColumnsSource, visibleColumnIds]
  );

  /** Дані вже відфільтровані та відсортовані з бекенду. */
  const totalPages = Math.max(1, Math.ceil(total / pageSizeClamped));

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const goToPage = (p: number) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    setPage(clamped);
  };

  const handleSave = useCallback(
    async (data: Product, isCreate: boolean): Promise<Product | void> => {
      try {
        if (isCreate) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit id, created_at for create
          const { id, created_at, ...rest } = data;
          const created = await createMutation.mutateAsync(rest);
          await refetchProductsLists(queryClient).then((result) => {
            if (!result.success && typeof console !== "undefined" && console.warn) {
              console.warn("Оновлення списку після збереження не вдалося; дані в таблиці вже оновлені.", result.error);
            }
          });
          toast.success(tFormat("toasts.itemCreated", { item: categoryLabel }));
          return created;
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit created_at for update
          const { created_at, ...rest } = data;
          const updated = await updateMutation.mutateAsync({ id: data.id, data: rest });
          await refetchProductsLists(queryClient).then((result) => {
            if (!result.success && typeof console !== "undefined" && console.warn) {
              console.warn("Оновлення списку після збереження не вдалося; дані в таблиці вже оновлені.", result.error);
            }
          });
          toast.success(t("toasts.changesSaved"));
          return updated;
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("errors.saveFailed"));
        throw err;
      }
    },
    [createMutation, updateMutation, queryClient, t, tFormat, categoryLabel]
  );

  const toggleColumn = (id: ProductColumnId, checked: boolean) => {
    setVisibleColumnIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleRowClick = (row: Product) => {
    setSelectedProduct(row);
    setDetailSheetOpen(true);
  };

  const sortOptions = tableColumnsSource.map((col) => ({
    value: col.id,
    label: col.label,
  }));

  const [pageInputValue, setPageInputValue] = useState(String(page));
  useEffect(() => {
    setPageInputValue(String(page));
  }, [page]);

  const handlePageInputBlur = () => {
    const n = parseInt(pageInputValue, 10);
    if (!Number.isNaN(n)) goToPage(n);
    else setPageInputValue(String(page));
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handlePageInputBlur();
  };

  if (categoryId && listConfigLoading) {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 py-12 text-center text-muted-foreground">
        <p className="text-sm">{t("products.loadingConfig")}</p>
      </div>
    );
  }

  const hintToShow = selectCategoryPrompt ?? configureFieldsHint;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2 shrink-0" />
          <Input
            placeholder={t("products.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label={tFormat("products.addItem", { category: categoryLabel })}
            onClick={() => setCreateSheetOpen(true)}
          >
            <Plus className="size-4" />
          </Button>
          <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" aria-label={t("products.ariaFilter")}>
                <Filter className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("products.filterTitle")}</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <div className="grid gap-4">
                  {listConfig?.filterableFields.length ? (
                    listConfig.filterableFields.map((field) =>
                      field.range ? (
                        <div key={field.code} className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor={`filter-${field.code}-from`}>
                              {field.label} {t("products.filterFrom")}
                            </Label>
                            <Input
                              id={`filter-${field.code}-from`}
                              type={field.dataType === "integer" || field.dataType === "float" ? "number" : "text"}
                              placeholder="—"
                              value={filter[`${field.code}_from`] ?? ""}
                              onChange={(e) =>
                                setFilter((f) => ({
                                  ...f,
                                  [`${field.code}_from`]: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor={`filter-${field.code}-to`}>
                              {field.label} {t("products.filterTo")}
                            </Label>
                            <Input
                              id={`filter-${field.code}-to`}
                              type={field.dataType === "integer" || field.dataType === "float" ? "number" : "text"}
                              placeholder="—"
                              value={filter[`${field.code}_to`] ?? ""}
                              onChange={(e) =>
                                setFilter((f) => ({
                                  ...f,
                                  [`${field.code}_to`]: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      ) : field.code === "status" ? (
                        <div key={field.code} className="grid gap-2">
                          <Label htmlFor={`filter-${field.code}`}>{field.label}</Label>
                          <Select
                            value={filter[field.code] ?? ""}
                            onValueChange={(v) =>
                              setFilter((f) => ({ ...f, [field.code]: v }))
                            }
                          >
                            <SelectTrigger id={`filter-${field.code}`} className="w-full">
                              <SelectValue placeholder={field.label} />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div key={field.code} className="grid gap-2">
                          <Label htmlFor={`filter-${field.code}`}>{field.label}</Label>
                          <Input
                            id={`filter-${field.code}`}
                            placeholder={field.label}
                            value={filter[field.code] ?? ""}
                            onChange={(e) =>
                              setFilter((f) => ({ ...f, [field.code]: e.target.value }))
                            }
                          />
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      {t("products.noFilterFields")}
                    </p>
                  )}
                </div>
              </DialogBody>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setFilter({})}
                >
                  {t("products.clear")}
                </Button>
                <Button onClick={() => setFilterOpen(false)}>{t("products.apply")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label={t("products.ariaSort")} disabled={sortOptions.length === 0}>
                <ArrowUpDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {sortOptions.length > 0 ? (
                <DropdownMenuRadioGroup
                  value={sort.key ?? ""}
                  onValueChange={(value) => {
                    const key = value as ProductColumnId;
                    setSort((s) => ({
                      key: key || null,
                      dir: s.key === key && s.dir === "asc" ? "desc" : "asc",
                    }));
                  }}
                >
                  {sortOptions.map((opt) => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        {opt.label}
                        {sort.key === opt.value &&
                          (sort.dir === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : (
                            <ArrowDown className="size-3.5" />
                          ))}
                      </span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              ) : (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  {t("products.configureFieldsPrompt")}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={columnsOpen} onOpenChange={setColumnsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" aria-label={t("products.ariaColumns")}>
                <Settings2 className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>{t("products.columnsDisplayTitle")}</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <div className="grid gap-3">
                  {tableColumnsSource.length > 0 ? (
                    tableColumnsSource.map((col) => (
                      <label
                        key={col.id}
                        className="flex items-center gap-2 cursor-pointer rounded-md p-2 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={visibleColumnIds.has(col.id)}
                          onCheckedChange={(checked) => toggleColumn(col.id, checked === true)}
                        />
                        <span className="text-sm">{col.label}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {t("products.configureFieldsPrompt")}
                    </p>
                  )}
                </div>
              </DialogBody>
              <DialogFooter>
                <Button onClick={() => setColumnsOpen(false)}>{t("products.done")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
            pageSize={mounted ? pageSizeClamped : DEFAULT_PAGE_SIZE}
            pageSizes={PAGE_SIZES}
            onPageSizeChange={handlePageSizeChange}
            isReady={mounted}
            isLoading={loading}
          />
        }
        >
        <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="h-11 px-3 text-left align-middle" style={indexColumnStyle}>
                  №
                </TableHead>
                {visibleColumns.map((col) => (
                  <TableHead
                    key={col.id}
                    className={cn(
                      "h-11 px-3 align-middle",
                      col.align === "right" ? "text-right" : "text-left",
                    )}
                    style={productListDataColumnStyle(col)}
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!mounted ? (
                <TableRow>
                  <TableCell
                    plain
                    colSpan={visibleColumns.length + 1}
                    className="h-16 align-middle text-center text-muted-foreground/60"
                    aria-hidden
                  >
                    <span className="inline-block py-4"> </span>
                  </TableCell>
                </TableRow>
              ) : hintToShow ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    plain
                    colSpan={visibleColumns.length + 1}
                    className="p-0 align-middle"
                    aria-hidden
                  >
                    <div className="flex min-h-[12rem] w-full flex-col items-center justify-center gap-3 py-12 text-center">
                      <div className="rounded-full bg-muted p-3">
                        <Inbox className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <p className="max-w-sm text-sm font-medium text-muted-foreground">
                        {hintToShow}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : showLoadingRow ? (
                <TableRow>
                  <TableCell
                    plain
                    colSpan={visibleColumns.length + 1}
                    className="h-24 align-middle text-center text-muted-foreground"
                  >
                    <ManagementListLoading
                      className="py-8"
                      screenReaderText={t("users.loading")}
                    />
                  </TableCell>
                </TableRow>
              ) : listErrorQuery ? (
                <TableRow>
                  <TableCell
                    plain
                    colSpan={visibleColumns.length + 1}
                    className="h-24 align-middle text-center text-destructive"
                  >
                    <span className="inline-block py-8">{listErrorQuery.message ?? t("products.loadFailed")}</span>
                  </TableCell>
                </TableRow>
              ) : isRestoring && items.length === 0 ? (
                <TableRow>
                  <TableCell
                    plain
                    colSpan={visibleColumns.length + 1}
                    className="h-16 align-middle text-center text-muted-foreground/60"
                    aria-hidden
                  >
                    <span className="inline-block py-4"> </span>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    plain
                    colSpan={visibleColumns.length + 1}
                    className="p-0 align-middle"
                    aria-hidden
                  >
                    <div className="flex min-h-[12rem] w-full flex-col items-center justify-center gap-3 py-12 text-center">
                      <div className="rounded-full bg-muted p-3">
                        <Inbox className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <p className="max-w-sm text-sm font-medium text-muted-foreground">
                        {tFormat("products.noData", { category: categoryLabel })}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row, index) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(row)}
                  >
                    <TableCell
                      className="h-11 px-3 font-medium text-muted-foreground text-left align-middle tabular-nums"
                      style={indexColumnStyle}
                    >
                      {(page - 1) * pageSizeClamped + index + 1}
                    </TableCell>
                    {visibleColumns.map((col) => {
                      const cellValue =
                        col.id === "status"
                          ? (row.product_status_id ? statusNameById[row.product_status_id] ?? row.product_status_id : null)
                          : ((row as Record<string, unknown>)[col.id] as string | number | null | undefined) ?? null;
                      return (
                        <TableCell
                          key={col.id}
                          className={col.align === "right" ? "h-11 text-right px-3 align-middle" : "h-11 px-3 align-middle"}
                          style={{
                            ...productListDataColumnStyle(col),
                            ...(col.id === "description" ? { overflow: "hidden" } : {}),
                          }}
                        >
                          {col.id === "description" ? (
                            <span className="block min-w-0 truncate" title={typeof cellValue === "string" ? cellValue : undefined}>
                              {formatCell(cellValue, col)}
                            </span>
                          ) : (
                            formatCell(cellValue, col)
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
      </TableWithPagination>

      {hasOpenedSheetEver && (
      <ProductDetailSheet
        product={createSheetOpen ? null : selectedProduct}
        open={detailSheetOpen || createSheetOpen}
        productTypeId={listConfig?.productType?.id ?? null}
        categoryId={categoryId ?? null}
        categoryLabel={categoryLabel}
        onOpenChange={(open) => {
          if (!open) {
            setDetailSheetOpen(false);
            setCreateSheetOpen(false);
          } else {
            setDetailSheetOpen(true);
          }
        }}
        onSave={handleSave}
        onDelete={
          selectedProduct
            ? async (id) => {
                try {
                  await deleteMutation.mutateAsync(id);
                  setDetailSheetOpen(false);
                  setCreateSheetOpen(false);
                  setSelectedProduct(null);
                  toast.success(tFormat("toasts.itemDeleted", { item: categoryLabel }));
                  refetchProductsLists(queryClient).then((result) => {
                    if (!result.success && typeof console !== "undefined" && console.warn) {
                      console.warn("Оновлення списку після видалення не вдалося; запис із таблиці вже прибрано.", result.error);
                    }
                  });
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : t("errors.deleteFailed"));
                  throw err;
                }
              }
            : undefined
        }
      />
      )}
    </div>
  );
}

/** Монтує таблицю лише на клієнті, щоб useState(loadVisibleColumnIds) виконався в браузері і одразу підхопив збережені колонки без перемикання. */
function ProductsTableClient({ categoryId }: { categoryId?: string | null } = {}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="min-h-[320px] rounded-md border bg-muted/10 animate-pulse" aria-hidden />;
  return <ProductsTableView categoryId={categoryId} />;
}

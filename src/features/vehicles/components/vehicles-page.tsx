"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQueryState } from "nuqs";
import { useIsRestoring, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Inbox,
} from "lucide-react";
import {
  PRODUCT_COLUMNS,
  TABLE_COLUMN_MAX_WIDTH,
  type Product,
  type ProductColumnId,
  type ProductFilterState,
  type SortConfig,
} from "../types";
import { TableWithPagination } from "@/components/table-with-pagination";
import { VehicleDetailSheet } from "./vehicle-detail-sheet";
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle, refetchVehiclesLists, vehiclesKeys } from "../queries";

const VIEW_VALUES = ["table", "kanban"] as const;
type ViewMode = (typeof VIEW_VALUES)[number];

const VIEW_LABELS: Record<ViewMode, string> = {
  table: "Таблиця",
  kanban: "Канбан",
};

const VIEW_ICONS: Record<ViewMode, typeof Table2> = {
  table: Table2,
  kanban: KanbanSquare,
};

const defaultFilter: ProductFilterState = {
  product_type: "",
  brand: "",
  model: "",
  year_from: "",
  year_to: "",
  value_from: "",
  value_to: "",
};

const PAGE_SIZES = [10, 20, 30, 50, 75, 100] as const;
const DEFAULT_PAGE_SIZE = 20;

const VISIBLE_COLUMNS_STORAGE_KEY = "vehicles-table-visible-columns";

function loadVisibleColumnIds(): Set<ProductColumnId> {
  if (typeof window === "undefined") {
    return new Set(PRODUCT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id));
  }
  try {
    const raw = localStorage.getItem(VISIBLE_COLUMNS_STORAGE_KEY);
    if (!raw) return new Set(PRODUCT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id));
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set(PRODUCT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id));
    const validIds = new Set(PRODUCT_COLUMNS.map((c) => c.id));
    const saved = parsed.filter((id): id is ProductColumnId => typeof id === "string" && validIds.has(id as ProductColumnId));
    if (saved.length === 0) return new Set(PRODUCT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id));
    return new Set(saved);
  } catch {
    return new Set(PRODUCT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id));
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

function formatDate(value: string | null): string {
  if (value == null || value === "") return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" });
}

function formatCell(value: string | number | null, columnId: ProductColumnId): string {
  if (value == null || value === "") return "—";
  if (columnId === "created_at" && typeof value === "string") return formatDate(value);
  if (columnId === "create_at_ccd" && typeof value === "string") {
    return formatDate(value);
  }
  if (columnId === "description" && typeof value === "string") {
    const maxLen = 60;
    return value.length <= maxLen ? value : value.slice(0, maxLen).trim() + "…";
  }
  if (typeof value === "number") {
    const numCols: ProductColumnId[] = [
      "customs_value", "customs_value_plus_10_vat", "customs_value_plus_20_vat",
      "gross_weight_kg", "payload_kg", "engine_cm3", "seats", "power_kw",
      "mileage", "processed_file_id", "cost_without_vat", "cost_with_vat", "vat_amount",
    ];
    if (numCols.includes(columnId)) {
      if (columnId === "power_kw") return String(value);
      if (columnId === "year_model") return String(value);
      return new Intl.NumberFormat("uk-UA").format(value);
    }
  }
  if ((columnId === "customs_value" || columnId === "cost_without_vat" || columnId === "cost_with_vat") && typeof value === "string") {
    const n = parseFloat(value);
    if (!Number.isNaN(n)) return new Intl.NumberFormat("uk-UA").format(n);
  }
  return String(value);
}

type VehiclesPageProps = {
  /** Фільтр по категорії (для /catalog/[categoryId]) */
  categoryId?: string | null;
};

export function VehiclesPage({ categoryId }: VehiclesPageProps = {}) {
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
              {VIEW_LABELS[view as ViewMode]}
              <ChevronDown className="size-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            <DropdownMenuRadioGroup value={view} onValueChange={(v) => setView(v as ViewMode)}>
              <DropdownMenuRadioItem value="table" className="gap-2">
                <Table2 className="size-4" />
                Таблиця
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="kanban" className="gap-2">
                <KanbanSquare className="size-4" />
                Канбан
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {view === "table" && (
        <div className="flex flex-col gap-4">
          <VehiclesTableClient categoryId={categoryId} />
        </div>
      )}
      {view === "kanban" && (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center text-muted-foreground">
          Тут буде канбан-дошка.
        </div>
      )}
    </div>
  );
}

/** Дані з API (фільтр і сортування на бекенді). */
function VehiclesTableView({ categoryId }: { categoryId?: string | null } = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [filter, setFilter] = useState<ProductFilterState>(defaultFilter);
  const [sort, setSort] = useState<SortConfig>({ key: "created_at", dir: "desc" });
  const [visibleColumnIds, setVisibleColumnIds] = useState<Set<ProductColumnId>>(loadVisibleColumnIds);

  const [selectedVehicle, setSelectedVehicle] = useState<Product | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);

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
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch,
      filter,
      sortKey: sort.key,
      sortDir: sort.dir,
      page,
      pageSize: pageSizeClamped,
      categoryId: categoryId ?? undefined,
    }),
    [debouncedSearch, filter, sort.key, sort.dir, page, pageSizeClamped, categoryId]
  );

  const { data, isLoading: loading, error: listErrorQuery } = useVehicles(queryParams);
  const isRestoring = useIsRestoring();
  const queryClient = useQueryClient();
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  /** Після відновлення кешу з localStorage — один раз інвалідуємо списки, щоб таблиця оновилась (інакше staleTime 60s тримає старі дані). */
  const didInvalidateAfterRestore = useRef(false);
  useEffect(() => {
    if (!isRestoring && mounted && !didInvalidateAfterRestore.current) {
      didInvalidateAfterRestore.current = true;
      queryClient.invalidateQueries({ queryKey: vehiclesKeys.lists() });
    }
  }, [isRestoring, mounted, queryClient]);

  /** Показувати рядок "Завантаження..." тільки коли кеш уже відновлено і йде реальний запит без даних. Під час restore не показуємо, щоб уникнути блимання. */
  const showLoadingRow = !isRestoring && loading && items.length === 0;

  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();
  const deleteMutation = useDeleteVehicle();

  useEffect(() => {
    if (total === 0) return;
    const totalPagesNew = Math.max(1, Math.ceil(total / pageSizeClamped));
    setPage((p) => (p > totalPagesNew ? totalPagesNew : p));
  }, [total, pageSizeClamped]);

  const visibleColumns = useMemo(
    () => PRODUCT_COLUMNS.filter((c) => visibleColumnIds.has(c.id)),
    [visibleColumnIds]
  );

  /** Дані вже відфільтровані та відсортовані з бекенду. */
  const totalPages = Math.max(1, Math.ceil(total / pageSizeClamped));
  const canPrev = page > 1;
  const canNext = page < totalPages;

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
          await refetchVehiclesLists(queryClient).then((result) => {
            if (!result.success && typeof console !== "undefined" && console.warn) {
              console.warn("Оновлення списку після збереження не вдалося; дані в таблиці вже оновлені.", result.error);
            }
          });
          toast.success("Авто створено");
          return created;
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit created_at for update
          const { created_at, ...rest } = data;
          const updated = await updateMutation.mutateAsync({ id: data.id, data: rest });
          await refetchVehiclesLists(queryClient).then((result) => {
            if (!result.success && typeof console !== "undefined" && console.warn) {
              console.warn("Оновлення списку після збереження не вдалося; дані в таблиці вже оновлені.", result.error);
            }
          });
          toast.success("Зміни збережено");
          return updated;
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Помилка збереження");
        throw err;
      }
    },
    [createMutation, updateMutation, queryClient]
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
    setSelectedVehicle(row);
    setDetailSheetOpen(true);
  };

  const sortOptions = PRODUCT_COLUMNS.map((col) => ({ value: col.id, label: col.label }));

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2 shrink-0" />
          <Input
            placeholder="Пошук за VIN, MRN, маркою, моделлю..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Додати авто"
            onClick={() => setCreateSheetOpen(true)}
          >
            <Plus className="size-4" />
          </Button>
          <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Фільтр">
                <Filter className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Фільтр</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="filter-type">Тип транспорту</Label>
                    <Input
                      id="filter-type"
                      placeholder="Наприклад: Вантажний"
                      value={filter.product_type}
                      onChange={(e) => setFilter((f) => ({ ...f, product_type: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="filter-brand">Марка</Label>
                    <Input
                      id="filter-brand"
                      placeholder="Марка"
                      value={filter.brand}
                      onChange={(e) => setFilter((f) => ({ ...f, brand: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="filter-model">Модель</Label>
                    <Input
                      id="filter-model"
                      placeholder="Модель"
                      value={filter.model}
                      onChange={(e) => setFilter((f) => ({ ...f, model: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="filter-year-from">Рік від</Label>
                      <Input
                        id="filter-year-from"
                        type="number"
                        placeholder="2015"
                        value={filter.year_from}
                        onChange={(e) => setFilter((f) => ({ ...f, year_from: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="filter-year-to">Рік до</Label>
                      <Input
                        id="filter-year-to"
                        type="number"
                        placeholder="2024"
                        value={filter.year_to}
                        onChange={(e) => setFilter((f) => ({ ...f, year_to: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="filter-value-from">Вартість від (грн)</Label>
                      <Input
                        id="filter-value-from"
                        type="number"
                        placeholder="0"
                        value={filter.value_from}
                        onChange={(e) => setFilter((f) => ({ ...f, value_from: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="filter-value-to">Вартість до (грн)</Label>
                      <Input
                        id="filter-value-to"
                        type="number"
                        placeholder="1000000"
                        value={filter.value_to}
                        onChange={(e) => setFilter((f) => ({ ...f, value_to: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </DialogBody>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilter(defaultFilter);
                  }}
                >
                  Очистити
                </Button>
                <Button onClick={() => setFilterOpen(false)}>Застосувати</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Сортування">
                <ArrowUpDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
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
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={columnsOpen} onOpenChange={setColumnsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Стовпці">
                <Settings2 className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Відображення стовпців</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <div className="grid gap-3">
                  {PRODUCT_COLUMNS.map((col) => (
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
                  ))}
                </div>
              </DialogBody>
              <DialogFooter>
                <Button onClick={() => setColumnsOpen(false)}>Готово</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <TableWithPagination
        pagination={
          <>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="flex items-center justify-center [&_svg]:block [&_svg]:m-auto"
                aria-label="На початок"
                disabled={(!mounted ? true : !canPrev) || (mounted && loading)}
                onClick={() => goToPage(1)}
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="flex items-center justify-center [&_svg]:block [&_svg]:m-auto"
                aria-label="Попередня сторінка"
                disabled={(!mounted ? true : !canPrev) || (mounted && loading)}
                onClick={() => goToPage(page - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="flex items-center gap-1.5 px-2 text-sm text-muted-foreground">
                Сторінка
                <Input
                  type="number"
                  min={1}
                  max={mounted ? totalPages : 1}
                  value={mounted ? pageInputValue : "1"}
                  onChange={(e) => setPageInputValue(e.target.value)}
                  onBlur={handlePageInputBlur}
                  onKeyDown={handlePageInputKeyDown}
                  className="h-8 w-14 text-center"
                  aria-label="Номер сторінки"
                />
                з {mounted ? totalPages : 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="flex items-center justify-center [&_svg]:block [&_svg]:m-auto"
                aria-label="Наступна сторінка"
                disabled={(!mounted ? true : !canNext) || (mounted && loading)}
                onClick={() => goToPage(page + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="flex items-center justify-center [&_svg]:block [&_svg]:m-auto"
                aria-label="В кінець"
                disabled={(!mounted ? true : !canNext) || (mounted && loading)}
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
                    disabled={mounted && loading}
                    aria-label="Кількість рядків на сторінці"
                  >
                    {mounted ? pageSizeClamped : DEFAULT_PAGE_SIZE}
                    <ChevronDown className="size-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[4.5rem]">
                  <DropdownMenuRadioGroup
                    value={String(mounted ? pageSizeClamped : DEFAULT_PAGE_SIZE)}
                    onValueChange={(v) => handlePageSizeChange(Number(v))}
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
        <Table className={items.length === 0 ? "w-full" : "w-max"}>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead
                  className="h-11 px-3 text-center align-middle"
                  style={{ minWidth: "3.5rem", maxWidth: TABLE_COLUMN_MAX_WIDTH, verticalAlign: "middle" }}
                >
                  №
                </TableHead>
                {visibleColumns.map((col) => (
                  <TableHead
                    key={col.id}
                    className="h-11 px-3 text-center align-middle"
                    style={{
                      minWidth: col.minWidth ?? undefined,
                      maxWidth: TABLE_COLUMN_MAX_WIDTH,
                      verticalAlign: "middle",
                    }}
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
              ) : showLoadingRow ? (
                <TableRow>
                  <TableCell
                    plain
                    colSpan={visibleColumns.length + 1}
                    className="h-24 align-middle text-center text-muted-foreground"
                  >
                    <span className="inline-block py-8">Завантаження…</span>
                  </TableCell>
                </TableRow>
              ) : listErrorQuery ? (
                <TableRow>
                  <TableCell
                    plain
                    colSpan={visibleColumns.length + 1}
                    className="h-24 align-middle text-center text-destructive"
                  >
                    <span className="inline-block py-8">{listErrorQuery.message ?? "Помилка завантаження"}</span>
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
                        Немає даних. Додайте авто або змініть пошук/фільтр.
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
                      className="h-11 px-3 font-medium text-muted-foreground text-center align-middle"
                      style={{ minWidth: "3.5rem", maxWidth: TABLE_COLUMN_MAX_WIDTH, verticalAlign: "middle" }}
                    >
                      {(page - 1) * pageSizeClamped + index + 1}
                    </TableCell>
                    {visibleColumns.map((col) => (
                      <TableCell
                        key={col.id}
                        className={col.align === "right" ? "h-11 text-right px-3 align-middle" : "h-11 px-3 align-middle"}
                        style={{
                          minWidth: col.minWidth ?? undefined,
                          maxWidth: TABLE_COLUMN_MAX_WIDTH,
                          verticalAlign: "middle",
                          ...(col.id === "description" ? { overflow: "hidden" } : {}),
                        }}
                      >
                        {col.id === "description" ? (
                          <span className="block min-w-0 truncate" title={typeof row[col.id] === "string" ? (row[col.id] as string) : undefined}>
                            {formatCell(
                              row[col.id] as string | number | null,
                              col.id
                            )}
                          </span>
                        ) : (
                          formatCell(
                            row[col.id] as string | number | null,
                            col.id
                          )
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
      </TableWithPagination>

      <VehicleDetailSheet
        vehicle={createSheetOpen ? null : selectedVehicle}
        open={detailSheetOpen || createSheetOpen}
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
          selectedVehicle
            ? async (id) => {
                try {
                  await deleteMutation.mutateAsync(id);
                  setDetailSheetOpen(false);
                  setCreateSheetOpen(false);
                  setSelectedVehicle(null);
                  toast.success("Авто видалено");
                  refetchVehiclesLists(queryClient).then((result) => {
                    if (!result.success && typeof console !== "undefined" && console.warn) {
                      console.warn("Оновлення списку після видалення не вдалося; запис із таблиці вже прибрано.", result.error);
                    }
                  });
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Помилка видалення");
                  throw err;
                }
              }
            : undefined
        }
      />
    </div>
  );
}

/** Монтує таблицю лише на клієнті, щоб useState(loadVisibleColumnIds) виконався в браузері і одразу підхопив збережені колонки без перемикання. */
function VehiclesTableClient({ categoryId }: { categoryId?: string | null } = {}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="min-h-[320px] rounded-md border bg-muted/10 animate-pulse" aria-hidden />;
  return <VehiclesTableView categoryId={categoryId} />;
}

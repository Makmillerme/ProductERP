"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { useLocale } from "@/lib/locale-provider";
import { cn } from "@/lib/utils";
import { MANAGEMENT_STALE_MS } from "@/lib/query-keys";
import { TableWithPagination } from "@/components/table-with-pagination";
import type { StatusItem } from "./types";

const STATUSES_KEY = ["admin", "statuses"] as const;

const PAGE_SIZES = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 20;

async function fetchStatuses(
  params: { search: string; page: number; pageSize: number },
  t: (key: string) => string
): Promise<{ statuses: StatusItem[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  searchParams.set("page", String(params.page));
  searchParams.set("pageSize", String(params.pageSize));
  const res = await fetch(`/api/admin/statuses?${searchParams.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? t("productsConfig.statusesConfig.loadFailed"));
  }
  const data = await res.json();
  return {
    statuses: data.statuses ?? [],
    total: data.total ?? 0,
  };
}

async function createStatus(
  body: {
    name: string;
    color: string;
    order: number;
    description?: string | null;
    isDefault?: boolean;
  },
  t: (key: string) => string
) {
  const res = await fetch("/api/admin/statuses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? t("productsConfig.statusesConfig.createFailed"));
  return data;
}

async function updateStatus(
  id: string,
  body: {
    name?: string;
    color?: string;
    order?: number;
    description?: string | null;
    isDefault?: boolean;
  },
  t: (key: string) => string
) {
  const res = await fetch(`/api/admin/statuses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? t("productsConfig.statusesConfig.saveFailed"));
  return data;
}

async function deleteStatus(id: string, t: (key: string) => string) {
  const res = await fetch(`/api/admin/statuses/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? t("productsConfig.statusesConfig.deleteFailed"));
  }
}

export function StatusesManagement() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [hasMounted, setHasMounted] = useState(false);

  const colorInputRef = useRef<HTMLInputElement | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StatusItem | null>(null);
  const [isCreate, setIsCreate] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageInputValue, setPageInputValue] = useState("1");

  const [name, setName] = useState("");
  const [color, setColor] = useState("#6b7280");
  const [order, setOrder] = useState(0);
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

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
    queryKey: [...STATUSES_KEY, listParams],
    queryFn: () => fetchStatuses(listParams, t),
    staleTime: MANAGEMENT_STALE_MS,
    placeholderData: keepPreviousData,
  });

  const statuses = data?.statuses ?? [];
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
    mutationFn: (body: Parameters<typeof createStatus>[0]) =>
      createStatus(body, t),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATUSES_KEY });
      toast.success(t("toasts.statusCreated"));
    },
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof updateStatus>[1];
    }) => updateStatus(id, body, t),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATUSES_KEY });
      toast.success(t("toasts.statusSaved"));
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteStatus(id, t),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATUSES_KEY });
      toast.success(t("toasts.statusDeleted"));
    },
  });

  const resetForm = () => {
    setName("");
    setColor("#6b7280");
    setOrder(total);
    setDescription("");
    setIsDefault(false);
  };

  const openForCreate = () => {
    setSelectedStatus(null);
    setIsCreate(true);
    resetForm();
    setSheetOpen(true);
  };

  const openForEdit = (s: StatusItem) => {
    setSelectedStatus(s);
    setIsCreate(false);
    setName(s.name);
    setColor(s.color);
    setOrder(s.order);
    setDescription(s.description ?? "");
    setIsDefault(s.isDefault);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setSelectedStatus(null);
    setIsCreate(false);
  };

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error(t("validationRequired.statusName"));
      return;
    }

    setSaving(true);
    try {
      if (isCreate) {
        await createMut.mutateAsync({
          name: trimmedName,
          color: color.trim() || "#6b7280",
          order,
          description: description.trim() || null,
          isDefault,
        });
      } else if (selectedStatus) {
        await updateMut.mutateAsync({
          id: selectedStatus.id,
          body: {
            name: trimmedName,
            color: color.trim() || "#6b7280",
            order,
            description: description.trim() || null,
            isDefault,
          },
        });
      }
      closeSheet();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStatus || deleteMut.isPending) return;
    setSaving(true);
    try {
      await deleteMut.mutateAsync(selectedStatus.id);
      closeSheet();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("errors.deleteFailed"));
    } finally {
      setSaving(false);
    }
  };

  const isEmpty = statuses.length === 0;
  const emptyMessage =
    total === 0 && !search.trim()
      ? t("productsConfig.statusesConfig.emptyCreate")
      : t("common.emptySearch");
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        <form
          onSubmit={handleSearchSubmit}
          className="relative min-w-0 flex-1 max-w-sm"
        >
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t("productsConfig.statusesConfig.searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 pl-9 bg-background"
          />
        </form>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("productsConfig.statusesConfig.addStatus")}
          onClick={openForCreate}
          className="shrink-0 size-9"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : t("productsConfig.statusesConfig.loadFailed")}
        </p>
      )}

      {!hasMounted || (isLoading && !statuses.length) ? (
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
                  aria-label={t("common.pagination.ariaFirstPage")}
                  disabled={!canPrev}
                  onClick={() => goToPage(1)}
                >
                  <ChevronsLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="flex items-center justify-center [&_svg]:block [&_svg]:m-auto"
                  aria-label={t("common.pagination.ariaPrevPage")}
                  disabled={!canPrev}
                  onClick={() => goToPage(page - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="flex items-center gap-1.5 px-2 text-sm text-muted-foreground">
                  {t("common.pagination.page")}
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageInputValue}
                    onChange={(e) => setPageInputValue(e.target.value)}
                    onBlur={handlePageInputBlur}
                    onKeyDown={handlePageInputKeyDown}
                    className="h-8 w-14 text-center"
                    aria-label={t("common.pagination.ariaPageNumber")}
                  />
                  {t("common.pagination.pageOf")} {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="flex items-center justify-center [&_svg]:block [&_svg]:m-auto"
                  aria-label={t("common.pagination.ariaNextPage")}
                  disabled={!canNext}
                  onClick={() => goToPage(page + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="flex items-center justify-center [&_svg]:block [&_svg]:m-auto"
                  aria-label={t("common.pagination.ariaLastPage")}
                  disabled={!canNext}
                  onClick={() => goToPage(totalPages)}
                >
                  <ChevronsRight className="size-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{t("common.pagination.rowsPerPage")}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="default"
                      className="gap-2 min-w-[4.5rem] justify-between"
                      aria-label={t("common.pagination.ariaRowsPerPage")}
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
            <colgroup>
              <col className="w-16" />
              <col style={{ width: "1%" }} />
              <col className="w-24" />
              <col className="w-36" />
              <col className="min-w-[8rem]" />
            </colgroup>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="h-11 px-3 text-center align-middle w-16">
                  {t("productsConfig.statusesConfig.color")}
                </TableHead>
                <TableHead className="h-11 px-3 text-left align-middle">
                  {t("productsConfig.common.name")}
                </TableHead>
                <TableHead className="h-11 px-3 text-left align-middle w-24">
                  {t("productsConfig.common.order")}
                </TableHead>
                <TableHead className="h-11 px-3 text-left align-middle w-36">
                  {t("productsConfig.statusesConfig.defaultBadge")}
                </TableHead>
                <TableHead className="h-11 px-3 text-left align-middle hidden md:table-cell">
                  {t("productsConfig.statusesConfig.descriptionColumn")}
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
                statuses.map((s) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openForEdit(s)}
                  >
                    <TableCell className="h-11 px-3 text-center align-middle">
                      <span
                        className="inline-block size-3 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                    </TableCell>
                    <TableCell className="h-11 px-3 text-left align-middle font-medium">
                      {s.name}
                    </TableCell>
                    <TableCell className="h-11 px-3 text-left align-middle text-muted-foreground text-sm tabular-nums">
                      {s.order}
                    </TableCell>
                    <TableCell className="h-11 px-3 text-left align-middle">
                      {s.isDefault ? (
                        <Badge
                          variant="secondary"
                          className="text-xs font-normal"
                        >
                          {t("productsConfig.statusesConfig.defaultBadge")}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          —
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      className="h-11 px-3 text-left align-middle text-muted-foreground text-sm truncate hidden md:table-cell"
                      title={s.description ?? undefined}
                    >
                      {s.description ?? "—"}
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
                ? t("productsConfig.statusesConfig.newStatus")
                : (selectedStatus?.name ?? t("productsConfig.statusesConfig.statusLabel"))}
            </SheetTitle>
            {!isCreate && selectedStatus?.isDefault && (
              <Badge variant="secondary" className="text-xs font-normal">
                {t("productsConfig.statusesConfig.defaultBadge")}
              </Badge>
            )}
          </SheetHeader>

          <div className={SHEET_BODY_CLASS}>
            <div className={SHEET_BODY_SCROLL_CLASS}>
              <div className={cn("grid", SHEET_FORM_GAP, SHEET_FORM_PADDING)}>
                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="st-name">{t("productsConfig.common.name")}</Label>
                  <Input
                    id="st-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("productsConfig.statusesConfig.namePlaceholder")}
                    disabled={saving}
                    className={SHEET_INPUT_CLASS}
                  />
                </div>

                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="st-color">{t("productsConfig.statusesConfig.colorHex")}</Label>
                  <div className="flex items-center gap-2">
                    {/* Прихований native color input, відкривається тільки по кліку на кнопку */}
                    <input
                      ref={colorInputRef}
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      disabled={saving}
                      className="sr-only"
                      aria-hidden="true"
                      tabIndex={-1}
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => colorInputRef.current?.click()}
                      className="inline-block size-8 shrink-0 rounded-md border border-input bg-background cursor-pointer hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      style={{ backgroundColor: color }}
                      aria-label={t("productsConfig.statusesConfig.selectColor")}
                    />
                    <Input
                      id="st-color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="#6b7280"
                      disabled={saving}
                      className={SHEET_INPUT_CLASS}
                    />
                  </div>
                </div>

                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="st-order">{t("productsConfig.common.order")}</Label>
                  <Input
                    id="st-order"
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    disabled={saving}
                    className={SHEET_INPUT_CLASS}
                  />
                </div>

                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="st-desc">{t("productsConfig.common.description")}</Label>
                  <Textarea
                    id="st-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("productsConfig.statusesConfig.descPlaceholder")}
                    disabled={saving}
                    rows={3}
                    className={SHEET_INPUT_CLASS}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="st-default"
                    checked={isDefault}
                    onCheckedChange={(v) => setIsDefault(!!v)}
                    disabled={saving}
                  />
                  <Label htmlFor="st-default" className="leading-none">
                    {t("productsConfig.statusesConfig.defaultBadge")}
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className={SHEET_FOOTER_CLASS}>
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <div>
                {!isCreate && selectedStatus && !selectedStatus.isDefault && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDelete}
                    disabled={saving || deleteMut.isPending}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  >
                    {saving && deleteMut.isPending ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    {t("productsConfig.common.delete")}
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
    </div>
  );
}

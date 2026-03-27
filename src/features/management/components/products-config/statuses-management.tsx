"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  TableCellText,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MgmtTableColGroup } from "@/components/mgmt-table-colgroup";
import {
  MGMT_COLGROUP_5_STATUS,
  mgmtTableLayoutClass,
  mgmtTableHeaderRowClass,
  mgmtTableHeadClass,
  mgmtTableHeadCenterClass,
  mgmtTableCellClass,
  mgmtTableCellPrimaryClass,
  mgmtTableCellMutedSmClass,
} from "@/config/management-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/lib/locale-provider";
import { cn } from "@/lib/utils";
import { MANAGEMENT_STALE_MS, managementAdminKeys, managementPublicKeys } from "@/lib/query-keys";
import { adminGetJson, adminMutationJson, adminDeleteAllowMissing } from "@/lib/api/admin/client";
import { TableWithPagination } from "@/components/table-with-pagination";
import { TablePaginationBar } from "@/components/table-pagination-bar";
import { ManagementListLoading, TableEmptyMessageRow } from "@/components/management-list-states";
import type { StatusItem } from "./types";

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
  const data = await adminGetJson<{
    statuses?: StatusItem[];
    total?: number;
  }>(`/statuses?${searchParams.toString()}`, t("productsConfig.statusesConfig.loadFailed"));
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
  return adminMutationJson("/statuses", {
    method: "POST",
    body,
    fallbackError: t("productsConfig.statusesConfig.createFailed"),
  });
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
  return adminMutationJson(`/statuses/${id}`, {
    method: "PATCH",
    body,
    fallbackError: t("productsConfig.statusesConfig.saveFailed"),
  });
}

async function deleteStatus(id: string, t: (key: string) => string) {
  await adminDeleteAllowMissing(
    `/statuses/${id}`,
    t("productsConfig.statusesConfig.deleteFailed")
  );
}

type StatusFormValues = {
  name: string;
  color: string;
  order: number;
  description: string;
  isDefault: boolean;
};

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
    queryKey: [...managementAdminKeys.statuses, listParams],
    queryFn: () => fetchStatuses(listParams, t),
    staleTime: MANAGEMENT_STALE_MS,
    placeholderData: keepPreviousData,
  });

  const statuses = data?.statuses ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const statusFormDefaults = useCallback(
    (): StatusFormValues => ({
      name: "",
      color: "#6b7280",
      order: total,
      description: "",
      isDefault: false,
    }),
    [total]
  );

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("validationRequired.statusName")),
        color: z.string(),
        order: z.number().int(),
        description: z.string(),
        isDefault: z.boolean(),
      }),
    [t]
  );

  const form = useForm<StatusFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      color: "#6b7280",
      order: 0,
      description: "",
      isDefault: false,
    },
  });

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

  const listCacheKey = useMemo(
    () => [...managementAdminKeys.statuses, listParams] as const,
    [listParams]
  );

  const createMut = useMutation({
    mutationFn: (body: Parameters<typeof createStatus>[0]) =>
      createStatus(body, t),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: managementAdminKeys.statuses });
      void queryClient.invalidateQueries({ queryKey: managementPublicKeys.statuses });
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
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: managementAdminKeys.statuses });
      const key = [...managementAdminKeys.statuses, listParams] as const;
      const prev = queryClient.getQueryData<{
        statuses: StatusItem[];
        total: number;
      }>(key);
      if (!prev) return { prev: undefined, key };
      const nextStatuses = prev.statuses.map((s) => {
        if (s.id !== id) {
          if (body.isDefault === true && s.isDefault) {
            return { ...s, isDefault: false };
          }
          return s;
        }
        return {
          ...s,
          ...(body.name !== undefined && { name: body.name }),
          ...(body.color !== undefined && { color: body.color }),
          ...(body.order !== undefined && { order: body.order }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
        };
      });
      queryClient.setQueryData(key, { ...prev, statuses: nextStatuses });
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev != null && ctx.key) {
        queryClient.setQueryData(ctx.key, ctx.prev);
      }
    },
    onSuccess: (data, _vars, ctx) => {
      const row = data as StatusItem;
      const key = ctx?.key ?? listCacheKey;
      const cur = queryClient.getQueryData<{
        statuses: StatusItem[];
        total: number;
      }>(key);
      if (cur) {
        queryClient.setQueryData(key, {
          ...cur,
          statuses: cur.statuses.map((s) => {
            if (s.id === row.id) return { ...row };
            if (row.isDefault && s.isDefault && s.id !== row.id) {
              return { ...s, isDefault: false };
            }
            return s;
          }),
        });
      }
      void queryClient.invalidateQueries({ queryKey: managementPublicKeys.statuses });
      toast.success(t("toasts.statusSaved"));
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteStatus(id, t),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: managementAdminKeys.statuses });
      const key = [...managementAdminKeys.statuses, listParams] as const;
      const prev = queryClient.getQueryData<{
        statuses: StatusItem[];
        total: number;
      }>(key);
      if (!prev) return { prev: undefined, key };
      queryClient.setQueryData(key, {
        statuses: prev.statuses.filter((s) => s.id !== id),
        total: Math.max(0, prev.total - 1),
      });
      return { prev, key };
    },
    onError: (_e, _deletedId, ctx) => {
      if (ctx?.prev != null && ctx.key) {
        queryClient.setQueryData(ctx.key, ctx.prev);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: managementPublicKeys.statuses });
      toast.success(t("toasts.statusDeleted"));
    },
  });

  const openForCreate = () => {
    setSelectedStatus(null);
    setIsCreate(true);
    form.reset(statusFormDefaults());
    setSheetOpen(true);
  };

  const openForEdit = (s: StatusItem) => {
    setSelectedStatus(s);
    setIsCreate(false);
    form.reset({
      name: s.name,
      color: s.color,
      order: s.order,
      description: s.description ?? "",
      isDefault: s.isDefault,
    });
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setSelectedStatus(null);
    setIsCreate(false);
    form.reset(statusFormDefaults());
  };

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const onSubmit = async (values: StatusFormValues) => {
    const trimmedName = values.name.trim();
    const colorVal = values.color.trim() || "#6b7280";
    const desc = values.description.trim() || null;

    setSaving(true);
    try {
      if (isCreate) {
        await createMut.mutateAsync({
          name: trimmedName,
          color: colorVal,
          order: values.order,
          description: desc,
          isDefault: values.isDefault,
        });
      } else if (selectedStatus) {
        await updateMut.mutateAsync({
          id: selectedStatus.id,
          body: {
            name: trimmedName,
            color: colorVal,
            order: values.order,
            description: desc,
            isDefault: values.isDefault,
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
            <MgmtTableColGroup widths={MGMT_COLGROUP_5_STATUS} />
            <TableHeader>
              <TableRow className={mgmtTableHeaderRowClass}>
                <TableHead className={mgmtTableHeadCenterClass}>
                  {t("productsConfig.statusesConfig.color")}
                </TableHead>
                <TableHead className={mgmtTableHeadClass}>
                  {t("productsConfig.common.name")}
                </TableHead>
                <TableHead className={mgmtTableHeadClass}>
                  {t("productsConfig.common.order")}
                </TableHead>
                <TableHead className={mgmtTableHeadClass}>
                  {t("productsConfig.statusesConfig.defaultBadge")}
                </TableHead>
                <TableHead className={`${mgmtTableHeadClass} hidden md:table-cell`}>
                  {t("productsConfig.statusesConfig.descriptionColumn")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isEmpty ? (
                <TableEmptyMessageRow colSpan={5}>{emptyMessage}</TableEmptyMessageRow>
              ) : (
                statuses.map((s) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openForEdit(s)}
                  >
                    <TableCell plain className={`${mgmtTableCellClass} text-center`}>
                      <div className="flex h-11 min-h-11 w-full min-w-0 max-w-full items-center justify-center gap-1.5 overflow-hidden">
                        <span
                          className="inline-block size-3 rounded-full shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className={mgmtTableCellPrimaryClass} title={s.name}>
                      <TableCellText>{s.name}</TableCellText>
                    </TableCell>
                    <TableCell className={cn(mgmtTableCellMutedSmClass, "tabular-nums")}>
                      <TableCellText className="tabular-nums">{s.order}</TableCellText>
                    </TableCell>
                    <TableCell className={mgmtTableCellClass}>
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
                      className={`${mgmtTableCellMutedSmClass} hidden md:table-cell`}
                      title={s.description ?? undefined}
                    >
                      <TableCellText>{s.description ?? "—"}</TableCellText>
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

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className={SHEET_BODY_CLASS}>
                <div className={SHEET_BODY_SCROLL_CLASS}>
                  <div className={cn("grid", SHEET_FORM_GAP, SHEET_FORM_PADDING)}>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className={cn("grid", SHEET_FIELD_GAP)}>
                          <FormLabel>{t("productsConfig.common.name")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("productsConfig.statusesConfig.namePlaceholder")}
                              disabled={saving}
                              className={SHEET_INPUT_CLASS}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem className={cn("grid", SHEET_FIELD_GAP)}>
                          <FormLabel>{t("productsConfig.statusesConfig.colorHex")}</FormLabel>
                          <div className="flex items-center gap-2">
                            <input
                              ref={colorInputRef}
                              type="color"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
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
                              style={{ backgroundColor: field.value }}
                              aria-label={t("productsConfig.statusesConfig.selectColor")}
                            />
                            <FormControl>
                              <Input
                                placeholder="#6b7280"
                                disabled={saving}
                                className={SHEET_INPUT_CLASS}
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="order"
                      render={({ field }) => (
                        <FormItem className={cn("grid", SHEET_FIELD_GAP)}>
                          <FormLabel>{t("productsConfig.common.order")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              disabled={saving}
                              className={SHEET_INPUT_CLASS}
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              value={field.value}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === "" ? 0 : Number(e.target.value)
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className={cn("grid", SHEET_FIELD_GAP)}>
                          <FormLabel>{t("productsConfig.common.description")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("productsConfig.statusesConfig.descPlaceholder")}
                              disabled={saving}
                              rows={3}
                              className={SHEET_INPUT_CLASS}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isDefault"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-2 space-y-0 pt-1">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(v) => field.onChange(v === true)}
                              disabled={saving}
                            />
                          </FormControl>
                          <FormLabel className="font-normal leading-none">
                            {t("productsConfig.statusesConfig.defaultBadge")}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
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
                    <Button type="submit" disabled={saving}>
                      {saving && !deleteMut.isPending ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : null}
                      {isCreate ? t("productsConfig.common.create") : t("productsConfig.common.save")}
                    </Button>
                  </div>
                </div>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

"use client";

import { useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { SHEET_CONTENT_CLASS, SHEET_INPUT_CLASS, SHEET_HEADER_CLASS, SHEET_BODY_CLASS, SHEET_BODY_SCROLL_CLASS, SHEET_FOOTER_CLASS, SHEET_FORM_GAP, SHEET_FORM_PADDING, SHEET_FIELD_GAP } from "@/config/sheet";
import { cn } from "@/lib/utils";
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
  MGMT_COLGROUP_5_PRODUCT_TYPES,
  mgmtTableLayoutClass,
  mgmtTableHeaderRowClass,
  mgmtTableHeadClass,
  mgmtTableCellClass,
  mgmtTableCellPrimaryClass,
  mgmtTableCellMutedSmClass,
  mgmtTableCellMutedXsClass,
  mgmtTableCellNumericClass,
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
import { Search, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/lib/locale-provider";
import { fetchAdminProductTypes } from "@/lib/api/admin/catalog";
import { adminMutationJson, adminDeleteAllowMissing } from "@/lib/api/admin/client";
import { TableWithPagination } from "@/components/table-with-pagination";
import { ManagementListLoading, TableEmptyMessageRow } from "@/components/management-list-states";
import { DeleteProductTypeDialog } from "./delete-product-type-dialog";
import type { ProductTypeItem } from "./types";
import { formatDateForDisplay } from "@/features/products/lib/field-utils";
import { managementAdminKeys } from "@/lib/query-keys";

async function fetchProductTypes(
  t: (key: string) => string
): Promise<ProductTypeItem[]> {
  return fetchAdminProductTypes(t, "productsConfig.productTypesConfig.loadFailed") as Promise<
    ProductTypeItem[]
  >;
}

async function createProductType(
  body: { name: string; description?: string | null },
  t: (key: string) => string
) {
  return adminMutationJson("/product-types", {
    method: "POST",
    body,
    fallbackError: t("productsConfig.productTypesConfig.createFailed"),
  });
}

async function updateProductType(
  id: string,
  body: { name?: string; description?: string | null },
  t: (key: string) => string
) {
  return adminMutationJson(`/product-types/${id}`, {
    method: "PATCH",
    body,
    fallbackError: t("productsConfig.productTypesConfig.saveFailed"),
  });
}

async function deleteProductType(id: string, t: (key: string) => string) {
  await adminDeleteAllowMissing(
    `/product-types/${id}`,
    t("productsConfig.productTypesConfig.deleteFailed")
  );
}

type ProductTypeFormValues = {
  name: string;
  description: string;
};

export function ProductTypesManagement() {
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ProductTypeItem | null>(null);
  const [isCreate, setIsCreate] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [saving, setSaving] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("validationRequired.productTypeName")),
        description: z.string(),
      }),
    [t]
  );

  const form = useForm<ProductTypeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  });

  const [pendingDeleteVt, setPendingDeleteVt] = useState<{
    id: string;
    name: string;
    productsCount: number;
    closeSheetAfter?: boolean;
  } | null>(null);

  const {
    data: productTypes = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: managementAdminKeys.productTypes,
    queryFn: () => fetchProductTypes(t),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return productTypes;
    const q = search.trim().toLowerCase();
    return productTypes.filter(
      (vt) =>
        vt.name.toLowerCase().includes(q) ||
        (vt.description ?? "").toLowerCase().includes(q)
    );
  }, [productTypes, search]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSearch(searchInput.trim());
    },
    [searchInput]
  );

  const createMut = useMutation({
    mutationFn: (body: Parameters<typeof createProductType>[0]) =>
      createProductType(body, t),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: managementAdminKeys.productTypes });
      const prev = queryClient.getQueryData<ProductTypeItem[]>(managementAdminKeys.productTypes);
      if (!prev) return { prev: undefined, optimisticId: "" };
      const optimisticId = `optimistic-vt-${Date.now()}`;
      const optimistic: ProductTypeItem = {
        id: optimisticId,
        categoryId: null,
        name: body.name.trim(),
        description: body.description?.trim() ?? null,
        isAutoDetected: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { products: 0 },
      };
      queryClient.setQueryData(managementAdminKeys.productTypes, [...prev, optimistic]);
      return { prev, optimisticId };
    },
    onError: (_e, _b, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(managementAdminKeys.productTypes, ctx.prev);
    },
    onSuccess: (data, _body, ctx) => {
      const row = data as ProductTypeItem;
      const list = queryClient.getQueryData<ProductTypeItem[]>(managementAdminKeys.productTypes);
      if (list && ctx?.optimisticId) {
        queryClient.setQueryData(
          managementAdminKeys.productTypes,
          list.map((vt) => (vt.id === ctx.optimisticId ? row : vt))
        );
      } else {
        void queryClient.invalidateQueries({ queryKey: managementAdminKeys.productTypes });
      }
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(t("toasts.productTypeCreated"));
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateProductType>[1] }) =>
      updateProductType(id, body, t),
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: managementAdminKeys.productTypes });
      const prev = queryClient.getQueryData<ProductTypeItem[]>(managementAdminKeys.productTypes);
      if (!prev) return { prev: undefined };
      queryClient.setQueryData(
        managementAdminKeys.productTypes,
        prev.map((vt) =>
          vt.id === id
            ? {
                ...vt,
                ...(body.name !== undefined && { name: body.name }),
                ...(body.description !== undefined && { description: body.description }),
              }
            : vt
        )
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(managementAdminKeys.productTypes, ctx.prev);
    },
    onSuccess: (data, { id }) => {
      const row = data as ProductTypeItem;
      const list = queryClient.getQueryData<ProductTypeItem[]>(managementAdminKeys.productTypes);
      if (list) {
        queryClient.setQueryData(
          managementAdminKeys.productTypes,
          list.map((vt) => (vt.id === id ? { ...vt, ...row } : vt))
        );
      }
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(t("toasts.productTypeSaved"));
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteProductType(id, t),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: managementAdminKeys.productTypes });
      const prev = queryClient.getQueryData<ProductTypeItem[]>(managementAdminKeys.productTypes);
      const removed = prev?.find((vt) => vt.id === id);
      if (prev) {
        queryClient.setQueryData(
          managementAdminKeys.productTypes,
          prev.filter((vt) => vt.id !== id)
        );
      }
      return { prev, removed };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(managementAdminKeys.productTypes, ctx.prev);
    },
    onSuccess: (_void, _id, ctx) => {
      if (ctx?.removed?.categoryId) {
        void queryClient.invalidateQueries({ queryKey: managementAdminKeys.categories });
      }
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(t("toasts.productTypeDeleted"));
    },
  });

  const openForCreate = () => {
    setSelectedType(null);
    setIsCreate(true);
    form.reset({ name: "", description: "" });
    setSheetOpen(true);
  };

  const openForEdit = (vt: ProductTypeItem) => {
    setSelectedType(vt);
    setIsCreate(false);
    form.reset({ name: vt.name, description: vt.description ?? "" });
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setSelectedType(null);
    setIsCreate(false);
    form.reset({ name: "", description: "" });
  };

  const onSubmit = async (values: ProductTypeFormValues) => {
    const trimmedName = values.name.trim();
    const desc = values.description.trim() || null;
    setSaving(true);
    try {
      if (isCreate) {
        await createMut.mutateAsync({
          name: trimmedName,
          description: desc,
        });
      } else if (selectedType) {
        await updateMut.mutateAsync({
          id: selectedType.id,
          body: {
            name: trimmedName,
            description: desc,
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

  const handleDelete = () => {
    if (!selectedType) return;
    setPendingDeleteVt({
      id: selectedType.id,
      name: selectedType.name,
      productsCount: selectedType._count?.products ?? 0,
      closeSheetAfter: true,
    });
  };

  const isEmpty = filtered.length === 0;
  const emptyMessage =
    productTypes.length === 0
      ? t("productsConfig.productTypesConfig.emptyCreate")
      : t("common.emptySearch");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        <form onSubmit={handleSearchSubmit} className="relative min-w-0 flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t("productsConfig.productTypesConfig.searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 pl-9 bg-background"
          />
        </form>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("productsConfig.productTypesConfig.addType")}
          onClick={openForCreate}
          className="shrink-0 size-9"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : t("productsConfig.productTypesConfig.loadFailed")}
        </p>
      )}

      {isLoading ? (
        <ManagementListLoading />
      ) : (
        <TableWithPagination>
          <Table className={mgmtTableLayoutClass}>
            <MgmtTableColGroup widths={MGMT_COLGROUP_5_PRODUCT_TYPES} />
            <TableHeader>
              <TableRow className={mgmtTableHeaderRowClass}>
                <TableHead className={mgmtTableHeadClass}>{t("productsConfig.common.name")}</TableHead>
                <TableHead className={`${mgmtTableHeadClass} hidden md:table-cell`}>
                  {t("productsConfig.common.description")}
                </TableHead>
                <TableHead className={mgmtTableHeadClass}>{t("productsConfig.productTypesConfig.productsCount")}</TableHead>
                <TableHead className={mgmtTableHeadClass}>{t("productsConfig.productTypesConfig.autoDetect")}</TableHead>
                <TableHead className={mgmtTableHeadClass}>{t("productsConfig.productTypesConfig.createdAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isEmpty ? (
                <TableEmptyMessageRow colSpan={5}>{emptyMessage}</TableEmptyMessageRow>
              ) : (
                filtered.map((vt) => (
                  <TableRow
                    key={vt.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openForEdit(vt)}
                  >
                    <TableCell className={mgmtTableCellPrimaryClass} title={vt.name}>
                      <TableCellText>{vt.name}</TableCellText>
                    </TableCell>
                    <TableCell
                      className={`${mgmtTableCellMutedSmClass} hidden md:table-cell`}
                      title={vt.description ?? undefined}
                    >
                      <TableCellText>{vt.description ?? "—"}</TableCellText>
                    </TableCell>
                    <TableCell className={mgmtTableCellNumericClass}>
                      <TableCellText className="tabular-nums">{vt._count?.products ?? 0}</TableCellText>
                    </TableCell>
                    <TableCell className={mgmtTableCellMutedSmClass}>
                      <TableCellText>
                        {vt.isAutoDetected ? t("productsConfig.productTypesConfig.yes") : t("productsConfig.productTypesConfig.no")}
                      </TableCellText>
                    </TableCell>
                    <TableCell className={mgmtTableCellMutedXsClass}>
                      <TableCellText>{formatDateForDisplay(vt.createdAt)}</TableCellText>
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
              {isCreate ? t("productsConfig.productTypesConfig.newType") : (selectedType?.name ?? t("productsConfig.productTypesConfig.typeLabel"))}
            </SheetTitle>
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
                              placeholder={t("productsConfig.productTypesConfig.namePlaceholder")}
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
                      name="description"
                      render={({ field }) => (
                        <FormItem className={cn("grid", SHEET_FIELD_GAP)}>
                          <FormLabel>{t("productsConfig.common.description")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("productsConfig.productTypesConfig.descPlaceholder")}
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
                  </div>
                </div>
              </div>

              <SheetFooter className={SHEET_FOOTER_CLASS}>
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                  <div>
                    {!isCreate && selectedType && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDelete}
                        disabled={saving}
                        className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                      >
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
                      {saving ? (
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
          if (pendingDeleteVt?.closeSheetAfter) closeSheet();
        }}
        onDelete={(id) => deleteMut.mutateAsync(id)}
      />
    </div>
  );
}

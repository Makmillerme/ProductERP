"use client";

import { useState, useCallback, useMemo } from "react";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/lib/locale-provider";
import { TableWithPagination } from "@/components/table-with-pagination";
import { DeleteProductTypeDialog } from "./delete-product-type-dialog";
import type { ProductTypeItem } from "./types";
import { formatDateForDisplay } from "@/features/products/lib/field-utils";

const PRODUCT_TYPES_KEY = ["admin", "product-types"] as const;

async function fetchProductTypes(
  t: (key: string) => string
): Promise<ProductTypeItem[]> {
  const res = await fetch("/api/admin/product-types");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? t("productsConfig.productTypesConfig.loadFailed"));
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.productTypes ?? data?.vehicleTypes ?? data ?? []);
}

async function createProductType(
  body: { name: string; description?: string | null },
  t: (key: string) => string
) {
  const res = await fetch("/api/admin/product-types", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? t("productsConfig.productTypesConfig.createFailed"));
  return data;
}

async function updateProductType(
  id: string,
  body: { name?: string; description?: string | null },
  t: (key: string) => string
) {
  const res = await fetch(`/api/admin/product-types/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? t("productsConfig.productTypesConfig.saveFailed"));
  return data;
}

async function deleteProductType(id: string, t: (key: string) => string) {
  const res = await fetch(`/api/admin/product-types/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? t("productsConfig.productTypesConfig.deleteFailed"));
  }
}

export function ProductTypesManagement() {
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ProductTypeItem | null>(null);
  const [isCreate, setIsCreate] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

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
    queryKey: PRODUCT_TYPES_KEY,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_TYPES_KEY });
      toast.success(t("toasts.productTypeCreated"));
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateProductType>[1] }) =>
      updateProductType(id, body, t),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_TYPES_KEY });
      toast.success(t("toasts.productTypeSaved"));
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteProductType(id, t),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_TYPES_KEY });
      toast.success(t("toasts.productTypeDeleted"));
    },
  });

  const openForCreate = () => {
    setSelectedType(null);
    setIsCreate(true);
    setName("");
    setDescription("");
    setSheetOpen(true);
  };

  const openForEdit = (vt: ProductTypeItem) => {
    setSelectedType(vt);
    setIsCreate(false);
    setName(vt.name);
    setDescription(vt.description ?? "");
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setSelectedType(null);
    setIsCreate(false);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error(t("validationRequired.productTypeName"));
      return;
    }
    setSaving(true);
    try {
      if (isCreate) {
        await createMut.mutateAsync({
          name: trimmedName,
          description: description.trim() || null,
        });
      } else if (selectedType) {
        await updateMut.mutateAsync({
          id: selectedType.id,
          body: {
            name: trimmedName,
            description: description.trim() || null,
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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <TableWithPagination>
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="h-11 px-3 text-left align-middle">{t("productsConfig.common.name")}</TableHead>
                <TableHead className="h-11 px-3 text-left align-middle hidden md:table-cell">
                  {t("productsConfig.common.description")}
                </TableHead>
                <TableHead className="h-11 px-3 text-left align-middle w-20">{t("productsConfig.productTypesConfig.productsCount")}</TableHead>
                <TableHead className="h-11 px-3 text-left align-middle w-28">{t("productsConfig.productTypesConfig.autoDetect")}</TableHead>
                <TableHead className="h-11 px-3 text-left align-middle w-32">{t("productsConfig.productTypesConfig.createdAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isEmpty ? (
                <TableRow key="empty" className="hover:bg-transparent">
                  <TableCell plain colSpan={5} className="h-24 align-middle">
                    <div className="flex min-h-[8rem] w-full flex-col items-center justify-center gap-2 py-10 text-center">
                      <p className="text-sm text-muted-foreground px-4">{emptyMessage}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((vt) => (
                  <TableRow
                    key={vt.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openForEdit(vt)}
                  >
                    <TableCell className="h-11 px-3 text-left align-middle font-medium">
                      {vt.name}
                    </TableCell>
                    <TableCell
                      className="h-11 px-3 text-left align-middle text-muted-foreground text-sm truncate hidden md:table-cell"
                      title={vt.description ?? undefined}
                    >
                      {vt.description ?? "—"}
                    </TableCell>
                    <TableCell className="h-11 px-3 text-left align-middle text-muted-foreground text-sm tabular-nums">
                      {vt._count?.products ?? 0}
                    </TableCell>
                    <TableCell className="h-11 px-3 text-left align-middle text-muted-foreground text-sm">
                      {vt.isAutoDetected ? t("productsConfig.productTypesConfig.yes") : t("productsConfig.productTypesConfig.no")}
                    </TableCell>
                    <TableCell className="h-11 px-3 text-left align-middle text-muted-foreground text-xs">
                      {formatDateForDisplay(vt.createdAt)}
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

          <div className={SHEET_BODY_CLASS}>
            <div className={SHEET_BODY_SCROLL_CLASS}>
              <div className={cn("grid", SHEET_FORM_GAP, SHEET_FORM_PADDING)}>
                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="vt-name">{t("productsConfig.common.name")}</Label>
                  <Input
                    id="vt-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("productsConfig.productTypesConfig.namePlaceholder")}
                    disabled={saving}
                    className={SHEET_INPUT_CLASS}
                  />
                </div>
                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="vt-desc">{t("productsConfig.common.description")}</Label>
                  <Textarea
                    id="vt-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("productsConfig.productTypesConfig.descPlaceholder")}
                    disabled={saving}
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
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  {isCreate ? t("productsConfig.common.create") : t("productsConfig.common.save")}
                </Button>
              </div>
            </div>
          </SheetFooter>
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

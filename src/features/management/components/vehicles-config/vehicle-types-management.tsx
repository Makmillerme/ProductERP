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
import { slugify } from "@/lib/slugify";
import { TableWithPagination } from "@/components/table-with-pagination";
import { DeleteVehicleTypeDialog } from "./delete-vehicle-type-dialog";
import type { VehicleTypeItem } from "./types";

const VEHICLE_TYPES_KEY = ["admin", "vehicle-types"] as const;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("uk-UA", { dateStyle: "short" });
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

async function createVehicleType(body: {
  name: string;
  code: string;
  description?: string | null;
}) {
  const res = await fetch("/api/admin/vehicle-types", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Помилка створення типу авто");
  return data;
}

async function updateVehicleType(
  id: string,
  body: { name?: string; code?: string; description?: string | null }
) {
  const res = await fetch(`/api/admin/vehicle-types/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Помилка збереження типу авто");
  return data;
}

async function deleteVehicleType(id: string) {
  const res = await fetch(`/api/admin/vehicle-types/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Помилка видалення типу авто");
  }
}

export function VehicleTypesManagement() {
  const queryClient = useQueryClient();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<VehicleTypeItem | null>(null);
  const [isCreate, setIsCreate] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pendingDeleteVt, setPendingDeleteVt] = useState<{
    id: string;
    name: string;
    vehiclesCount: number;
    closeSheetAfter?: boolean;
  } | null>(null);

  const {
    data: vehicleTypes = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: VEHICLE_TYPES_KEY,
    queryFn: fetchVehicleTypes,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return vehicleTypes;
    const q = search.trim().toLowerCase();
    return vehicleTypes.filter(
      (vt) =>
        vt.name.toLowerCase().includes(q) ||
        vt.code.toLowerCase().includes(q) ||
        (vt.description ?? "").toLowerCase().includes(q)
    );
  }, [vehicleTypes, search]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSearch(searchInput.trim());
    },
    [searchInput]
  );

  const createMut = useMutation({
    mutationFn: createVehicleType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICLE_TYPES_KEY });
      toast.success("Тип авто створено");
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateVehicleType>[1] }) =>
      updateVehicleType(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICLE_TYPES_KEY });
      toast.success("Тип авто збережено");
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteVehicleType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICLE_TYPES_KEY });
      toast.success("Тип авто видалено");
    },
  });

  const openForCreate = () => {
    setSelectedType(null);
    setIsCreate(true);
    setName("");
    setCode("");
    setDescription("");
    setCodeManuallyEdited(false);
    setSheetOpen(true);
  };

  const openForEdit = (vt: VehicleTypeItem) => {
    setSelectedType(vt);
    setIsCreate(false);
    setName(vt.name);
    setCode(vt.code);
    setDescription(vt.description ?? "");
    setCodeManuallyEdited(true);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setSelectedType(null);
    setIsCreate(false);
  };

  useEffect(() => {
    if (isCreate && !codeManuallyEdited) {
      setCode(slugify(name));
    }
  }, [name, isCreate, codeManuallyEdited]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedCode = code.trim();
    if (!trimmedName || !trimmedCode) {
      toast.error("Вкажіть назву та код типу авто");
      return;
    }

    setSaving(true);
    try {
      if (isCreate) {
        await createMut.mutateAsync({
          name: trimmedName,
          code: trimmedCode,
          description: description.trim() || null,
        });
      } else if (selectedType) {
        await updateMut.mutateAsync({
          id: selectedType.id,
          body: {
            name: trimmedName,
            code: trimmedCode,
            description: description.trim() || null,
          },
        });
      }
      closeSheet();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!selectedType) return;
    setPendingDeleteVt({
      id: selectedType.id,
      name: selectedType.name,
      vehiclesCount: selectedType._count?.products ?? 0,
      closeSheetAfter: true,
    });
  };

  const isEmpty = filtered.length === 0;
  const emptyMessage =
    vehicleTypes.length === 0
      ? "Ще немає типів авто. Натисніть «+», щоб додати перший."
      : "За пошуком нічого не знайдено.";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        <form onSubmit={handleSearchSubmit} className="relative min-w-0 flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Пошук по назві, коду або опису…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 pl-9 bg-background"
          />
        </form>
        <Button
          variant="outline"
          size="icon"
          aria-label="Додати тип авто"
          onClick={openForCreate}
          className="shrink-0 size-9"
        >
          <Plus className="size-4" />
        </Button>
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
        <TableWithPagination>
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="h-11 px-3 text-left align-middle">Назва</TableHead>
                <TableHead className="h-11 px-3 text-left align-middle">Код</TableHead>
                <TableHead className="h-11 px-3 text-left align-middle hidden md:table-cell">
                  Опис
                </TableHead>
                <TableHead className="h-11 px-3 text-left align-middle w-20">Авто</TableHead>
                <TableHead className="h-11 px-3 text-left align-middle w-28">Автодетект</TableHead>
                <TableHead className="h-11 px-3 text-left align-middle w-32">Дата створення</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isEmpty ? (
                <TableRow key="empty" className="hover:bg-transparent">
                  <TableCell plain colSpan={6} className="h-24 align-middle">
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
                    <TableCell className="h-11 px-3 text-left align-middle text-muted-foreground text-sm">
                      {vt.code}
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
                      {vt.isAutoDetected ? "Так" : "Ні"}
                    </TableCell>
                    <TableCell className="h-11 px-3 text-left align-middle text-muted-foreground text-xs">
                      {formatDate(vt.createdAt)}
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
              {isCreate ? "Новий тип авто" : (selectedType?.name ?? "Тип авто")}
            </SheetTitle>
          </SheetHeader>

          <div className={SHEET_BODY_CLASS}>
            <div className={SHEET_BODY_SCROLL_CLASS}>
              <div className={cn("grid", SHEET_FORM_GAP, SHEET_FORM_PADDING)}>
                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="vt-name">Назва</Label>
                  <Input
                    id="vt-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Наприклад: Тягач"
                    disabled={saving}
                    className={SHEET_INPUT_CLASS}
                  />
                </div>
                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="vt-code">Код</Label>
                  <Input
                    id="vt-code"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (isCreate) setCodeManuallyEdited(true);
                    }}
                    placeholder="Наприклад: tyagach"
                    disabled={saving}
                    className={SHEET_INPUT_CLASS}
                  />
                  {isCreate && (
                    <p className="text-xs text-muted-foreground">
                      Генерується автоматично з назви
                    </p>
                  )}
                </div>
                <div className={cn("grid", SHEET_FIELD_GAP)}>
                  <Label htmlFor="vt-desc">Опис (необовʼязково)</Label>
                  <Textarea
                    id="vt-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Короткий опис типу авто"
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
                  {saving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  {isCreate ? "Створити" : "Зберегти"}
                </Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
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
          if (pendingDeleteVt?.closeSheetAfter) closeSheet();
        }}
        onDelete={(id) => deleteMut.mutateAsync(id)}
      />
    </div>
  );
}

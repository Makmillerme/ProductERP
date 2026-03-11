"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogBody,
} from "@/components/ui/alert-dialog";
import { SHEET_CONTENT_CLASS, SHEET_HEADER_CLASS, SHEET_BODY_CLASS, SHEET_FOOTER_CLASS, SHEET_TABS_GAP, SHEET_TABS_CONTENT_MT, SHEET_SCROLL_CLASS } from "@/config/sheet";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { ScrollableTabsList } from "@/components/ui/scrollable-tabs-list";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product } from "../types";
import { fetchVehicleById } from "../api";
import { vehiclesKeys, VEHICLE_DETAIL_STALE_MS } from "../queries";
import { DynamicFieldRenderer } from "./dynamic-field-renderer";
import { useVehicleConfig, type VehicleConfigTab } from "../hooks/use-vehicle-config";
import { useQuery } from "@tanstack/react-query";

type VehicleDetailSheetProps = {
  vehicle: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Поверніть створене/оновлене товар після збереження (для завантаження pending-медіа після створення). */
  onSave?: (data: Product, isCreate: boolean) => Promise<Product | void>;
  onDelete?: (id: number) => Promise<void>;
};

const EMPTY_EDIT: Product = {
  id: 0,
  processed_file_id: null,
  payload_json: "{}",
  pdf_url: null,
  brief_pdf_path: null,
  status: null,
  vin: null,
  serial_number: null,
  product_type: null,
  brand: null,
  model: null,
  modification: null,
  year_model: null,
  producer_country: null,
  location: null,
  description: null,
  gross_weight_kg: null,
  payload_kg: null,
  engine_cm3: null,
  power_kw: null,
  wheel_formula: null,
  seats: null,
  transmission: null,
  mileage: null,
  body_type: null,
  condition: null,
  fuel_type: null,
  cargo_dimensions: null,
  mrn: null,
  uktzed: null,
  create_at_ccd: null,
  created_at: "",
  customs_value: null,
  customs_value_plus_10_vat: null,
  customs_value_plus_20_vat: null,
  cost_without_vat: null,
  cost_with_vat: null,
  vat_amount: null,
  currency: null,
};

type DocumentFolder = { id: string; label: string };

function parseDocumentFoldersFromPresetValues(presetValues: string | null): DocumentFolder[] {
  if (!presetValues?.trim()) return [];
  try {
    const parsed = JSON.parse(presetValues) as { folders?: { code: string; label: string }[] };
    const folders = parsed?.folders;
    if (!Array.isArray(folders)) return [];
    return folders
      .filter((f) => typeof f === "object" && f !== null && typeof (f as { code?: string }).code === "string")
      .map((f) => ({ id: (f as { code: string }).code, label: (f as { label?: string }).label ?? (f as { code: string }).code }));
  } catch {
    return [];
  }
}

function parseDocumentFoldersFromTabConfig(tabConfig: string | null): DocumentFolder[] {
  if (!tabConfig?.trim()) return [];
  try {
    const parsed = JSON.parse(tabConfig) as { folders?: { code: string; label: string }[] };
    const folders = parsed?.folders;
    if (!Array.isArray(folders)) return [];
    return folders
      .filter((f) => typeof f === "object" && f !== null && typeof (f as { code?: string }).code === "string")
      .map((f) => ({ id: (f as { code: string }).code, label: (f as { label?: string }).label ?? (f as { code: string }).code }));
  } catch {
    return [];
  }
}

function getDocumentFoldersForField(
  field: { fieldDefinition: { presetValues: string | null } },
  tabConfig: string | null
): DocumentFolder[] {
  const fromPreset = parseDocumentFoldersFromPresetValues(field.fieldDefinition.presetValues);
  if (fromPreset.length > 0) return fromPreset;
  return parseDocumentFoldersFromTabConfig(tabConfig);
}

type DynamicTabsProps = {
  tabs: VehicleConfigTab[] | null;
  edit: Product;
  update: <K extends keyof Product>(key: K, value: Product[K]) => void;
  saving: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

function DynamicTabs({
  tabs,
  edit,
  update,
  saving,
  activeTab,
  setActiveTab,
}: DynamicTabsProps) {
  const configTabs = tabs ?? [];
  const defaultTab = configTabs[0]?.code ?? "";

  if (configTabs.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Немає табів для відображення.
        </p>
        <p className="text-xs text-muted-foreground/80">
          Створіть категорію, таби та поля в розділі «Модель даних».
        </p>
      </div>
    );
  }

  return (
    <Tabs value={configTabs.some((t) => t.code === activeTab) ? activeTab : defaultTab} onValueChange={setActiveTab} className={cn("flex min-h-0 flex-1 flex-col", SHEET_TABS_GAP)}>
      <ScrollableTabsList variant="line">
        {configTabs.map((tab) => (
          <TabsTrigger key={tab.code} value={tab.code} className="flex-1 min-w-0 shrink-0 text-xs sm:text-sm">
            {tab.name}
          </TabsTrigger>
        ))}
      </ScrollableTabsList>

      {configTabs.map((tab) => (
        <TabsContent key={tab.code} value={tab.code} className={cn(SHEET_TABS_CONTENT_MT, "flex-1 min-w-0 p-2 data-[state=inactive]:hidden", SHEET_SCROLL_CLASS)}>
          <div className="grid grid-cols-1 gap-3 px-3 py-2 sm:grid-cols-2 sm:gap-4">
            {tab.fields.map((f) => (
              <DynamicFieldRenderer
                key={f.id}
                field={f}
                vehicle={edit}
                onUpdate={update}
                disabled={saving}
                tabActive={activeTab === tab.code}
                documentFolders={getDocumentFoldersForField(f, tab.tabConfig)}
              />
            ))}
            {tab.fields.length === 0 && (
              <p className="col-span-full text-sm text-muted-foreground py-4 text-center">
                Немає полів для відображення. Додайте поля в розділі «Модель даних».
              </p>
            )}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function VehicleDetailSheet({
  vehicle,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: VehicleDetailSheetProps) {
  const [edit, setEdit] = useState<Product>(EMPTY_EDIT);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("vehicle");
  const requestedVehicleIdRef = useRef<number | null>(null);
  const queryClient = useQueryClient();

  const { data: defaultVehicleType } = useQuery({
    queryKey: ["vehicle-config", "default-type"],
    queryFn: async () => {
      const res = await fetch("/api/vehicle-config/default", { cache: "no-store" });
      if (!res.ok) return null;
      return res.json() as Promise<{ id: string; name: string; code: string }>;
    },
    staleTime: 10 * 60 * 1000,
  });

  const vehicleTypeId = defaultVehicleType?.id ?? null;
  const { data: vehicleConfig } = useVehicleConfig(vehicleTypeId);

  useEffect(() => {
    const tabs = vehicleConfig?.tabs ?? [];
    if (tabs.length > 0 && !tabs.some((t) => t.code === activeTab)) {
      setActiveTab(tabs[0]!.code);
    }
  }, [vehicleConfig?.tabs, activeTab]);

  useEffect(() => {
    if (!open) return;
    if (vehicle) {
      if (vehicle.id > 0) {
        requestedVehicleIdRef.current = vehicle.id;
        // Одразу показуємо дані поточного авто без медіа, щоб не показувати чужих фото з попереднього стану.
        setEdit({ ...vehicle, media: [] });
        const openedId = vehicle.id;
        queryClient
          .fetchQuery({
            queryKey: vehiclesKeys.detail(vehicle.id),
            queryFn: () => fetchVehicleById(vehicle.id),
            staleTime: VEHICLE_DETAIL_STALE_MS,
          })
          .then((full) => {
            if (full && requestedVehicleIdRef.current === openedId) setEdit({ ...full });
          })
          .catch(() => {
            setEdit((prev) => (prev.id === openedId ? { ...prev, media: [] } : prev));
          });
      } else {
        requestedVehicleIdRef.current = null;
        setEdit({ ...vehicle });
      }
    } else {
      requestedVehicleIdRef.current = null;
      setEdit(EMPTY_EDIT);
    }
  }, [open, vehicle, queryClient]);

  const update = useCallback(<K extends keyof Product>(key: K, value: Product[K]) => {
    setEdit((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    if (!onSave) {
      onOpenChange(false);
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      await onSave(edit, vehicle == null);
      onOpenChange(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete || !vehicle) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await onDelete(vehicle.id);
      setDeleteDialogOpen(false);
      onOpenChange(false);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Помилка видалення");
    } finally {
      setDeleting(false);
    }
  };

  const title =
    vehicle == null
      ? "Додати авто"
      : edit.brand || edit.model
        ? [edit.brand, edit.model].filter(Boolean).join(" ") || "Картка авто"
        : "Картка авто";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className={SHEET_CONTENT_CLASS}
          aria-describedby={undefined}
          onPointerDownOutside={(e) => {
            if ((e.target as Element)?.closest?.("[data-calculator-root]")) e.preventDefault();
          }}
        >
          <SheetHeader className={SHEET_HEADER_CLASS}>
            <SheetTitle className="text-base font-semibold sm:text-lg">{title}</SheetTitle>
          </SheetHeader>

          <div className={SHEET_BODY_CLASS}>
            <DynamicTabs
              tabs={vehicleConfig?.tabs ?? null}
              edit={edit}
              update={update}
              saving={saving}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>

          <SheetFooter className={SHEET_FOOTER_CLASS}>
            {saveError && (
              <p className="text-destructive text-sm w-full">{saveError}</p>
            )}
            <div className="flex w-full flex-wrap items-center gap-2">
              {vehicle != null && onDelete != null && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleDeleteClick}
                  disabled={saving}
                >
                  Видалити
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto sm:ml-auto"
              >
                {saving ? "Збереження…" : "Зберегти"}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити авто?</AlertDialogTitle>
            <AlertDialogDescription>
              Цю дію не можна скасувати. Запис буде видалено з бази.
              {vehicle && (edit.brand || edit.model)
                ? ` (${[edit.brand, edit.model].filter(Boolean).join(" ")})`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <AlertDialogBody>
              <p className="text-sm text-destructive">{deleteError}</p>
            </AlertDialogBody>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Видалення…" : "Видалити"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

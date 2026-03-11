"use client";

import { useRef, useMemo, useCallback } from "react";
import { useStatuses } from "../hooks/use-statuses";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VehicleMediaGallery } from "./vehicle-media-gallery";
import { VehicleMediaUploader, type VehicleMediaUploaderRef } from "./vehicle-media-uploader";
import { VehicleDocumentsTab, type DocumentFolderConfig } from "./vehicle-documents-tab";
import { uploadVehicleMedia, deleteVehicleMedia } from "../api";
import { cn } from "@/lib/utils";
import { parseCompositePresetValues } from "@/config/composite-field";
import { parseValidationJson, getTextValidationPattern } from "@/config/field-constructor";
import { parsePresetValues } from "../lib/field-utils";
import {
  SelectField,
  RadioField,
  MultiselectField,
  DateField,
  NumberInput,
  TextInput,
  TextareaField,
  CalculatedField,
} from "./widgets";
import type { Product } from "../types";
import type { VehicleConfigTabField } from "../hooks/use-vehicle-config";

type DynamicFieldRendererProps = {
  field: VehicleConfigTabField;
  vehicle: Product;
  onUpdate: <K extends keyof Product>(key: K, value: Product[K]) => void;
  disabled?: boolean;
  /** Для file_upload: чи таб активний (для коректного рендеру VehicleDocumentsTab). */
  tabActive?: boolean;
  /** Для file_upload: папки з tabConfig табу. */
  documentFolders?: DocumentFolderConfig[];
};

function getVehicleValue(vehicle: Product, key: string): unknown {
  return (vehicle as Record<string, unknown>)[key];
}

function CargoDimensionsField({
  vehicle,
  onUpdate,
  disabled,
  label,
}: {
  vehicle: Product;
  onUpdate: DynamicFieldRendererProps["onUpdate"];
  disabled?: boolean;
  label: string;
}) {
  const raw = vehicle.cargo_dimensions ?? "";
  const parts = raw.split(/\s*[×xX]\s*/).map((p) => p.trim());

  const handlePart = (index: number, value: string) => {
    const current = (vehicle.cargo_dimensions ?? "")
      .split(/\s*[×xX]\s*/)
      .map((p) => p.trim());
    const next = [current[0] ?? "", current[1] ?? "", current[2] ?? ""];
    next[index] = value;
    onUpdate(
      "cargo_dimensions",
      next.some(Boolean) ? next.join(" × ") : null,
    );
  };

  return (
    <div className="grid gap-2 sm:col-span-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="number"
          step="any"
          placeholder="Довжина"
          className="min-w-0 flex-1"
          value={parts[0] ?? ""}
          onChange={(e) => handlePart(0, e.target.value)}
          disabled={disabled}
        />
        <span className="shrink-0 text-muted-foreground">×</span>
        <Input
          type="number"
          step="any"
          placeholder="Ширина"
          className="min-w-0 flex-1"
          value={parts[1] ?? ""}
          onChange={(e) => handlePart(1, e.target.value)}
          disabled={disabled}
        />
        <span className="shrink-0 text-muted-foreground">×</span>
        <Input
          type="number"
          step="any"
          placeholder="Висота"
          className="min-w-0 flex-1"
          value={parts[2] ?? ""}
          onChange={(e) => handlePart(2, e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function parseCompositeValue(
  raw: string | null | undefined,
  subFieldCodes: string[]
): Record<string, string | number | null> {
  const s = String(raw ?? "").trim();
  if (!s) return {};
  try {
    const parsed = JSON.parse(s) as unknown;
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed))
      return parsed as Record<string, string | number | null>;
  } catch {
    /* fallback to × format for legacy cargo_dimensions */
  }
  const parts = s.split(/\s*[×xX]\s*/).map((p) => p.trim());
  const obj: Record<string, string | number | null> = {};
  parts.forEach((p, i) => {
    const code = subFieldCodes[i] ?? `field_${i}`;
    obj[code] = p ? (Number.isNaN(Number(p)) ? p : Number(p)) : null;
  });
  return obj;
}

function CompositeField({
  vehicle,
  onUpdate,
  disabled,
  label,
  vehicleKey,
  presetValues,
  colSpanClass,
}: {

  vehicle: Product;
  onUpdate: DynamicFieldRendererProps["onUpdate"];
  disabled?: boolean;
  label: string;
  vehicleKey: keyof Product;
  presetValues: string | null;
  colSpanClass: string;
}) {
  const config = parseCompositePresetValues(presetValues);
  const raw = String((vehicle as Record<string, unknown>)[vehicleKey] ?? "");
  const subFieldCodes = config.subFields.map((sf) => sf.code);
  const values = parseCompositeValue(raw, subFieldCodes);

  const handleSubChange = (code: string, value: string | number | null) => {
    const next = { ...values, [code]: value };
    const hasAny = Object.values(next).some((v) => v !== null && v !== "");
    onUpdate(
      vehicleKey,
      (hasAny ? JSON.stringify(next) : null) as Product[typeof vehicleKey]
    );
  };

  if (config.subFields.length === 0) {
    return (
      <div className={cn("grid gap-2", colSpanClass)}>
        <Label>{label}</Label>
        <Input disabled placeholder="Налаштуйте підполя" className="bg-muted" />
      </div>
    );
  }

  const layoutClass =
    config.layout === "column"
      ? "flex flex-col gap-2"
      : config.layout === "grid"
        ? "grid gap-2"
        : "flex flex-wrap items-center gap-2";

  const gridStyle =
    config.layout === "grid"
      ? {
          gridTemplateColumns: `repeat(${config.gridColumns ?? 3}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${config.gridRows ?? 1}, auto)`,
        }
      : undefined;

  return (
    <div className={cn("grid gap-2", colSpanClass)}>
      <Label>{label}</Label>
      <div className={layoutClass} style={gridStyle}>
        {config.subFields.map((sf) => {
          const subPlaceholder = sf.placeholder ?? sf.label;
          const subValue = values[sf.code];
          const displayValue =
            subValue != null && subValue !== ""
              ? subValue
              : (sf.defaultValue ?? "");
          const opts = parsePresetValues(sf.presetValues ?? null);
          const compact = true;

          switch (sf.widgetType) {
            case "calculated": {
              const compositeObj = Object.fromEntries(
                config.subFields.map((s) => [
                  s.code,
                  values[s.code] ?? (s.code === sf.code ? 0 : 0),
                ])
              );
              const fakeVehicle = { ...vehicle, ...compositeObj } as Record<string, unknown>;
              return (
                <div key={sf.code}>
                  <CalculatedField
                    formula={sf.validation ?? null}
                    vehicle={fakeVehicle}
                    label={sf.label}
                    unit={sf.unit}
                    compact={compact}
                  />
                </div>
              );
            }
            case "select":
              return (
                <div key={sf.code}>
                  <SelectField
                    value={String(subValue ?? "")}
                    options={opts}
                    onChange={(v) => handleSubChange(sf.code, v)}
                    disabled={disabled}
                    label={sf.label}
                    placeholder={subPlaceholder}
                    compact={compact}
                  />
                </div>
              );
            case "radio":
              return (
                <div key={sf.code}>
                  <RadioField
                    value={String(subValue ?? "")}
                    options={opts}
                    onChange={(v) => handleSubChange(sf.code, v)}
                    disabled={disabled}
                    label={sf.label}
                    name={sf.code}
                    compact={compact}
                  />
                </div>
              );
            case "multiselect":
              return (
                <div key={sf.code}>
                  <MultiselectField
                    value={String(subValue ?? "")}
                    options={opts}
                    onChange={(v) => handleSubChange(sf.code, v)}
                    disabled={disabled}
                    label={sf.label}
                    compact={compact}
                  />
                </div>
              );
            case "number_input": {
              const subVal = parseValidationJson(sf.validation ?? null);
              const subMin = subVal.min;
              const subMax = subVal.max;
              const subStep = subVal.step;
              const subDecimals = subVal.decimalPlaces;
              const subThousandSep = subVal.useThousandSeparator;
              const subRequired = subVal.required;
              return (
                <div key={sf.code}>
                  <NumberInput
                    value={displayValue != null ? displayValue : undefined}
                    onChange={(v) => handleSubChange(sf.code, v)}
                    disabled={disabled}
                    label={sf.label}
                    placeholder={subPlaceholder}
                    unit={sf.unit}
                    dataType={sf.dataType === "float" ? "float" : "integer"}
                    compact={compact}
                    min={typeof subMin === "number" ? subMin : undefined}
                    max={typeof subMax === "number" ? subMax : undefined}
                    step={typeof subStep === "number" ? subStep : undefined}
                    decimalPlaces={typeof subDecimals === "number" ? subDecimals : undefined}
                    useThousandSeparator={!!subThousandSep}
                    required={!!subRequired}
                  />
                </div>
              );
            }
            case "text_input": {
              const subVal = parseValidationJson(sf.validation ?? null);
              const subMinL = subVal.minLength;
              const subMaxL = subVal.maxLength;
              const subRequired = subVal.required;
              const subFormat = subVal.format;
              const subPattern = subVal.pattern;
              const subPatternMsg = subVal.patternMessage;
              const subPatternResolved = getTextValidationPattern(
                typeof subFormat === "string" ? subFormat : undefined,
                typeof subPattern === "string" ? subPattern : undefined
              );
              const subPatternMessage = typeof subPatternMsg === "string" && subPatternMsg.trim() ? subPatternMsg.trim() : undefined;
              return (
                <div key={sf.code}>
                  <TextInput
                    value={displayValue != null ? String(displayValue) : ""}
                    onChange={(v) => handleSubChange(sf.code, v)}
                    disabled={disabled}
                    label={sf.label}
                    placeholder={subPlaceholder}
                    compact={compact}
                    minLength={typeof subMinL === "number" ? subMinL : undefined}
                    maxLength={typeof subMaxL === "number" ? subMaxL : undefined}
                    required={!!subRequired}
                    pattern={subPatternResolved}
                    patternMessage={subPatternMessage}
                  />
                </div>
              );
            }
            case "textarea": {
              const subVal = parseValidationJson(sf.validation ?? null);
              const subMinL = subVal.minLength;
              const subMaxL = subVal.maxLength;
              const subMinR = subVal.minRows;
              const subMaxR = subVal.maxRows;
              const subRequired = subVal.required;
              return (
                <div key={sf.code}>
                  <TextareaField
                    value={String(displayValue ?? "")}
                    onChange={(v) => handleSubChange(sf.code, v)}
                    disabled={disabled}
                    label={sf.label}
                    placeholder={subPlaceholder}
                    rows={2}
                    compact={compact}
                    minLength={typeof subMinL === "number" ? subMinL : undefined}
                    maxLength={typeof subMaxL === "number" ? subMaxL : undefined}
                    minRows={typeof subMinR === "number" ? subMinR : undefined}
                    maxRows={typeof subMaxR === "number" ? subMaxR : undefined}
                    required={!!subRequired}
                  />
                </div>
              );
            }
            case "datepicker": {
              const subValDate = parseValidationJson(sf.validation ?? null);
              const subRequiredDate = subValDate.required;
              return (
                <div key={sf.code}>
                  <DateField
                    value={(values[sf.code] as string | null) ?? sf.defaultValue ?? null}
                    onChange={(v) => handleSubChange(sf.code, v)}
                    disabled={disabled}
                    label={sf.label}
                    placeholder={sf.placeholder ?? undefined}
                    compact={compact}
                    mode={sf.dataType === "datetime" ? "datetime" : "date"}
                    required={!!subRequiredDate}
                  />
                </div>
              );
            }
            default: {
              const subVal = parseValidationJson(sf.validation ?? null);
              const subMinL = subVal.minLength;
              const subMaxL = subVal.maxLength;
              return (
                <div key={sf.code}>
                  <TextInput
                    value={displayValue != null ? String(displayValue) : ""}
                    onChange={(v) => handleSubChange(sf.code, v)}
                    disabled={disabled}
                    label={sf.label}
                    placeholder={subPlaceholder}
                    compact={compact}
                    minLength={typeof subMinL === "number" ? subMinL : undefined}
                    maxLength={typeof subMaxL === "number" ? subMaxL : undefined}
                  />
                </div>
              );
            }
          }
        })}
      </div>
    </div>
  );
}

function MediaGalleryField({
  vehicle,
  onUpdate,
  disabled,
  sectionHeader,
  colSpanClass,
  displayLabel,
}: {
  vehicle: Product;
  onUpdate: DynamicFieldRendererProps["onUpdate"];
  disabled?: boolean;
  sectionHeader: React.ReactNode;
  colSpanClass: string;
  displayLabel: string;
}) {
  const mediaUploaderRef = useRef<VehicleMediaUploaderRef>(null);
  const mediaItems = useMemo(
    () =>
      (vehicle.media ?? []).map((m) => ({
        path: m.path,
        kind: (m.kind ?? "image") as "image" | "video",
      })),
    [vehicle.media]
  );
  const handleUpload = useCallback(
    async (file: File) => {
      const created = await uploadVehicleMedia(vehicle.id, file);
      onUpdate("media", [...(vehicle.media ?? []), created]);
    },
    [vehicle.id, vehicle.media, onUpdate]
  );
  const handleAddClick = useCallback(() => {
    mediaUploaderRef.current?.openFileDialog();
  }, []);
  const handleDelete = useCallback(
    async (index: number) => {
      const m = (vehicle.media ?? [])[index];
      if (m?.id == null) return;
      await deleteVehicleMedia(vehicle.id, m.id);
      onUpdate("media", (vehicle.media ?? []).filter((_, i) => i !== index));
    },
    [vehicle.id, vehicle.media, onUpdate]
  );
  return (
    <>
      {sectionHeader}
      <div className={cn("col-span-full space-y-2", colSpanClass)}>
        <Label>{displayLabel}</Label>
        {vehicle.id > 0 ? (
          <>
            <VehicleMediaUploader
              ref={mediaUploaderRef}
              vehicleId={vehicle.id}
              onUpload={handleUpload}
              onAddPending={() => {}}
              disabled={disabled}
              hideButton
            />
            <VehicleMediaGallery
              items={mediaItems}
              onAddClick={handleAddClick}
              addDisabled={disabled}
              onDelete={disabled ? undefined : handleDelete}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            Збережіть картку, щоб додати фото та відео.
          </p>
        )}
      </div>
    </>
  );
}

export function DynamicFieldRenderer({
  field,
  vehicle,
  onUpdate,
  disabled,
  tabActive = true,
  documentFolders = [],
}: DynamicFieldRendererProps) {
  const { options: statusOptions } = useStatuses();
  const { fieldDefinition } = field;
  const {
    code,
    label,
    dataType,
    widgetType,
    isSystem,
    systemColumn,
    presetValues,
    validation,
    unit,
    placeholder,
    defaultValue,
    hiddenOnCard,
  } = fieldDefinition;

  if (
    (widgetType === "number_input" || widgetType === "calculated") &&
    hiddenOnCard
  ) {
    return null;
  }

  const showUnitInLabel = dataType !== "string" && unit;
  const displayLabel = showUnitInLabel ? `${label} (${unit})` : label;
  const colSpanClass = field.colSpan === 2 ? "sm:col-span-2" : "";
  const validationValues = parseValidationJson(validation ?? null);

  const sectionHeader = field.sectionTitle ? (
    <h3 className="col-span-full mt-2 text-sm font-medium text-muted-foreground first:mt-0">
      {field.sectionTitle}
    </h3>
  ) : null;

  if (widgetType === "media_gallery") {
    return (
      <MediaGalleryField
        vehicle={vehicle}
        onUpdate={onUpdate}
        disabled={disabled}
        sectionHeader={sectionHeader}
        colSpanClass={colSpanClass}
        displayLabel={displayLabel}
      />
    );
  }

  if (widgetType === "file_upload") {
    return (
      <>
        {sectionHeader}
        <div className={cn("col-span-full", colSpanClass)}>
          <Label>{displayLabel}</Label>
          {vehicle.id > 0 ? (
            <div className="mt-2">
              <VehicleDocumentsTab
                vehicleId={vehicle.id}
                active={tabActive ?? true}
                folders={documentFolders}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 mt-2">
              Збережіть картку, щоб додавати документи.
            </p>
          )}
        </div>
      </>
    );
  }

  if (widgetType === "composite") {
    const compositeKey = (isSystem && systemColumn
      ? systemColumn
      : code) as keyof Product;
    return (
      <>
        {sectionHeader}
        <CompositeField
          vehicle={vehicle}
          onUpdate={onUpdate}
          disabled={disabled}
          label={displayLabel}
          vehicleKey={compositeKey}
          presetValues={presetValues}
          colSpanClass={colSpanClass}
        />
      </>
    );
  }

  if (!isSystem || !systemColumn) {
    return (
      <>
        {field.sectionTitle && (
          <h3 className="col-span-full mt-2 text-sm font-medium text-muted-foreground first:mt-0">
            {field.sectionTitle}
          </h3>
        )}
        <div className={cn("grid gap-2", colSpanClass)}>
          <Label className="text-muted-foreground">{displayLabel}</Label>
          <Input
            disabled
            placeholder="EAV (буде додано)"
            className="bg-muted"
          />
        </div>
      </>
    );
  }

  const vehicleKey = systemColumn as keyof Product;
  const rawValue = getVehicleValue(vehicle, systemColumn);

  if (code === "cargo_dimensions") {
    return (
      <>
        {sectionHeader}
        <CargoDimensionsField
          vehicle={vehicle}
          onUpdate={onUpdate}
          disabled={disabled}
          label={displayLabel}
        />
      </>
    );
  }

  if (code === "created_at") {
    const formatted = rawValue
      ? (() => {
          const d = new Date(rawValue as string);
          return Number.isNaN(d.getTime())
            ? String(rawValue)
            : d.toLocaleString("uk-UA", {
                dateStyle: "short",
                timeStyle: "short",
              });
        })()
      : "";
    return (
      <>
        {sectionHeader}
        <div className={cn("grid gap-2", colSpanClass)}>
          <Label>{displayLabel}</Label>
          <Input value={formatted} readOnly className="bg-muted" placeholder="--" />
        </div>
      </>
    );
  }

  if (widgetType === "datepicker" || dataType === "date" || dataType === "datetime") {
    const dateRequired = validationValues.required;
    return (
      <>
        {sectionHeader}
        <div className={colSpanClass}>
          <DateField
            value={(rawValue ?? defaultValue ?? null) as string | null}
            onChange={(v) =>
              onUpdate(vehicleKey, v as Product[typeof vehicleKey])
            }
            disabled={disabled}
            label={displayLabel}
            placeholder={placeholder ?? undefined}
            mode={dataType === "datetime" ? "datetime" : "date"}
            required={!!dateRequired}
          />
        </div>
      </>
    );
  }

  if (widgetType === "select") {
    const opts =
      code === "status"
        ? statusOptions
        : parsePresetValues(presetValues);
    return (
      <>
        {sectionHeader}
        <div className={colSpanClass}>
          <SelectField
            value={String(rawValue ?? "")}
            options={opts}
            onChange={(v) =>
              onUpdate(vehicleKey, (v ?? null) as Product[typeof vehicleKey])
            }
            disabled={disabled}
            label={displayLabel}
            placeholder={placeholder ?? undefined}
          />
        </div>
      </>
    );
  }

  if (widgetType === "radio") {
    const opts =
      code === "status"
        ? statusOptions
        : parsePresetValues(presetValues);
    return (
      <>
        {sectionHeader}
        <div className={colSpanClass}>
          <RadioField
            value={String(rawValue ?? "")}
            options={opts}
            onChange={(v) =>
              onUpdate(vehicleKey, (v ?? null) as Product[typeof vehicleKey])
            }
            disabled={disabled}
            label={displayLabel}
            name={code}
          />
        </div>
      </>
    );
  }

  if (widgetType === "multiselect") {
    const opts = parsePresetValues(presetValues);
    return (
      <>
        {sectionHeader}
        <div className={cn("grid gap-2", colSpanClass)}>
          <MultiselectField
            value={String(rawValue ?? "")}
            options={opts}
            onChange={(v) =>
              onUpdate(vehicleKey, (v ?? null) as Product[typeof vehicleKey])
            }
            disabled={disabled}
            label={displayLabel}
          />
        </div>
      </>
    );
  }

  if (widgetType === "textarea") {
    const minL = validationValues.minLength;
    const maxL = validationValues.maxLength;
    const minR = validationValues.minRows;
    const maxR = validationValues.maxRows;
    const requiredVal = validationValues.required;
    return (
      <>
        {sectionHeader}
        <div className={cn("grid gap-2", colSpanClass)}>
          <TextareaField
            value={String(rawValue ?? "")}
            onChange={(v) =>
              onUpdate(vehicleKey, (v ?? null) as Product[typeof vehicleKey])
            }
            disabled={disabled}
            label={displayLabel}
            placeholder={placeholder ?? label}
            rows={4}
            minLength={typeof minL === "number" ? minL : undefined}
            maxLength={typeof maxL === "number" ? maxL : undefined}
            minRows={typeof minR === "number" ? minR : undefined}
            maxRows={typeof maxR === "number" ? maxR : undefined}
            required={!!requiredVal}
          />
        </div>
      </>
    );
  }

  if (widgetType === "calculated") {
    return (
      <>
        {sectionHeader}
        <div className={colSpanClass}>
          <CalculatedField
            formula={validation}
            vehicle={vehicle as Record<string, unknown>}
            label={displayLabel}
            unit={unit}
            placeholder="Вкажіть формулу в налаштуваннях поля"
          />
        </div>
      </>
    );
  }

  if (
    widgetType === "number_input" ||
    dataType === "integer" ||
    dataType === "float"
  ) {
    const minVal = validationValues.min;
    const maxVal = validationValues.max;
    const stepVal = validationValues.step;
    const decimalVal = validationValues.decimalPlaces;
    const thousandSep = validationValues.useThousandSeparator;
    const requiredVal = validationValues.required;
    return (
      <>
        {sectionHeader}
        <div className={colSpanClass}>
          <NumberInput
            value={rawValue as string | number | undefined}
            onChange={(v) =>
              onUpdate(vehicleKey, v as Product[typeof vehicleKey])
            }
            disabled={disabled}
            label={displayLabel}
            placeholder={placeholder ?? label}
            unit={unit}
            dataType={dataType === "integer" ? "integer" : "float"}
            min={typeof minVal === "number" ? minVal : undefined}
            max={typeof maxVal === "number" ? maxVal : undefined}
            step={typeof stepVal === "number" ? stepVal : undefined}
            decimalPlaces={typeof decimalVal === "number" ? decimalVal : undefined}
            useThousandSeparator={!!thousandSep}
            required={!!requiredVal}
          />
        </div>
      </>
    );
  }

  const handleTextChange = (v: string | null) => {
    const newValue = v || null;
    onUpdate(vehicleKey, newValue as Product[typeof vehicleKey]);
    if (code === "vin") {
      onUpdate("serial_number", newValue as Product["serial_number"]);
    }
  };

  const minL = validationValues.minLength;
  const maxL = validationValues.maxLength;
  const requiredVal = validationValues.required;
  const formatVal = validationValues.format;
  const patternVal = validationValues.pattern;
  const patternMsg = validationValues.patternMessage;
  const pattern = getTextValidationPattern(
    typeof formatVal === "string" ? formatVal : undefined,
    typeof patternVal === "string" ? patternVal : undefined
  );
  const patternMessage = typeof patternMsg === "string" && patternMsg.trim() ? patternMsg.trim() : undefined;

  return (
    <>
      {sectionHeader}
      <div className={colSpanClass}>
        <TextInput
          value={String(rawValue ?? "")}
          onChange={handleTextChange}
          disabled={disabled}
          label={displayLabel}
          placeholder={placeholder ?? label}
          minLength={typeof minL === "number" ? minL : undefined}
          maxLength={typeof maxL === "number" ? maxL : undefined}
          required={!!requiredVal}
          pattern={pattern}
          patternMessage={patternMessage}
        />
      </div>
    </>
  );
}

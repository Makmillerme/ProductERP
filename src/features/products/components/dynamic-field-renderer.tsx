"use client";

import { useRef, useMemo, useCallback } from "react";
import { useStatuses } from "../hooks/use-statuses";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductMediaGallery } from "./product-media-gallery";
import { ProductMediaUploader, type ProductMediaUploaderRef } from "./product-media-uploader";
import { ProductDocumentsTab, type DocumentFolderConfig } from "./product-documents-tab";
import { uploadProductMedia, deleteProductMedia } from "../api";
import { cn } from "@/lib/utils";
import { parseCompositePresetValues } from "@/config/composite-field";
import { parseValidationJson, getTextValidationPattern } from "@/config/field-constructor";
import { parsePresetValues, parseOptionsWithLayout, resolveBooleanOptionLabels, formatDateTimeForDisplay } from "../lib/field-utils";
import { useLocale } from "@/lib/locale-provider";
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
import type { ProductConfigTabField } from "../hooks/use-product-config";

type DynamicFieldRendererProps = {
  field: ProductConfigTabField;
  product: Product;
  onUpdate: (key: keyof Product | string, value: unknown) => void;
  disabled?: boolean;
  /** Для file_upload: чи таб активний (для коректного рендеру ProductDocumentsTab). */
  tabActive?: boolean;
  /** Для file_upload: папки з tabConfig табу. */
  documentFolders?: DocumentFolderConfig[];
  /** Режим прев'ю: показувати віджети розкритими навіть без збереженого товару. */
  previewMode?: boolean;
};

function getProductValue(product: Product, key: string): unknown {
  return (product as Record<string, unknown>)[key];
}

function CargoDimensionsField({
  product,
  onUpdate,
  disabled,
  label,
}: {
  product: Product;
  onUpdate: DynamicFieldRendererProps["onUpdate"];
  disabled?: boolean;
  label: string;
}) {
  const { t } = useLocale();
  const raw = String(product.cargo_dimensions ?? "");
  const parts = raw.split(/\s*[×xX]\s*/).map((p: string) => p.trim());

  const handlePart = (index: number, value: string) => {
    const current = String(product.cargo_dimensions ?? "")
      .split(/\s*[×xX]\s*/)
      .map((p: string) => p.trim());
    const next = [current[0] ?? "", current[1] ?? "", current[2] ?? ""];
    next[index] = value;
    onUpdate(
      "cargo_dimensions",
      next.some(Boolean) ? next.join(" × ") : null,
    );
  };

  return (
    <div className="grid gap-2 min-w-0 sm:col-span-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="number"
          step="any"
          placeholder={t("dynamicField.placeholderLength")}
          className="min-w-0 flex-1"
          value={parts[0] ?? ""}
          onChange={(e) => handlePart(0, e.target.value)}
          disabled={disabled}
        />
        <span className="shrink-0 text-muted-foreground">×</span>
        <Input
          type="number"
          step="any"
          placeholder={t("dynamicField.placeholderWidth")}
          className="min-w-0 flex-1"
          value={parts[1] ?? ""}
          onChange={(e) => handlePart(1, e.target.value)}
          disabled={disabled}
        />
        <span className="shrink-0 text-muted-foreground">×</span>
        <Input
          type="number"
          step="any"
          placeholder={t("dynamicField.placeholderHeight")}
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
  product,
  onUpdate,
  disabled,
  label,
  productKey,
  presetValues,
  colSpanClass,
}: {

  product: Product;
  onUpdate: DynamicFieldRendererProps["onUpdate"];
  disabled?: boolean;
  label: string;
  productKey: keyof Product;
  presetValues: string | null;
  colSpanClass: string;
}) {
  const { t } = useLocale();
  const config = parseCompositePresetValues(presetValues);
  const raw = String((product as Record<string, unknown>)[productKey] ?? "");
  const subFieldCodes = config.subFields.map((sf) => sf.code);
  const values = parseCompositeValue(raw, subFieldCodes);

  const handleSubChange = (code: string, value: string | number | null) => {
    const next = { ...values, [code]: value };
    const hasAny = Object.values(next).some((v) => v !== null && v !== "");
    onUpdate(productKey, hasAny ? JSON.stringify(next) : null);
  };

  if (config.subFields.length === 0) {
    return (
      <div className={cn("grid gap-2 min-w-0", colSpanClass)}>
        {!config.hideLabel && <Label>{label}</Label>}
        <Input disabled placeholder={t("dynamicField.configureSubfields")} className="bg-muted" />
      </div>
    );
  }

  const layoutClass =
    config.layout === "column"
      ? "flex flex-col gap-2"
      : "grid grid-cols-3 gap-2";

  return (
    <div className={cn("grid gap-2 min-w-0", colSpanClass)}>
      {!config.hideLabel && <Label>{label}</Label>}
      <div className={layoutClass}>
        {config.subFields.map((sf) => {
          const subPlaceholder = sf.placeholder ?? sf.label;
          const subValue = values[sf.code];
          const displayValue =
            subValue != null && subValue !== ""
              ? subValue
              : (sf.defaultValue ?? "");
          const opts = parsePresetValues(sf.presetValues ?? null);
          const optionsLayout =
            sf.widgetType === "radio" || sf.widgetType === "multiselect"
              ? parseOptionsWithLayout(sf.presetValues ?? null).layout
              : "row" as const;
          const compact = false;

          const subfieldSpanClass =
            config.layout === "row" &&
            (sf.widgetType === "radio" || sf.widgetType === "multiselect")
              ? "col-span-3"
              : undefined;

          switch (sf.widgetType) {
            case "calculated": {
              const compositeObj = Object.fromEntries(
                config.subFields.map((s) => [
                  s.code,
                  values[s.code] ?? (s.code === sf.code ? 0 : 0),
                ])
              );
              const fakeProduct = { ...product, ...compositeObj } as Record<string, unknown>;
              return (
                <div key={sf.code}>
                  <CalculatedField
                    formula={sf.validation ?? null}
                    product={fakeProduct}
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
                <div key={sf.code} className={subfieldSpanClass}>
                  <RadioField
                    value={String(subValue ?? "")}
                    options={opts}
                    onChange={(v) => handleSubChange(sf.code, v)}
                    disabled={disabled}
                    label={sf.label}
                    name={sf.code}
                    compact={compact}
                    layout={optionsLayout}
                  />
                </div>
              );
            case "multiselect":
              return (
                <div key={sf.code} className={subfieldSpanClass}>
                  <MultiselectField
                    value={String(subValue ?? "")}
                    options={opts}
                    onChange={(v) => handleSubChange(sf.code, v)}
                    disabled={disabled}
                    label={sf.label}
                    compact={compact}
                    layout={optionsLayout}
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
  product,
  onUpdate,
  disabled,
  sectionHeader,
  colSpanClass,
  displayLabel,
  previewMode,
}: {
  product: Product;
  onUpdate: DynamicFieldRendererProps["onUpdate"];
  disabled?: boolean;
  sectionHeader: React.ReactNode;
  colSpanClass: string;
  displayLabel: string;
  previewMode?: boolean;
}) {
  const { t } = useLocale();
  const mediaUploaderRef = useRef<ProductMediaUploaderRef>(null);
  const mediaItems = useMemo(
    () =>
      (product.media ?? []).map((m) => ({
        path: m.path,
        kind: (m.kind ?? "image") as "image" | "video",
      })),
    [product.media]
  );
  const handleUpload = useCallback(
    async (file: File) => {
      const created = await uploadProductMedia(product.id, file);
      onUpdate("media", [...(product.media ?? []), created]);
    },
    [product.id, product.media, onUpdate]
  );
  const handleAddClick = useCallback(() => {
    mediaUploaderRef.current?.openFileDialog();
  }, []);
  const handleDelete = useCallback(
    async (index: number) => {
      const m = (product.media ?? [])[index];
      if (m?.id == null) return;
      await deleteProductMedia(product.id, m.id);
      onUpdate("media", (product.media ?? []).filter((_, i) => i !== index));
    },
    [product.id, product.media, onUpdate]
  );
  const showGallery = product.id > 0 || previewMode;
  return (
    <>
      {sectionHeader}
      <div className={cn("col-span-full min-w-0 grid gap-2", colSpanClass)}>
        <Label>{displayLabel}</Label>
        {showGallery ? (
          <>
            {product.id > 0 && (
              <ProductMediaUploader
                ref={mediaUploaderRef}
                productId={product.id}
                onUpload={handleUpload}
                onAddPending={() => {}}
                disabled={disabled}
                hideButton
              />
            )}
            <ProductMediaGallery
              items={mediaItems}
              onAddClick={handleAddClick}
              addDisabled={disabled || (product.id === 0 && !!previewMode)}
              onDelete={product.id > 0 && !disabled ? handleDelete : undefined}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-6">
            {t("productMediaGallery.saveProductFirst")}
          </p>
        )}
      </div>
    </>
  );
}

export function DynamicFieldRenderer({
  field,
  product,
  onUpdate,
  disabled,
  tabActive = true,
  documentFolders = [],
  previewMode = false,
}: DynamicFieldRendererProps) {
  const { t } = useLocale();
  const { options: statusOptions } = useStatuses();
  const { fieldDefinition } = field;
  const {
    code,
    label,
    dataType,
    widgetType,
    presetValues,
    validation,
    unit,
    placeholder,
    defaultValue,
    hiddenOnCard,
  } = fieldDefinition;

  if (hiddenOnCard) {
    return null;
  }

  const showUnitInLabel = dataType !== "string" && unit;
  const displayLabel = showUnitInLabel ? `${label} (${unit})` : label;

  /** Сітка 3 колонки: textarea, gallery, files, composite — завжди повна ширина. Інші — за colSpan (1–3). */
  const getColSpanClass = () => {
    if (
      widgetType === "textarea" ||
      widgetType === "media_gallery" ||
      widgetType === "file_upload" ||
      widgetType === "composite"
    ) {
      return "col-span-full";
    }
    if (field.colSpan >= 3) return "col-span-full";
    if (field.colSpan === 2) return "sm:col-span-2";
    return "";
  };
  const colSpanClass = getColSpanClass();
  const validationValues = parseValidationJson(validation ?? null);

  const sectionHeader = field.sectionTitle ? (
    <h3 className="col-span-full text-sm font-medium text-muted-foreground pt-2 first:pt-0">
      {field.sectionTitle}
    </h3>
  ) : null;

  if (widgetType === "media_gallery") {
    return (
      <MediaGalleryField
        product={product}
        onUpdate={onUpdate}
        disabled={disabled}
        sectionHeader={sectionHeader}
        colSpanClass={colSpanClass}
        displayLabel={displayLabel}
        previewMode={previewMode}
      />
    );
  }

  if (widgetType === "file_upload") {
    const showFiles = product.id > 0 || previewMode;
    return (
      <>
        {sectionHeader}
        <div className={cn("col-span-full min-w-0", colSpanClass)}>
          <div className="grid gap-2">
            <Label>{displayLabel}</Label>
          {showFiles ? (
            <div>
              <ProductDocumentsTab
                productId={product.id}
                active={tabActive ?? true}
                folders={documentFolders}
                previewMode={previewMode && product.id === 0}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6">
              {t("productDocuments.saveProductFirst")}
            </p>
          )}
          </div>
        </div>
      </>
    );
  }

  if (widgetType === "composite") {
    const compositeKey = (code ?? fieldDefinition.id) as keyof Product | string;
    return (
      <>
        {sectionHeader}
        <CompositeField
          product={product}
          onUpdate={onUpdate}
          disabled={disabled}
          label={displayLabel}
          productKey={compositeKey}
          presetValues={presetValues}
          colSpanClass={colSpanClass}
        />
      </>
    );
  }

  const productKey = (code === "status" ? "product_status_id" : (code ?? fieldDefinition.id)) as keyof Product | string;
  const rawValue = getProductValue(product, productKey as string);

  if (code === "cargo_dimensions") {
    return (
      <>
        {sectionHeader}
        <CargoDimensionsField
          product={product}
          onUpdate={onUpdate}
          disabled={disabled}
          label={displayLabel}
        />
      </>
    );
  }

  if (code === "created_at") {
    const formatted = rawValue ? formatDateTimeForDisplay(rawValue as string) : "";
    return (
      <>
        {sectionHeader}
        <div className={cn("grid gap-2 min-w-0", colSpanClass)}>
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
        <div className={cn("min-w-0", colSpanClass)}>
          <DateField
            value={(rawValue ?? defaultValue ?? null) as string | null}
            onChange={(v) =>
              onUpdate(productKey, v)
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
    const rawOpts =
      code === "status"
        ? statusOptions
        : parsePresetValues(presetValues);
    const opts = dataType === "boolean" ? resolveBooleanOptionLabels(rawOpts, t) : rawOpts;
    return (
      <>
        {sectionHeader}
        <div className={cn("min-w-0", colSpanClass)}>
          <SelectField
            value={String(rawValue ?? "")}
            options={opts}
            onChange={(v) =>
              onUpdate(productKey, v ?? null)
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
    const rawOpts =
      code === "status"
        ? statusOptions
        : parsePresetValues(presetValues);
    const opts = dataType === "boolean" ? resolveBooleanOptionLabels(rawOpts, t) : rawOpts;
    const { layout } = code === "status" ? { layout: "row" as const } : parseOptionsWithLayout(presetValues);
    const spanClass = "col-span-full";
    return (
      <>
        {sectionHeader}
        <div className={cn("min-w-0", spanClass)}>
          <RadioField
            value={String(rawValue ?? "")}
            options={opts}
            onChange={(v) =>
              onUpdate(productKey, v ?? null)
            }
            disabled={disabled}
            label={displayLabel}
            name={`radio-${field.id}`}
            layout={layout}
          />
        </div>
      </>
    );
  }

  if (widgetType === "multiselect") {
    const rawOpts = parsePresetValues(presetValues);
    const opts = dataType === "boolean" ? resolveBooleanOptionLabels(rawOpts, t) : rawOpts;
    const { layout } = parseOptionsWithLayout(presetValues);
    const spanClass = "col-span-full";
    return (
      <>
        {sectionHeader}
        <div className={cn("grid gap-2 min-w-0", spanClass)}>
          <MultiselectField
            value={String(rawValue ?? "")}
            options={opts}
            onChange={(v) =>
              onUpdate(productKey, v ?? null)
            }
            disabled={disabled}
            label={displayLabel}
            layout={layout}
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
        <div className={cn("grid gap-2 min-w-0", colSpanClass)}>
          <TextareaField
            value={String(rawValue ?? "")}
            onChange={(v) =>
              onUpdate(productKey, v ?? null)
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
        <div className={cn("min-w-0", colSpanClass)}>
          <CalculatedField
            formula={validation}
            product={product as Record<string, unknown>}
            label={displayLabel}
            unit={unit}
            placeholder={t("dynamicField.formulaPlaceholder")}
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
        <div className={cn("min-w-0", colSpanClass)}>
          <NumberInput
            value={rawValue as string | number | undefined}
            onChange={(v) =>
              onUpdate(productKey, v)
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
    onUpdate(productKey, newValue);
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
      <div className={cn("min-w-0", colSpanClass)}>
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

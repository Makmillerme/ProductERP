"use client";

import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { slugify } from "@/lib/slugify";
import {
  WIDGET_TYPES,
  DATA_TYPES,
  VALIDATION_OPTIONS,
  getDataTypesForWidget,
  buildValidationJson,
  parseValidationJson,
  type WidgetType,
  type DataType,
} from "@/config/field-constructor";
import {
  type CompositePresetValues,
  type CompositeSubField,
  type CompositeLayout,
  COMPOSITE_ALLOWED_WIDGETS,
  COMPOSITE_SUBFIELD_SETTINGS,
  parseCompositePresetValues,
  stringifyCompositePresetValues,
} from "@/config/composite-field";
import { BOOLEAN_PRESET_VALUES_JSON } from "@/config/field-constructor";
import { SHEET_INPUT_CLASS } from "@/config/sheet";
import {
  MEASUREMENT_CATEGORIES,
  findUnitInCategories,
  CUSTOM_UNIT_VALUE,
} from "@/config/measurement-units";
import { OptionsEditor } from "./options-editor";
import { FormulaEditor } from "./formula-editor";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useLocale } from "@/lib/locale-provider";

const LAYOUT_OPTIONS: { value: CompositeLayout; labelKey: string }[] = [
  { value: "row", labelKey: "composite.layoutRow" },
  { value: "column", labelKey: "composite.layoutColumn" },
  { value: "grid", labelKey: "composite.layoutGrid" },
];

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function SubFieldWidgetSettings({
  sf,
  index,
  allSubFields,
  updateSubField,
  disabled,
  t,
}: {
  sf: CompositeSubField;
  index: number;
  allSubFields: CompositeSubField[];
  updateSubField: (i: number, u: Partial<CompositeSubField>) => void;
  disabled?: boolean;
  t: (key: string) => string;
}) {
  const settings = COMPOSITE_SUBFIELD_SETTINGS[sf.widgetType] ?? {
    needsPlaceholder: false,
    needsDefaultValue: false,
    needsUnit: false,
    needsPresets: false,
    needsFormula: false,
    needsValidation: true,
  };
  const { needsUnit, needsPlaceholder, needsDefaultValue, needsPresets, needsFormula, needsValidation } = settings;

  const validationValues = parseValidationJson(sf.validation ?? null);
  const unitInfo =
    sf.unitDimension === CUSTOM_UNIT_VALUE
      ? {
          categoryId: "other" as string,
          dimensionValue: CUSTOM_UNIT_VALUE,
          isCustom: true,
        }
      : findUnitInCategories(sf.unit);

  const setValidationValues = (vals: Record<string, string | number | boolean>) => {
    const json = buildValidationJson(sf.dataType as DataType, vals);
    updateSubField(index, { validation: json ?? null });
  };

  let validationOpts = VALIDATION_OPTIONS[sf.dataType as DataType] ?? [];
  if (sf.widgetType !== "textarea") {
    validationOpts = validationOpts.filter(
      (o) => o.key !== "minRows" && o.key !== "maxRows"
    );
  }
  if (["select", "multiselect", "radio"].includes(sf.widgetType)) {
    validationOpts = validationOpts.filter(
      (o) =>
        o.key !== "minLength" &&
        o.key !== "maxLength" &&
        o.key !== "min" &&
        o.key !== "max" &&
        o.key !== "step" &&
        o.key !== "decimalPlaces" &&
        o.key !== "useThousandSeparator"
    );
  }
  if (sf.widgetType !== "text_input") {
    validationOpts = validationOpts.filter(
      (o) => o.key !== "format" && o.key !== "pattern" && o.key !== "patternMessage"
    );
  } else if (String(validationValues.format ?? "") !== "custom") {
    validationOpts = validationOpts.filter(
      (o) => o.key !== "pattern" && o.key !== "patternMessage"
    );
  }

  const renderValidationOpt = (opt: (typeof validationOpts)[number]) => {
    if (opt.inputType === "number") {
      const v = validationValues[opt.key];
      const numValue =
        v != null && typeof v !== "boolean" ? v : "";
      const min =
        opt.key === "minRows" || opt.key === "maxRows"
          ? 1
          : opt.key === "minLength" || opt.key === "maxLength"
            ? 0
            : undefined;
      return (
        <Input
          type="number"
          min={min}
          value={numValue}
          onChange={(e) => {
            const raw = e.target.value === "" ? "" : Number(e.target.value);
            const value =
              typeof raw === "number" && min !== undefined && raw < min ? min : raw;
            setValidationValues({ ...validationValues, [opt.key]: value });
          }}
          placeholder={opt.hint}
          disabled={disabled}
          className={`text-xs ${SHEET_INPUT_CLASS}`}
        />
      );
    }
    if (opt.key === "required" || opt.inputType === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={!!validationValues[opt.key]}
          onChange={(e) =>
            setValidationValues({
              ...validationValues,
              [opt.key]: e.target.checked,
            })
          }
          disabled={disabled}
          className="size-4"
        />
      );
    }
    if (opt.inputType === "select" && opt.selectOptions) {
      return (
        <Select
          value={String(validationValues[opt.key] ?? "")}
          onValueChange={(v) =>
            setValidationValues({ ...validationValues, [opt.key]: v })
          }
          disabled={disabled}
        >
          <SelectTrigger className={`text-xs ${SHEET_INPUT_CLASS}`}>
            <SelectValue placeholder={opt.hint} />
          </SelectTrigger>
          <SelectContent>
            {opt.selectOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return (
      <Input
        value={String(validationValues[opt.key] ?? "")}
        onChange={(e) =>
          setValidationValues({
            ...validationValues,
            [opt.key]: e.target.value,
          })
        }
        placeholder={opt.hint}
        disabled={disabled}
        className={`text-xs ${SHEET_INPUT_CLASS}`}
      />
    );
  };

  return (
    <div className="grid gap-3 pt-1 border-t border-border/60">
      {needsUnit && (
        <div className="grid gap-2">
          <Label className="text-xs font-normal text-muted-foreground">
            {t("fieldSettings.unit")}
          </Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="grid gap-1">
              <Label className="text-[10px] text-muted-foreground">
                {t("fieldSettings.unitCategory")}
              </Label>
              <Select
                value={unitInfo.categoryId ?? ""}
                onValueChange={(v) => {
                  const cat = MEASUREMENT_CATEGORIES.find((c) => c.id === v);
                  const firstDim = cat?.dimensions[0];
                  updateSubField(index, {
                    unit: v && firstDim ? firstDim.label : null,
                    unitDimension: null,
                  });
                }}
                disabled={disabled}
              >
                <SelectTrigger className={`h-8 text-xs ${SHEET_INPUT_CLASS}`}>
                  <SelectValue placeholder={t("placeholders.selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {MEASUREMENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label className="text-[10px] text-muted-foreground">
                {t("fieldSettings.unitDimension")}
              </Label>
              <Select
                value={unitInfo.dimensionValue ?? ""}
                onValueChange={(v) => {
                  if (v === CUSTOM_UNIT_VALUE) {
                    updateSubField(index, {
                      unitDimension: CUSTOM_UNIT_VALUE,
                      unit: "",
                    });
                  } else if (v) {
                    const cat = MEASUREMENT_CATEGORIES.find(
                      (c) => c.id === unitInfo.categoryId
                    );
                    const dim = cat?.dimensions.find((d) => d.value === v);
                    updateSubField(index, {
                      unit: dim?.label ?? null,
                      unitDimension: null,
                    });
                  } else {
                    updateSubField(index, { unit: null, unitDimension: null });
                  }
                }}
                disabled={disabled || !unitInfo.categoryId}
              >
                <SelectTrigger className={`h-8 text-xs ${SHEET_INPUT_CLASS}`}>
                  <SelectValue placeholder={t("placeholders.selectDimension")} />
                </SelectTrigger>
                <SelectContent>
                  {unitInfo.categoryId
                    ? MEASUREMENT_CATEGORIES.find(
                        (c) => c.id === unitInfo.categoryId
                      )?.dimensions.map((dim) => (
                        <SelectItem key={dim.value} value={dim.value}>
                          {dim.label}
                        </SelectItem>
                      )) ?? []
                    : []}
                </SelectContent>
              </Select>
            </div>
          </div>
          {unitInfo.isCustom && (
            <div className="grid gap-1">
              <Label className="text-[10px] text-muted-foreground">
                {t("fieldSettings.unitCustom")}
              </Label>
              <Input
                value={sf.unit ?? ""}
                onChange={(e) =>
                  updateSubField(index, {
                    unit: e.target.value.trim() || null,
                    unitDimension: CUSTOM_UNIT_VALUE,
                  })
                }
                placeholder={t("placeholders.unitCustomExample")}
                disabled={disabled}
                className={`h-8 font-mono text-xs ${SHEET_INPUT_CLASS}`}
              />
            </div>
          )}
        </div>
      )}

      {needsPlaceholder && (
        <div className="grid gap-1">
          <Label className="text-xs font-normal text-muted-foreground">
            {t("fieldSettings.placeholder")}
          </Label>
          <Input
            value={sf.placeholder ?? ""}
            onChange={(e) =>
              updateSubField(index, {
                placeholder: e.target.value.trim() || null,
              })
            }
            placeholder={t("placeholders.placeholderHint")}
            disabled={disabled}
            className={`h-8 text-xs ${SHEET_INPUT_CLASS}`}
          />
        </div>
      )}

      {needsDefaultValue && (
        <div className="grid gap-1">
          <Label className="text-xs font-normal text-muted-foreground">
            {t("fieldSettings.defaultValue")}
          </Label>
          <Input
            value={sf.defaultValue ?? ""}
            onChange={(e) =>
              updateSubField(index, {
                defaultValue: e.target.value.trim() || null,
              })
            }
            placeholder={t("placeholders.defaultValueHint")}
            disabled={disabled}
            className={`h-8 text-xs ${SHEET_INPUT_CLASS}`}
          />
        </div>
      )}

      {needsPresets && (
        <div className="grid gap-1">
          <Label className="text-xs font-normal text-muted-foreground">
            {t("fieldSettings.options")}
          </Label>
          {sf.dataType === "boolean" ? (
            <p className="text-xs text-muted-foreground">Так / Ні (фіксовані опції)</p>
          ) : (
            <OptionsEditor
              value={sf.presetValues ?? ""}
              onChange={(v) =>
                updateSubField(index, {
                  presetValues: v.trim() || null,
                })
              }
              dataType={sf.dataType as DataType}
              disabled={disabled}
              placeholder={t("placeholders.optionName")}
              compact
            />
          )}
        </div>
      )}

      {needsFormula && (
        <FormulaEditor
          value={sf.validation ?? ""}
          onChange={(v) =>
            updateSubField(index, {
              validation: v.trim() || null,
            })
          }
          numericFields={allSubFields
            .filter(
              (s, i) =>
                i !== index &&
                (s.dataType === "integer" || s.dataType === "float") &&
                (s.widgetType === "number_input" || s.widgetType === "calculated")
            )
            .map((s) => ({ code: s.code, label: s.label }))}
          disabled={disabled}
          id={`fd-formula-${index}`}
          size="sm"
        />
      )}

      {needsValidation && validationOpts.length > 0 && (
        <div className="grid gap-2">
          <Label className="text-xs font-normal text-muted-foreground">
            {t("fieldSettings.validation")}
          </Label>
          <div className="flex flex-col gap-2">
            {validationOpts.map((opt) => (
              <div
                key={opt.key}
                className="flex items-center gap-2"
              >
                <Label className="min-w-[7rem] shrink-0 text-[10px] font-normal text-muted-foreground">
                  {opt.label}
                </Label>
                {renderValidationOpt(opt)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CompositeSubFieldsEditor({
  value,
  onChange,
  disabled,
}: Props) {
  const { t, tFormat } = useLocale();
  const config = parseCompositePresetValues(value);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const updateConfig = useCallback(
    (updater: (c: CompositePresetValues) => CompositePresetValues) => {
      onChange(stringifyCompositePresetValues(updater(config)));
    },
    [config, onChange]
  );

  const addSubField = () => {
    updateConfig((c) => ({
      ...c,
      subFields: [
        ...c.subFields,
        {
          code: `field_${c.subFields.length + 1}`,
          label: t("composite.newFieldLabel"),
          widgetType: "text_input",
          dataType: "string",
          unit: null,
          placeholder: null,
          defaultValue: null,
          presetValues: null,
          validation: null,
        },
      ],
    }));
  };

  const removeSubField = (index: number) => {
    updateConfig((c) => ({
      ...c,
      subFields: c.subFields.filter((_, i) => i !== index),
    }));
    setDeleteIndex(null);
  };

  const updateSubField = (index: number, updates: Partial<CompositeSubField>) => {
    updateConfig((c) => ({
      ...c,
      subFields: c.subFields.map((sf, i) =>
        i === index ? { ...sf, ...updates } : sf
      ),
    }));
  };

  const allowedWidgets = WIDGET_TYPES.filter((w) =>
    COMPOSITE_ALLOWED_WIDGETS.includes(w.value as WidgetType)
  );

  const subfieldToDelete =
    deleteIndex != null ? config.subFields[deleteIndex] : null;

  return (
    <div className="grid gap-4">
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="grid gap-2">
          <Label className="text-xs font-normal text-muted-foreground">
            {t("composite.layout")}
          </Label>
          <Select
            value={config.layout ?? "row"}
            onValueChange={(v) =>
              updateConfig((c) => ({ ...c, layout: v as CompositeLayout }))
            }
            disabled={disabled}
          >
            <SelectTrigger className={SHEET_INPUT_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LAYOUT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {t(o.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {config.layout === "grid" && (
          <>
            <div className="grid gap-2">
              <Label className="text-xs font-normal text-muted-foreground">
                {t("composite.gridColumns")}
              </Label>
              <Input
                type="number"
                min={1}
                max={6}
                value={config.gridColumns ?? 3}
                onChange={(e) =>
                  updateConfig((c) => ({
                    ...c,
                    gridColumns: Math.max(1, parseInt(e.target.value, 10) || 1),
                  }))
                }
                disabled={disabled}
                className={SHEET_INPUT_CLASS}
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-normal text-muted-foreground">
                {t("composite.gridRows")}
              </Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={config.gridRows ?? 1}
                onChange={(e) =>
                  updateConfig((c) => ({
                    ...c,
                    gridRows: Math.max(1, parseInt(e.target.value, 10) || 1),
                  }))
                }
                disabled={disabled}
                className={SHEET_INPUT_CLASS}
              />
            </div>
          </>
        )}
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-sm font-medium">{t("composite.subFields")}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSubField}
            disabled={disabled}
            className="shrink-0"
          >
            <Plus className="mr-1 size-3.5" />
            {t("composite.add")}
          </Button>
        </div>
        {config.subFields.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3 rounded-md border border-dashed text-center">
            {t("composite.noSubFields")}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {config.subFields.map((sf, i) => (
              <div key={i} className="relative flex flex-col gap-2 rounded-md border p-3 pr-12">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 size-8 shrink-0 text-muted-foreground hover:text-destructive z-10"
                  onClick={() => setDeleteIndex(i)}
                  disabled={disabled}
                  aria-label={t("composite.deleteSubField")}
                >
                  <X className="size-4" />
                </Button>
                <div className="flex items-end gap-2 flex-wrap">
                  <div className="min-w-0 flex-1 grid gap-1 min-w-[8rem]">
                    <Label className="text-xs text-muted-foreground">
                      {t("composite.subFieldName")}
                    </Label>
                    <Input
                      value={sf.label}
                      onChange={(e) => {
                        const label = e.target.value;
                        updateSubField(i, {
                          label,
                          code: slugify(label) || sf.code,
                        });
                      }}
                      placeholder={t("placeholders.labelExample")}
                      disabled={disabled}
                      className={SHEET_INPUT_CLASS}
                    />
                  </div>
                  <div className="grid gap-1 w-28 shrink-0">
                    <Label className="text-xs text-muted-foreground">
                      {t("composite.subFieldCode")}
                    </Label>
                    <Input
                      value={sf.code}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const code = raw.trim() === "" ? "" : (slugify(raw) || sf.code);
                        updateSubField(i, { code });
                      }}
                      placeholder={t("placeholders.codeExample")}
                      disabled={disabled}
                      className={`font-mono text-xs ${SHEET_INPUT_CLASS}`}
                    />
                  </div>
                </div>
                <div className="flex items-end gap-2 flex-wrap">
                  <div className="grid gap-1 min-w-[8rem] shrink-0">
                    <Label className="text-xs text-muted-foreground">
                      {t("fieldSettings.widgetType")}
                    </Label>
                    <Select
                      value={sf.widgetType}
                      onValueChange={(v) => {
                        const wt = v as WidgetType;
                        const types = getDataTypesForWidget(wt);
                        updateSubField(i, {
                          widgetType: wt,
                          dataType: types[0] ?? "string",
                        });
                      }}
                      disabled={disabled}
                    >
                      <SelectTrigger className={SHEET_INPUT_CLASS}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedWidgets.map((w) => (
                          <SelectItem key={w.value} value={w.value}>
                            {w.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1 w-24 shrink-0">
                    <Label className="text-xs text-muted-foreground">
                      {t("fieldSettings.dataType")}
                    </Label>
                    <Select
                      value={sf.dataType}
                      onValueChange={(v) => {
                        const newType = v as DataType;
                        const updates: Partial<CompositeSubField> = {
                          dataType: newType,
                        };
                        if (newType === "boolean") {
                          updates.presetValues = BOOLEAN_PRESET_VALUES_JSON;
                        } else if (sf.dataType === "boolean") {
                          updates.presetValues = null;
                        }
                        updateSubField(i, updates);
                      }}
                      disabled={disabled}
                    >
                      <SelectTrigger className={SHEET_INPUT_CLASS}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getDataTypesForWidget(sf.widgetType).map((dt) => (
                          <SelectItem key={dt} value={dt}>
                            {DATA_TYPES.find((d) => d.value === dt)?.label ?? dt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SubFieldWidgetSettings
                  sf={sf}
                  index={i}
                  allSubFields={config.subFields}
                  updateSubField={updateSubField}
                  disabled={disabled}
                  t={t}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={deleteIndex != null}
        onOpenChange={(open) => !open && setDeleteIndex(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("composite.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {subfieldToDelete
                ? tFormat("composite.deleteConfirmDescription", {
                    label: subfieldToDelete.label,
                    code: subfieldToDelete.code,
                  })
                : t("composite.deleteConfirmFallback")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("composite.cancelButton")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteIndex != null) removeSubField(deleteIndex);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("composite.deleteButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

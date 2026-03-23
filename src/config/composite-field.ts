/**
 * Типи та утиліти для складеного поля (composite).
 * presetValues зберігає layout та масив підполів.
 */

import type { DataType, WidgetType } from "./field-constructor";

export type CompositeLayout = "row" | "column";

export type CompositeSubField = {
  code: string;
  label: string;
  widgetType: WidgetType;
  dataType: DataType;
  unit?: string | null;
  /** "__custom__" коли обрано "Ввести вручну" — показуємо поле власного значення */
  unitDimension?: string | null;
  placeholder?: string | null;
  /** Для multiselect: comma-separated values, напр. "opt1,opt2". Для інших — одне значення. */
  defaultValue?: string | null;
  presetValues?: string | null;
  validation?: string | null;
};

export type CompositePresetValues = {
  layout?: CompositeLayout;
  gridColumns?: number;
  gridRows?: number;
  /** Приховати назву складеного поля для користувача на картці товару. */
  hideLabel?: boolean;
  subFields: CompositeSubField[];
};

/** Налаштування полів для підполів composite — один джерело правди замість дублікатів масивів */
export type CompositeSubfieldFieldFlags = {
  needsPlaceholder: boolean;
  needsDefaultValue: boolean;
  needsUnit: boolean;
  needsPresets: boolean;
  needsFormula: boolean;
  needsValidation: boolean;
};

export const COMPOSITE_SUBFIELD_SETTINGS: Record<WidgetType, CompositeSubfieldFieldFlags> = {
  text_input: { needsPlaceholder: true, needsDefaultValue: true, needsUnit: false, needsPresets: false, needsFormula: false, needsValidation: true },
  number_input: { needsPlaceholder: true, needsDefaultValue: true, needsUnit: true, needsPresets: false, needsFormula: false, needsValidation: true },
  textarea: { needsPlaceholder: true, needsDefaultValue: true, needsUnit: false, needsPresets: false, needsFormula: false, needsValidation: true },
  select: { needsPlaceholder: true, needsDefaultValue: false, needsUnit: false, needsPresets: true, needsFormula: false, needsValidation: true },
  multiselect: { needsPlaceholder: false, needsDefaultValue: false, needsUnit: false, needsPresets: true, needsFormula: false, needsValidation: true },
  radio: { needsPlaceholder: false, needsDefaultValue: false, needsUnit: false, needsPresets: true, needsFormula: false, needsValidation: true },
  datepicker: { needsPlaceholder: true, needsDefaultValue: false, needsUnit: false, needsPresets: false, needsFormula: false, needsValidation: true },
  calculated: { needsPlaceholder: false, needsDefaultValue: false, needsUnit: true, needsPresets: false, needsFormula: true, needsValidation: false },
  media_gallery: { needsPlaceholder: false, needsDefaultValue: false, needsUnit: false, needsPresets: false, needsFormula: false, needsValidation: true },
  file_upload: { needsPlaceholder: false, needsDefaultValue: false, needsUnit: false, needsPresets: true, needsFormula: false, needsValidation: true },
  composite: { needsPlaceholder: false, needsDefaultValue: false, needsUnit: false, needsPresets: true, needsFormula: false, needsValidation: false },
};

/** Віджети, дозволені для підполів composite (усі крім composite, media_gallery, file_upload) */
export const COMPOSITE_ALLOWED_WIDGETS: WidgetType[] = [
  "text_input",
  "number_input",
  "textarea",
  "select",
  "multiselect",
  "radio",
  "datepicker",
  "calculated",
];

export function parseCompositePresetValues(
  json: string | null
): CompositePresetValues {
  const defaultResult: CompositePresetValues = {
    layout: "row",
    gridColumns: 3,
    gridRows: 1,
    subFields: [],
  };
  if (!json?.trim()) return defaultResult;
  try {
    const parsed = JSON.parse(json) as unknown;
    if (typeof parsed !== "object" || parsed === null)
      return defaultResult;
    const obj = parsed as Record<string, unknown>;
    const subFields = Array.isArray(obj.subFields)
      ? (obj.subFields as unknown[]).filter(
          (o): o is CompositeSubField =>
            typeof o === "object" &&
            o !== null &&
            typeof (o as CompositeSubField).code === "string" &&
            typeof (o as CompositeSubField).label === "string" &&
            typeof (o as CompositeSubField).widgetType === "string" &&
            typeof (o as CompositeSubField).dataType === "string"
        )
      : [];
    return {
      layout:
        obj.layout === "row" || obj.layout === "column"
          ? obj.layout
          : "row",
      gridColumns:
        typeof obj.gridColumns === "number" && obj.gridColumns > 0
          ? obj.gridColumns
          : 3,
      gridRows:
        typeof obj.gridRows === "number" && obj.gridRows > 0
          ? obj.gridRows
          : 1,
      hideLabel: obj.hideLabel === true,
      subFields,
    };
  } catch {
    return defaultResult;
  }
}

export function stringifyCompositePresetValues(
  config: CompositePresetValues
): string {
  return JSON.stringify(config, null, 2);
}

/** Віджети з опціями для нормалізації boolean */
const PRESET_WIDGETS: WidgetType[] = ["select", "multiselect", "radio"];

/** Нормалізує composite config: для boolean підполів встановлює фіксовані presetValues */
export function normalizeCompositePresetValues(
  json: string | null,
  booleanPresetJson: string
): string | null {
  if (!json?.trim()) return json;
  try {
    const config = parseCompositePresetValues(json);
    const normalized = {
      ...config,
      subFields: config.subFields.map((sf) => {
        if (
          sf.dataType === "boolean" &&
          PRESET_WIDGETS.includes(sf.widgetType as WidgetType)
        ) {
          return { ...sf, presetValues: booleanPresetJson };
        }
        return sf;
      }),
    };
    return stringifyCompositePresetValues(normalized);
  } catch {
    return json;
  }
}

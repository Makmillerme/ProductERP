/**
 * Конфігурація конструктора полів.
 * Спосіб відображення (widget) визначає доступні типи даних та валідацію.
 * Валюта прибрана — вартість як float + unit (грн, EUR), курс окремо в інтеграції.
 */

/** Типи даних — тільки для полів, де це має сенс */
export const DATA_TYPES = [
  { value: "string", labelKey: "dataTypes.string" },
  { value: "integer", labelKey: "dataTypes.integer" },
  { value: "float", labelKey: "dataTypes.float" },
  { value: "boolean", labelKey: "dataTypes.boolean" },
  { value: "date", labelKey: "dataTypes.date" },
  { value: "datetime", labelKey: "dataTypes.datetime" },
  { value: "media", labelKey: "dataTypes.media" },
  { value: "file", labelKey: "dataTypes.file" },
] as const;

export type DataType = (typeof DATA_TYPES)[number]["value"];

/** Способи відображення (віджети) — тип даних підбирається автоматично */
export const WIDGET_TYPES = [
  { value: "text_input", labelKey: "widgetTypes.text_input", dataTypes: ["string"] as DataType[] },
  { value: "number_input", labelKey: "widgetTypes.number_input", dataTypes: ["integer", "float"] as DataType[] },
  { value: "textarea", labelKey: "widgetTypes.textarea", dataTypes: ["string"] as DataType[] },
  { value: "select", labelKey: "widgetTypes.select", dataTypes: ["string", "integer", "float", "boolean"] as DataType[] },
  { value: "multiselect", labelKey: "widgetTypes.multiselect", dataTypes: ["string", "integer", "float", "boolean"] as DataType[] },
  { value: "radio", labelKey: "widgetTypes.radio", dataTypes: ["string", "integer", "float", "boolean"] as DataType[] },
  { value: "calculated", labelKey: "widgetTypes.calculated", dataTypes: ["integer", "float"] as DataType[] },
  { value: "media_gallery", labelKey: "widgetTypes.media_gallery", dataTypes: ["media"] as DataType[] },
  { value: "file_upload", labelKey: "widgetTypes.file_upload", dataTypes: ["file"] as DataType[] },
  { value: "datepicker", labelKey: "widgetTypes.datepicker", dataTypes: ["date", "datetime"] as DataType[] },
  { value: "composite", labelKey: "widgetTypes.composite", dataTypes: [] as DataType[] },
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number]["value"];

/** Віджети без типу даних (composite — тип даних у підполях) */
export const WIDGETS_WITHOUT_DATA_TYPE: WidgetType[] = ["composite"];

/** Віджети без стандартної валідації (формула, composite — окрема логіка) */
export const WIDGETS_WITHOUT_VALIDATION: WidgetType[] = ["calculated", "composite"];

/** Фіксовані опції для типу Так/Ні. labelKey для i18n. */
export const BOOLEAN_PRESET_OPTIONS = [
  { value: "true", labelKey: "fieldConstructor.booleanYes" },
  { value: "false", labelKey: "fieldConstructor.booleanNo" },
] as const;

/** JSON для presetValues boolean — лише value, label резолвиться через t() при відображенні */
export const BOOLEAN_PRESET_VALUES_JSON = JSON.stringify([
  { value: "true" },
  { value: "false" },
]);

/** Віджети без defaultValue (опції визначають вибір, формула обчислює, або не має сенсу) */
export const WIDGETS_WITHOUT_DEFAULT_VALUE: WidgetType[] = [
  "select",
  "multiselect",
  "radio",
  "media_gallery",
  "file_upload",
  "calculated",
  "datepicker",
];

/** Віджети з presetValues */
export const WIDGETS_WITH_PRESETS: WidgetType[] = [
  "select",
  "multiselect",
  "radio",
  "file_upload",
  "composite",
];

/** Віджети з формулою */
export const WIDGETS_WITH_FORMULA: WidgetType[] = ["calculated"];

/** Віджети з placeholder: текст, число, textarea, select. Без: composite, file_upload, media_gallery, datepicker, radio, multiselect, calculated */
export const WIDGETS_WITH_PLACEHOLDER: WidgetType[] = [
  "text_input",
  "number_input",
  "textarea",
  "select",
];

/** Пресети формату для текстового рядка (TextInput). labelKey для i18n. */
export const TEXT_FORMAT_PRESETS = [
  { value: "any", labelKey: "fieldConstructor.textFormatAny", pattern: "" },
  { value: "email", labelKey: "fieldConstructor.textFormatEmail", pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" },
  { value: "url", labelKey: "fieldConstructor.textFormatUrl", pattern: "^https?://[^\\s]+$" },
  { value: "phone", labelKey: "fieldConstructor.textFormatPhone", pattern: "^[+]?[\\d\\s\\-()]{10,}$" },
  { value: "slug", labelKey: "fieldConstructor.textFormatSlug", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
  { value: "custom", labelKey: "fieldConstructor.textFormatCustom", pattern: "" },
] as const;

export type TextFormatPreset = (typeof TEXT_FORMAT_PRESETS)[number]["value"];

/** Отримати regex для валідації за format та pattern */
export function getTextValidationPattern(
  format: string | undefined,
  pattern: string | undefined
): string | undefined {
  if (pattern?.trim()) return pattern.trim();
  const preset = TEXT_FORMAT_PRESETS.find((p) => p.value === format);
  return preset?.pattern || undefined;
}

/** Одиниці розміру файлу для UI. labelKey для i18n. */
export const FILE_SIZE_UNITS = [
  { value: "bytes", labelKey: "fieldConstructor.fileSizeBytes", multiplier: 1 },
  { value: "KB", labelKey: "fieldConstructor.fileSizeKB", multiplier: 1024 },
  { value: "MB", labelKey: "fieldConstructor.fileSizeMB", multiplier: 1024 * 1024 },
] as const;

export type FileSizeUnit = (typeof FILE_SIZE_UNITS)[number]["value"];

/** Конвертує байти в значення + одиницю для відображення (найкраща одиниця) */
export function bytesToFileSizeDisplay(bytes: number): { value: number; unit: FileSizeUnit } {
  if (!bytes || bytes <= 0) return { value: 0, unit: "KB" };
  if (bytes >= 1024 * 1024 && bytes % (1024 * 1024) === 0) {
    return { value: bytes / (1024 * 1024), unit: "MB" };
  }
  if (bytes >= 1024) {
    return { value: Math.round((bytes / 1024) * 100) / 100, unit: "KB" };
  }
  return { value: bytes, unit: "bytes" };
}

/** Конвертує значення + одиницю в байти */
export function fileSizeDisplayToBytes(value: number, unit: FileSizeUnit): number {
  const u = FILE_SIZE_UNITS.find((x) => x.value === unit);
  return Math.round((u?.multiplier ?? 1024) * value);
}

/** Спрощені опції валідації. labelKey, hintKey для i18n. */
export type ValidationOption = {
  key: string;
  labelKey: string;
  hintKey: string;
  inputType?: "number" | "text" | "checkbox" | "select" | "fileSize";
  selectOptions?: { value: string; labelKey: string }[];
};

export const VALIDATION_OPTIONS: Record<DataType, ValidationOption[]> = {
  string: [
    { key: "required", labelKey: "validation.required", hintKey: "validation.requiredHint" },
    { key: "minLength", labelKey: "validation.minLength", hintKey: "validation.minLengthHint", inputType: "number" },
    { key: "maxLength", labelKey: "validation.maxLength", hintKey: "validation.maxLengthHint", inputType: "number" },
    { key: "format", labelKey: "validation.format", hintKey: "validation.formatHint", inputType: "select", selectOptions: TEXT_FORMAT_PRESETS.map((p) => ({ value: p.value, labelKey: p.labelKey })) },
    { key: "pattern", labelKey: "validation.pattern", hintKey: "validation.patternHint", inputType: "text" },
    { key: "patternMessage", labelKey: "validation.patternMessage", hintKey: "validation.patternMessageHint", inputType: "text" },
    { key: "minRows", labelKey: "validation.minRows", hintKey: "validation.minRowsHint", inputType: "number" },
    { key: "maxRows", labelKey: "validation.maxRows", hintKey: "validation.minRowsHint", inputType: "number" },
  ],
  integer: [
    { key: "required", labelKey: "validation.required", hintKey: "validation.requiredHint" },
    { key: "min", labelKey: "validation.min", hintKey: "validation.minHint", inputType: "number" },
    { key: "max", labelKey: "validation.max", hintKey: "validation.maxHint", inputType: "number" },
    { key: "step", labelKey: "validation.step", hintKey: "validation.stepHint", inputType: "number" },
  ],
  float: [
    { key: "required", labelKey: "validation.required", hintKey: "validation.requiredHint" },
    { key: "min", labelKey: "validation.min", hintKey: "validation.minHint", inputType: "number" },
    { key: "max", labelKey: "validation.max", hintKey: "validation.maxHintFloat", inputType: "number" },
    { key: "step", labelKey: "validation.step", hintKey: "validation.stepHintFloat", inputType: "number" },
    { key: "decimalPlaces", labelKey: "validation.decimalPlaces", hintKey: "validation.decimalPlacesHint", inputType: "number" },
    { key: "useThousandSeparator", labelKey: "validation.useThousandSeparator", hintKey: "validation.thousandSeparatorHint", inputType: "checkbox" },
  ],
  boolean: [
    { key: "required", labelKey: "validation.required", hintKey: "validation.requiredHint" },
  ],
  date: [
    { key: "required", labelKey: "validation.required", hintKey: "validation.requiredHint" },
  ],
  datetime: [
    { key: "required", labelKey: "validation.required", hintKey: "validation.requiredHint" },
  ],
  media: [
    { key: "maxFileSizeBytes", labelKey: "validation.maxFileSizeBytes", hintKey: "fieldConstructor.maxFileSizeHint", inputType: "fileSize" },
  ],
  file: [
    { key: "maxFileSizeBytes", labelKey: "validation.maxFileSizeBytes", hintKey: "fieldConstructor.maxFileSizeHint", inputType: "fileSize" },
  ],
};

/** Шаблони полів — по типу відображення (widget). labelKey для i18n. */
export const FIELD_TEMPLATES = WIDGET_TYPES.map((w) => ({
  id: w.value,
  labelKey: w.labelKey,
  widgetType: w.value as WidgetType,
  dataType: w.dataTypes[0] as DataType | null,
}));

export function getDefaultDataTypeForWidget(widget: WidgetType): DataType | null {
  const w = WIDGET_TYPES.find((x) => x.value === widget);
  if (!w || w.dataTypes.length === 0) return null;
  return w.dataTypes[0];
}

export function widgetNeedsDataType(widget: WidgetType): boolean {
  return !WIDGETS_WITHOUT_DATA_TYPE.includes(widget);
}

export function getDataTypesForWidget(widget: WidgetType): DataType[] {
  const w = WIDGET_TYPES.find((x) => x.value === widget);
  return w ? [...w.dataTypes] : [];
}

/** Перетворює прості значення валідації в JSON для збереження */
export function buildValidationJson(
  _dataType: DataType,
  values: Record<string, string | number | boolean>
): string | null {
  const filtered = Object.fromEntries(
    Object.entries(values)
      .filter(([k, v]) => {
        if (v === "" || v === undefined) return false;
        if (k === "required" && v === false) return false;
        if (k === "useThousandSeparator" && v === false) return false;
        if (k === "format" && (v === "any" || v === "")) return false;
        if (k === "pattern" && !String(v).trim()) return false;
        if (k === "maxFileSizeBytes" && (v === 0 || v === "0")) return false;
        return true;
      })
      .map(([k, v]) => {
        if ((k === "minRows" || k === "maxRows") && typeof v === "number" && v < 1) return [k, 1];
        if ((k === "minLength" || k === "maxLength") && typeof v === "number" && v < 0) return [k, 0];
        return [k, v];
      })
  );
  if (Object.keys(filtered).length === 0) return null;
  return JSON.stringify(filtered);
}

/** Парсить JSON валідації в прості значення для UI */
export function parseValidationJson(json: string | null): Record<string, string | number | boolean> {
  if (!json?.trim()) return {};
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).map(([k, v]) => {
        if (typeof v === "boolean") return [k, v];
        if (typeof v === "number") {
          if ((k === "minRows" || k === "maxRows") && v < 1) return [k, 1];
          if ((k === "minLength" || k === "maxLength") && v < 0) return [k, 0];
          return [k, v];
        }
        if ((k === "required" || k === "useThousandSeparator") && (v === "true" || v === true)) return [k, true];
        return [k, String(v ?? "")];
      })
    );
  } catch {
    return {};
  }
}

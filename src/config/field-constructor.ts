/**
 * Конфігурація конструктора полів.
 * Спосіб відображення (widget) визначає доступні типи даних та валідацію.
 * Валюта прибрана — вартість як float + unit (грн, EUR), курс окремо в інтеграції.
 */

/** Типи даних — тільки для полів, де це має сенс */
export const DATA_TYPES = [
  { value: "string", label: "Текст" },
  { value: "integer", label: "Ціле число" },
  { value: "float", label: "Дробне число" },
  { value: "boolean", label: "Так/Ні" },
  { value: "date", label: "Дата" },
  { value: "datetime", label: "Дата і час" },
  { value: "media", label: "Медіа" },
  { value: "file", label: "Файл" },
] as const;

export type DataType = (typeof DATA_TYPES)[number]["value"];

/** Способи відображення (віджети) — тип даних підбирається автоматично */
export const WIDGET_TYPES = [
  { value: "text_input", label: "Текстовий рядок", dataTypes: ["string"] as DataType[] },
  { value: "number_input", label: "Числовий рядок", dataTypes: ["integer", "float"] as DataType[] },
  { value: "textarea", label: "Текстове поле", dataTypes: ["string"] as DataType[] },
  { value: "select", label: "Спадний список", dataTypes: ["string", "integer", "float", "boolean"] as DataType[] },
  { value: "multiselect", label: "Чекбокс", dataTypes: ["string", "integer", "float", "boolean"] as DataType[] },
  { value: "radio", label: "Вибір одного", dataTypes: ["string", "integer", "float", "boolean"] as DataType[] },
  { value: "calculated", label: "Формула", dataTypes: ["integer", "float"] as DataType[] },
  { value: "media_gallery", label: "Галерея", dataTypes: ["media"] as DataType[] },
  { value: "file_upload", label: "Файли", dataTypes: ["file"] as DataType[] },
  { value: "datepicker", label: "Дата", dataTypes: ["date", "datetime"] as DataType[] },
  { value: "composite", label: "Складене поле", dataTypes: [] as DataType[] },
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number]["value"];

/** Віджети без типу даних (composite — тип даних у підполях) */
export const WIDGETS_WITHOUT_DATA_TYPE: WidgetType[] = ["composite"];

/** Віджети без стандартної валідації (формула, composite — окрема логіка) */
export const WIDGETS_WITHOUT_VALIDATION: WidgetType[] = ["calculated", "composite"];

/** Фіксовані опції для типу Так/Ні — лише true/false, Так/Ні */
export const BOOLEAN_PRESET_OPTIONS = [
  { value: "true", label: "Так" },
  { value: "false", label: "Ні" },
] as const;

export const BOOLEAN_PRESET_VALUES_JSON = JSON.stringify(
  BOOLEAN_PRESET_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
);

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

/** Пресети формату для текстового рядка (TextInput). Текстове поле (Textarea) не використовує. */
export const TEXT_FORMAT_PRESETS = [
  { value: "any", label: "Будь-який текст", pattern: "" },
  { value: "email", label: "Email", pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" },
  { value: "url", label: "URL", pattern: "^https?://[^\\s]+$" },
  { value: "phone", label: "Телефон", pattern: "^[+]?[\\d\\s\\-()]{10,}$" },
  { value: "slug", label: "Slug", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
  { value: "custom", label: "Власний regex", pattern: "" },
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

/** Одиниці розміру файлу для UI */
export const FILE_SIZE_UNITS = [
  { value: "bytes", label: "байт", multiplier: 1 },
  { value: "KB", label: "КБ", multiplier: 1024 },
  { value: "MB", label: "МБ", multiplier: 1024 * 1024 },
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

/** Спрощені опції валідації — замість JSON для звичайного адміна */
export type ValidationOption = {
  key: string;
  label: string;
  hint: string;
  inputType?: "number" | "text" | "checkbox" | "select" | "fileSize";
  selectOptions?: { value: string; label: string }[];
};

export const VALIDATION_OPTIONS: Record<DataType, ValidationOption[]> = {
  string: [
    { key: "required", label: "Обовʼязкове поле", hint: "Не можна залишити порожнім" },
    { key: "minLength", label: "Мін. символів", hint: "Наприклад: 1", inputType: "number" },
    { key: "maxLength", label: "Макс. символів", hint: "Наприклад: 255", inputType: "number" },
    { key: "format", label: "Формат", hint: "Email, URL, телефон тощо", inputType: "select", selectOptions: TEXT_FORMAT_PRESETS.map((p) => ({ value: p.value, label: p.label })) },
    { key: "pattern", label: "Regex", hint: "Наприклад: ^[A-Z0-9]+$", inputType: "text" },
    { key: "patternMessage", label: "Повідомлення при помилці", hint: "Наприклад: Невірний формат email", inputType: "text" },
    { key: "minRows", label: "Мін. висота (рядків)", hint: "Тільки для текстового поля", inputType: "number" },
    { key: "maxRows", label: "Макс. висота (рядків)", hint: "Тільки для текстового поля", inputType: "number" },
  ],
  integer: [
    { key: "required", label: "Обовʼязкове поле", hint: "Не можна залишити порожнім" },
    { key: "min", label: "Мін. значення", hint: "Наприклад: 0", inputType: "number" },
    { key: "max", label: "Макс. значення", hint: "Наприклад: 999999", inputType: "number" },
    { key: "step", label: "Крок", hint: "Наприклад: 1 або 10", inputType: "number" },
  ],
  float: [
    { key: "required", label: "Обовʼязкове поле", hint: "Не можна залишити порожнім" },
    { key: "min", label: "Мін. значення", hint: "Наприклад: 0", inputType: "number" },
    { key: "max", label: "Макс. значення", hint: "Наприклад: 999999.99", inputType: "number" },
    { key: "step", label: "Крок", hint: "Наприклад: 0.01 або 0.5", inputType: "number" },
    { key: "decimalPlaces", label: "Знаків після коми", hint: "Наприклад: 2", inputType: "number" },
    { key: "useThousandSeparator", label: "Роздільник тисяч", hint: "Пробіл між тисячами (1 234,56)", inputType: "checkbox" },
  ],
  boolean: [
    { key: "required", label: "Обовʼязкове поле", hint: "Не можна залишити порожнім" },
  ],
  date: [
    { key: "required", label: "Обовʼязкове поле", hint: "Не можна залишити порожнім" },
  ],
  datetime: [
    { key: "required", label: "Обовʼязкове поле", hint: "Не можна залишити порожнім" },
  ],
  media: [
    { key: "maxFileSizeBytes", label: "Макс. розмір файлу", hint: "Вкажіть розмір файлу", inputType: "fileSize" },
  ],
  file: [
    { key: "maxFileSizeBytes", label: "Макс. розмір файлу", hint: "Вкажіть розмір файлу", inputType: "fileSize" },
  ],
};

/** Шаблони полів — по типу відображення (widget), тип даних обирається з валідних для віджета */
export const FIELD_TEMPLATES = WIDGET_TYPES.map((w) => ({
  id: w.value,
  label: w.label,
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

/**
 * Валідація presetValues для полів з WIDGETS_WITH_PRESETS.
 * Повертає null якщо валідно, інакше текст помилки.
 */

import { parseCompositePresetValues } from "@/config/composite-field";
import type { WidgetType } from "@/config/field-constructor";
import { validateFormula } from "@/features/vehicles/lib/field-utils";

const WIDGETS_WITH_PRESETS: WidgetType[] = [
  "select",
  "multiselect",
  "radio",
  "file_upload",
  "composite",
];

export function validatePresetValuesForWidget(
  json: string | null | undefined,
  widgetType: string
): string | null {
  if (!WIDGETS_WITH_PRESETS.includes(widgetType as WidgetType)) {
    return null;
  }
  if (!json?.trim()) return null;

  try {
    const parsed: unknown = JSON.parse(json);

    if (widgetType === "composite") {
      const config = parseCompositePresetValues(json);
      if (!Array.isArray(config.subFields)) {
        return "Некоректний формат: очікується subFields";
      }
      const codes = new Set<string>();
      for (const sf of config.subFields) {
        const code = String(sf.code ?? "").trim();
        if (!code) return `Підполе "${sf.label}": код не може бути порожнім`;
        if (codes.has(code)) return `Дублікат коду підполя: ${code}`;
        codes.add(code);
        if (sf.widgetType === "calculated" && sf.validation?.trim()) {
          const err = validateFormula(sf.validation.trim());
          if (err) return `Підполе "${sf.label}": ${err}`;
        }
      }
      return null;
    }


    if (widgetType === "file_upload") {
      if (typeof parsed !== "object" || parsed === null) {
        return "Некоректний JSON: очікується об'єкт";
      }
      const obj = parsed as Record<string, unknown>;
      if (!Array.isArray(obj.folders)) {
        return "Некоректний формат: очікується масив folders";
      }
      const codes = new Set<string>();
      for (const f of obj.folders as unknown[]) {
        if (typeof f !== "object" || f === null) {
          return "Кожна папка має містити code та label";
        }
        const o = f as Record<string, unknown>;
        if (typeof o.code !== "string") return "Кожна папка має містити code";
        if (o.label !== undefined && typeof o.label !== "string") return "label має бути рядком";
        if (o.maxFiles != null && (typeof o.maxFiles !== "number" || o.maxFiles < 1)) {
          return "maxFiles має бути цілим числом ≥ 1";
        }
        const code = String(o.code).trim();
        if (!code) return "Код папки не може бути порожнім";
        if (codes.has(code)) return `Дублікат коду папки: ${code}`;
        codes.add(code);
      }
      return null;
    }

    if (["select", "multiselect", "radio"].includes(widgetType)) {
      if (!Array.isArray(parsed)) {
        return "Некоректний формат: очікується JSON масив";
      }
      const values = new Set<string>();
      for (const o of parsed as unknown[]) {
        if (
          typeof o !== "object" ||
          o === null ||
          typeof (o as Record<string, unknown>).value !== "string"
        ) {
          return "Кожен елемент має містити value";
        }
        const v = String((o as Record<string, unknown>).value).trim();
        if (!v) return "Кожен елемент має містити непусте value";
        if (values.has(v)) return "Значення опцій мають бути унікальними";
        values.add(v);
      }
      return null;
    }

    return null;
  } catch {
    return "Некоректний JSON";
  }
}

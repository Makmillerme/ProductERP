/**
 * Утиліти для полів: парсинг presetValues, формула, дати.
 * Використовується DynamicFieldRenderer та віджетами.
 */

import { isValid, formatISO } from "date-fns";

export type SelectOption = { value: string; label: string };

/** Whitelist: digits, spaces, operators, parens, decimal, scientific notation (e,E). Prevents code injection. */
export const FORMULA_EXPR_WHITELIST = /^[\d\s+\-*/.()eE]+$/;

function optionValueMatchesDataType(value: string, dataType: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (dataType === "string") return true;
  if (dataType === "integer") {
    const n = parseInt(v, 10);
    return !Number.isNaN(n) && String(n) === v;
  }
  if (dataType === "float") {
    const n = parseFloat(v);
    return !Number.isNaN(n);
  }
  if (dataType === "boolean") {
    return v === "true" || v === "false";
  }
  return true;
}

export function optionsMatchDataType(
  presetValuesJson: string | null,
  dataType: string
): boolean {
  const opts = parsePresetValues(presetValuesJson);
  if (opts.length === 0) return true;
  return opts.every((o) => optionValueMatchesDataType(o.value, dataType));
}

export function parsePresetValues(json: string | null): SelectOption[] {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (o): o is { value: string; label?: string } =>
          typeof o === "object" &&
          o !== null &&
          typeof (o as { value?: unknown }).value === "string" &&
          (o as { value: string }).value.trim() !== "",
      )
      .map((o) => ({ value: o.value.trim(), label: (o.label ?? o.value).trim() || o.value.trim() }));
  } catch {
    return [];
  }
}

const SLUG_REGEX = /\{(\w+)\}/g;

/** Витягує slug-и з формули: {payload_kg}+{gross_weight} → ["payload_kg","gross_weight"] */
export function extractFormulaSlugs(formula: string | null): string[] {
  if (!formula?.trim()) return [];
  const slugs: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(SLUG_REGEX.source, "g");
  while ((m = re.exec(formula)) !== null) slugs.push(m[1]!);
  return [...new Set(slugs)];
}

/**
 * Валідує формулу. Повертає null якщо валідно, інакше текст помилки.
 * Перевіряє: не порожня, синтаксис (whitelist), виконуваність.
 * Дозволено як вирази з {код_поля}, так і чисто числові (наприклад 100, 1+2).
 */
export function validateFormula(formula: string | null): string | null {
  if (!formula?.trim()) return "Вкажіть формулу";
  const trimmed = formula.trim();
  const slugs = extractFormulaSlugs(trimmed);
  const dummyVehicle = Object.fromEntries(slugs.map((s) => [s, 1]));
  const expr = slugs.length > 0
    ? trimmed.replace(SLUG_REGEX, (_, slug) => {
        const v = dummyVehicle[slug];
        return String(typeof v === "number" ? v : 0);
      })
    : trimmed;
  if (!FORMULA_EXPR_WHITELIST.test(expr)) {
    return "Дозволено лише: цифри, +, -, *, /, дужки, пробіли. Використовуйте {код_поля} для посилань.";
  }
  try {
    Function('"use strict"; return (' + expr + ")")();
    return null;
  } catch {
    return "Невірний синтаксис формули";
  }
}

export function evaluateFormula(
  formula: string | null,
  vehicle: Record<string, unknown>,
): string | null {
  if (!formula?.trim()) return null;
  const expr = formula.replace(SLUG_REGEX, (_, slug) => {
    const v = vehicle[slug];
    const num =
      typeof v === "number" ? v : parseFloat(String(v ?? 0));
    return String(Number.isNaN(num) ? 0 : num);
  });
  if (!FORMULA_EXPR_WHITELIST.test(expr)) return null;
  try {
    const result = Function('"use strict"; return (' + expr + ")")();
    return Number.isFinite(result) ? String(result) : String(result);
  } catch {
    return null;
  }
}

export function parseDateValue(s: string | null): Date | undefined {
  if (!s?.trim()) return undefined;
  const trimmed = s.trim();
  const iso = new Date(trimmed);
  if (!Number.isNaN(iso.getTime())) return iso;
  const ddmmyyyy = trimmed.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    const date = new Date(
      parseInt(y!, 10),
      parseInt(m!, 10) - 1,
      parseInt(d!, 10),
    );
    return isValid(date) ? date : undefined;
  }
  return undefined;
}

export function formatDateToYyyyMmDd(d: Date | undefined): string | null {
  if (!d || !isValid(d)) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Формат для збереження: date — YYYY-MM-DD, datetime — ISO string з часом. */
export function formatDateForStorage(
  d: Date | undefined,
  mode: "date" | "datetime"
): string | null {
  if (!d || !isValid(d)) return null;
  return mode === "datetime" ? formatISO(d) : formatDateToYyyyMmDd(d);
}

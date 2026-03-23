/**
 * i18n — уніфіковані рядки для інтерфейсу.
 * Підтримка uk та en. Локаль зберігається в cookie NEXT_LOCALE.
 */

import { uk, en } from "@/config/locales";

export type Locale = "uk" | "en";

export const LOCALES: { value: Locale; label: string }[] = [
  { value: "uk", label: "Українська" },
  { value: "en", label: "English" },
];

export const DEFAULT_LOCALE: Locale = "uk";

const messages: Record<Locale, Record<string, unknown>> = {
  uk: uk as Record<string, unknown>,
  en: en as Record<string, unknown>,
};

type NestedKey = string;

function getNested(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let value: unknown = obj;
  for (const p of parts) {
    value = (value as Record<string, unknown>)?.[p];
  }
  return value;
}

/**
 * Отримує переклад за ключем для заданої локалі.
 */
export function t(key: NestedKey, locale: Locale = DEFAULT_LOCALE): string {
  const msgs = messages[locale] ?? messages[DEFAULT_LOCALE];
  const value = getNested(msgs, key);
  if (typeof value === "string") return value;
  const fallback = getNested(messages[DEFAULT_LOCALE], key);
  return typeof fallback === "string" ? fallback : key;
}

/**
 * Отримує переклад з підстановкою параметрів.
 */
export function tFormat(
  key: NestedKey,
  params: Record<string, string>,
  locale?: Locale
): string {
  let s = t(key, locale);
  for (const [k, v] of Object.entries(params)) {
    s = s.replace(new RegExp(`\\{${k}\\}`, "g"), v);
  }
  return s;
}

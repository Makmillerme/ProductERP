/**
 * Опції для спадних списків у картці авто.
 * Статуси беруться з БД (ProductStatus), не захардкоджені. Джерело: GET /api/statuses.
 * Управління: Управління → Модель даних → таб «Статуси».
 */

/** @deprecated Використовуйте GET /api/statuses. Залишено для типу. */
export const VEHICLE_STATUSES = [] as const;

export type VehicleStatusOption = string;

/** Стан: Вживане / Нове */
export const VEHICLE_CONDITIONS = ["Вживане", "Нове"] as const;

export type VehicleConditionOption = (typeof VEHICLE_CONDITIONS)[number];

/** Тип палива */
export const FUEL_TYPES = ["Дизель", "Бензин", "Електро", "Газ", "Газ/Бензин"] as const;

export type FuelTypeOption = (typeof FUEL_TYPES)[number];

/** КПП */
export const VEHICLE_TRANSMISSIONS = [
  "Автоматична",
  "Механічна",
  "Робот",
  "Варіатор",
] as const;

export type VehicleTransmissionOption = (typeof VEHICLE_TRANSMISSIONS)[number];

/** Валюта з символом для відображення */
export const CURRENCIES = [
  { value: "UAH", label: "Гривня", symbol: "₴" },
  { value: "USD", label: "Долар США", symbol: "$" },
  { value: "EUR", label: "Євро", symbol: "€" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["value"];

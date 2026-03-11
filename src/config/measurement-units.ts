/**
 * Категорії та розмірності одиниць вимірювання.
 * Дворівневий вибір: категорія → розмірність.
 */

export type MeasurementDimension = {
  value: string;
  label: string;
};

export type MeasurementCategory = {
  id: string;
  label: string;
  dimensions: MeasurementDimension[];
};

export const MEASUREMENT_CATEGORIES: MeasurementCategory[] = [
  {
    id: "length",
    label: "Довжина",
    dimensions: [
      { value: "km", label: "км" },
      { value: "m", label: "м" },
      { value: "dm", label: "дм" },
      { value: "cm", label: "см" },
      { value: "mm", label: "мм" },
      { value: "mi", label: "миля" },
      { value: "yd", label: "ярд" },
      { value: "ft", label: "фут" },
      { value: "in", label: "дюйм" },
    ],
  },
  {
    id: "weight",
    label: "Вага",
    dimensions: [
      { value: "t", label: "т" },
      { value: "kg", label: "кг" },
      { value: "g", label: "г" },
      { value: "mg", label: "мг" },
      { value: "lb", label: "фунт" },
      { value: "oz", label: "унція" },
      { value: "cwt", label: "центнер" },
    ],
  },
  {
    id: "volume",
    label: "Об'єм",
    dimensions: [
      { value: "m3", label: "м³" },
      { value: "dm3", label: "дм³" },
      { value: "l", label: "л" },
      { value: "ml", label: "мл" },
      { value: "gal", label: "гал" },
      { value: "bbl", label: "барель" },
      { value: "ft3", label: "фут³" },
    ],
  },
  {
    id: "currency",
    label: "Валюта",
    dimensions: [
      { value: "UAH", label: "грн" },
      { value: "EUR", label: "EUR" },
      { value: "USD", label: "USD" },
      { value: "PLN", label: "PLN" },
      { value: "CZK", label: "CZK" },
      { value: "GBP", label: "GBP" },
      { value: "CHF", label: "CHF" },
      { value: "RUB", label: "RUB" },
    ],
  },
  {
    id: "power",
    label: "Потужність",
    dimensions: [
      { value: "hp", label: "к.с." },
      { value: "kW", label: "кВт" },
      { value: "W", label: "Вт" },
      { value: "PS", label: "PS" },
    ],
  },
  {
    id: "time",
    label: "Час",
    dimensions: [
      { value: "years", label: "рік" },
      { value: "months", label: "міс" },
      { value: "days", label: "днів" },
      { value: "h", label: "год" },
      { value: "min", label: "хв" },
      { value: "s", label: "сек" },
    ],
  },
  {
    id: "area",
    label: "Площа",
    dimensions: [
      { value: "km2", label: "км²" },
      { value: "ha", label: "га" },
      { value: "m2", label: "м²" },
      { value: "dm2", label: "дм²" },
      { value: "cm2", label: "см²" },
      { value: "acre", label: "акр" },
    ],
  },
  {
    id: "consumption",
    label: "Витрата",
    dimensions: [
      { value: "l100km", label: "л/100 км" },
      { value: "kmpl", label: "км/л" },
      { value: "mpg", label: "миль/гал" },
    ],
  },
  {
    id: "speed",
    label: "Швидкість",
    dimensions: [
      { value: "kmh", label: "км/год" },
      { value: "ms", label: "м/с" },
      { value: "mph", label: "миль/год" },
    ],
  },
  {
    id: "pressure",
    label: "Тиск",
    dimensions: [
      { value: "bar", label: "бар" },
      { value: "MPa", label: "МПа" },
      { value: "kPa", label: "кПа" },
      { value: "psi", label: "psi" },
      { value: "atm", label: "атм" },
    ],
  },
  {
    id: "temperature",
    label: "Температура",
    dimensions: [
      { value: "C", label: "°C" },
      { value: "F", label: "°F" },
      { value: "K", label: "K" },
    ],
  },
  {
    id: "other",
    label: "Інше",
    dimensions: [
      { value: "pcs", label: "шт" },
      { value: "unit", label: "од" },
      { value: "pct", label: "%" },
      { value: "ratio", label: "співвідн." },
      { value: "__custom__", label: "Ввести вручну..." },
    ],
  },
];

/** Чи потрібно показувати поле для власного введення */
export const CUSTOM_UNIT_VALUE = "__custom__";

/** Знаходить категорію та розмірність за збереженим значенням unit */
export function findUnitInCategories(unitValue: string | null | undefined): {
  categoryId: string | null;
  dimensionValue: string | null;
  isCustom: boolean;
} {
  if (!unitValue?.trim())
    return { categoryId: null, dimensionValue: null, isCustom: false };
  const v = unitValue.trim();
  for (const cat of MEASUREMENT_CATEGORIES) {
    const dim = cat.dimensions.find((d) => d.value === v || d.label === v);
    if (dim)
      return { categoryId: cat.id, dimensionValue: dim.value, isCustom: false };
  }
  return {
    categoryId: "other",
    dimensionValue: CUSTOM_UNIT_VALUE,
    isCustom: true,
  };
}

/** Отримує label для відображення за value */
export function getUnitLabel(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  const v = value.trim();
  for (const cat of MEASUREMENT_CATEGORIES) {
    const dim = cat.dimensions.find((d) => d.value === v);
    if (dim) return dim.label;
  }
  return v;
}

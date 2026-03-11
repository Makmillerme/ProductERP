/**
 * Типи та конфіг колонок для Обліку товару.
 * Відповідає таблиці products (структура картки товару).
 */

export type ProductMedia = {
  id: number;
  product_id: number;
  path: string;
  mime_type: string | null;
  kind: "image" | "video" | null;
  order: number;
  created_at: string;
};

export type Product = {
  id: number;
  processed_file_id: number | null;
  payload_json: string;
  pdf_url: string | null;
  brief_pdf_path: string | null;

  // Таб товару — загальний блок
  status: string | null;
  vin: string | null;
  serial_number: string | null;
  product_type: string | null;

  // Таб Авто — загальні характеристики
  brand: string | null;
  model: string | null;
  modification: string | null;
  year_model: number | null;
  producer_country: string | null;
  location: string | null;
  description: string | null;

  // Таб Авто — технічні характеристики
  gross_weight_kg: number | null;
  payload_kg: number | null;
  engine_cm3: number | null;
  power_kw: number | null;
  wheel_formula: string | null;
  seats: number | null;
  transmission: string | null;
  mileage: number | null;
  body_type: string | null;
  condition: string | null;
  fuel_type: string | null;
  cargo_dimensions: string | null;

  // Таб ВМД
  mrn: string | null;
  uktzed: string | null;
  create_at_ccd: string | null;
  created_at: string;
  customs_value: number | null;
  customs_value_plus_10_vat: number | null;
  customs_value_plus_20_vat: number | null;

  // Таб Вартість
  cost_without_vat: number | null;
  cost_with_vat: number | null;
  vat_amount: number | null;
  currency: string | null;

  media?: ProductMedia[];
};

/** Усі ідентифікатори колонок таблиці (для таблиці, фільтрів, сортування). */
export type ProductColumnId = keyof Omit<Product, "id" | "payload_json">;

export type ProductColumnConfig = {
  id: ProductColumnId;
  label: string;
  defaultVisible: boolean;
  align?: "left" | "right";
  minWidth?: string;
};

export const TABLE_COLUMN_MAX_WIDTH = "18rem";

export const PRODUCT_COLUMNS: ProductColumnConfig[] = [
  { id: "status", label: "Статус", defaultVisible: true, minWidth: "6rem" },
  { id: "vin", label: "VIN / SN", defaultVisible: true, minWidth: "10rem" },
  { id: "product_type", label: "Тип товару", defaultVisible: true, minWidth: "8rem" },
  { id: "brand", label: "Марка", defaultVisible: true, minWidth: "7rem" },
  { id: "model", label: "Модель", defaultVisible: true, minWidth: "8rem" },
  { id: "modification", label: "Модифікація", defaultVisible: false, minWidth: "8rem" },
  { id: "year_model", label: "Модельний рік", defaultVisible: true, align: "right", minWidth: "5rem" },
  { id: "producer_country", label: "Країна виробник", defaultVisible: false, minWidth: "8rem" },
  { id: "location", label: "Місцезнаходження", defaultVisible: false, minWidth: "9rem" },
  { id: "mrn", label: "MRN", defaultVisible: true, minWidth: "8rem" },
  { id: "uktzed", label: "УКТЗЕД", defaultVisible: false, minWidth: "8rem" },
  { id: "create_at_ccd", label: "Дата створення ВМД", defaultVisible: true, minWidth: "8rem" },
  { id: "created_at", label: "Дата запису в систему", defaultVisible: false, minWidth: "9rem" },
  { id: "customs_value", label: "Митна вартість", defaultVisible: true, align: "right", minWidth: "7rem" },
  { id: "cost_without_vat", label: "Вартість без ПДВ", defaultVisible: false, align: "right", minWidth: "7rem" },
  { id: "cost_with_vat", label: "Вартість з ПДВ", defaultVisible: false, align: "right", minWidth: "7rem" },
  { id: "currency", label: "Валюта", defaultVisible: false, minWidth: "5rem" },
  { id: "description", label: "Опис", defaultVisible: false, minWidth: "10rem" },
  { id: "gross_weight_kg", label: "Загальна маса (кг)", defaultVisible: false, align: "right", minWidth: "5rem" },
  { id: "payload_kg", label: "Вантажопідйомність (кг)", defaultVisible: false, align: "right", minWidth: "6rem" },
  { id: "engine_cm3", label: "Обʼєм двигуна (см³)", defaultVisible: false, align: "right", minWidth: "5rem" },
  { id: "power_kw", label: "Потужність (кВт)", defaultVisible: false, align: "right", minWidth: "5rem" },
  { id: "wheel_formula", label: "Колісна формула", defaultVisible: false, minWidth: "7rem" },
  { id: "seats", label: "Кількість місць", defaultVisible: false, align: "right", minWidth: "5rem" },
  { id: "transmission", label: "КПП", defaultVisible: false, minWidth: "6rem" },
  { id: "mileage", label: "Пробіг", defaultVisible: false, align: "right", minWidth: "5rem" },
  { id: "body_type", label: "Тип кузова", defaultVisible: false, minWidth: "7rem" },
  { id: "condition", label: "Стан", defaultVisible: false, minWidth: "6rem" },
  { id: "cargo_dimensions", label: "Габарити вантажного відсіку", defaultVisible: false, minWidth: "9rem" },
  { id: "processed_file_id", label: "ID обробленого файлу", defaultVisible: false, align: "right", minWidth: "5rem" },
];


export type ProductFilterState = {
  product_type: string;
  brand: string;
  model: string;
  year_from: string;
  year_to: string;
  value_from: string;
  value_to: string;
};

export type SortConfig = {
  key: ProductColumnId | null;
  dir: "asc" | "desc";
};

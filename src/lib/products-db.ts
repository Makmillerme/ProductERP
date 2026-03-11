/**
 * Маппінг між Prisma Product (camelCase, Date) та фронтовим типом Product (snake_case, string для дат).
 * Сервіс для роботи з таблицею products у БД.
 */
import { prisma } from "@/lib/prisma";
import type { Product, ProductMedia } from "@/features/vehicles/types";
import type { ProductFilterState } from "@/features/vehicles/types";
import type { ProductColumnId } from "@/features/vehicles/types";
import type { Prisma } from "@/generated/prisma/client";

type DbProductMedia = {
  id: number;
  productId: number;
  path: string;
  mimeType: string | null;
  kind: string | null;
  order: number;
  createdAt: Date;
};

type DbProduct = {
  id: number;
  processedFileId: number | null;
  payloadJson: string;
  pdfUrl: string | null;
  briefPdfPath: string | null;
  status: string | null;
  vin: string | null;
  serialNumber: string | null;
  productType: string | null;
  brand: string | null;
  model: string | null;
  modification: string | null;
  yearModel: number | null;
  producerCountry: string | null;
  location: string | null;
  description: string | null;
  grossWeightKg: number | null;
  payloadKg: number | null;
  engineCm3: number | null;
  powerKw: number | null;
  wheelFormula: string | null;
  seats: number | null;
  transmission: string | null;
  mileage: number | null;
  bodyType: string | null;
  condition: string | null;
  fuelType: string | null;
  cargoDimensions: string | null;
  mrn: string | null;
  uktzed: string | null;
  createAtCcd: string | null;
  createdAt: Date;
  customsValue: number | null;
  customsValuePlus10Vat: number | null;
  customsValuePlus20Vat: number | null;
  costWithoutVat: number | null;
  costWithVat: number | null;
  vatAmount: number | null;
  currency: string | null;
  media?: DbProductMedia[];
};

function dbMediaToMedia(m: DbProductMedia): ProductMedia {
  return {
    id: m.id,
    product_id: m.productId,
    path: m.path,
    mime_type: m.mimeType,
    kind: (m.kind === "image" || m.kind === "video" ? m.kind : null) as ProductMedia["kind"],
    order: m.order,
    created_at: m.createdAt.toISOString(),
  };
}

export function dbToProduct(row: DbProduct): Product {
  return {
    id: row.id,
    processed_file_id: row.processedFileId,
    payload_json: row.payloadJson,
    pdf_url: row.pdfUrl,
    brief_pdf_path: row.briefPdfPath,
    status: row.status,
    vin: row.vin,
    serial_number: row.serialNumber,
    product_type: row.productType,
    brand: row.brand,
    model: row.model,
    modification: row.modification,
    year_model: row.yearModel,
    producer_country: row.producerCountry,
    location: row.location,
    description: row.description,
    gross_weight_kg: row.grossWeightKg,
    payload_kg: row.payloadKg,
    engine_cm3: row.engineCm3,
    power_kw: row.powerKw,
    wheel_formula: row.wheelFormula,
    seats: row.seats,
    transmission: row.transmission,
    mileage: row.mileage,
    body_type: row.bodyType,
    condition: row.condition,
    fuel_type: row.fuelType,
    cargo_dimensions: row.cargoDimensions,
    mrn: row.mrn,
    uktzed: row.uktzed,
    create_at_ccd: row.createAtCcd,
    created_at: row.createdAt.toISOString(),
    customs_value: row.customsValue,
    customs_value_plus_10_vat: row.customsValuePlus10Vat,
    customs_value_plus_20_vat: row.customsValuePlus20Vat,
    cost_without_vat: row.costWithoutVat,
    cost_with_vat: row.costWithVat,
    vat_amount: row.vatAmount,
    currency: row.currency,
    media: row.media?.map(dbMediaToMedia),
  };
}

function productToCreateInput(v: Omit<Product, "id" | "created_at">): Prisma.ProductUncheckedCreateInput {
  return {
    processedFileId: v.processed_file_id ?? undefined,
    payloadJson: v.payload_json ?? "{}",
    pdfUrl: v.pdf_url ?? undefined,
    briefPdfPath: v.brief_pdf_path ?? undefined,
    status: v.status ?? undefined,
    vin: v.vin ?? undefined,
    serialNumber: v.serial_number ?? undefined,
    productType: v.product_type ?? undefined,
    brand: v.brand ?? undefined,
    model: v.model ?? undefined,
    modification: v.modification ?? undefined,
    yearModel: v.year_model ?? undefined,
    producerCountry: v.producer_country ?? undefined,
    location: v.location ?? undefined,
    description: v.description ?? undefined,
    grossWeightKg: v.gross_weight_kg ?? undefined,
    payloadKg: v.payload_kg ?? undefined,
    engineCm3: v.engine_cm3 ?? undefined,
    powerKw: v.power_kw ?? undefined,
    wheelFormula: v.wheel_formula ?? undefined,
    seats: v.seats ?? undefined,
    transmission: v.transmission ?? undefined,
    mileage: v.mileage ?? undefined,
    bodyType: v.body_type ?? undefined,
    condition: v.condition ?? undefined,
    fuelType: v.fuel_type ?? undefined,
    cargoDimensions: v.cargo_dimensions ?? undefined,
    mrn: v.mrn ?? undefined,
    uktzed: v.uktzed ?? undefined,
    createAtCcd: v.create_at_ccd ?? undefined,
    customsValue: v.customs_value ?? undefined,
    customsValuePlus10Vat: v.customs_value_plus_10_vat ?? undefined,
    customsValuePlus20Vat: v.customs_value_plus_20_vat ?? undefined,
    costWithoutVat: v.cost_without_vat ?? undefined,
    costWithVat: v.cost_with_vat ?? undefined,
    vatAmount: v.vat_amount ?? undefined,
    currency: v.currency ?? undefined,
  };
}

function productToUpdateInput(v: Partial<Product>): Prisma.ProductUncheckedUpdateInput {
  const input: Prisma.ProductUncheckedUpdateInput = {};
  if (v.processed_file_id !== undefined) input.processedFileId = v.processed_file_id;
  if (v.payload_json !== undefined) input.payloadJson = v.payload_json;
  if (v.pdf_url !== undefined) input.pdfUrl = v.pdf_url;
  if (v.brief_pdf_path !== undefined) input.briefPdfPath = v.brief_pdf_path;
  if (v.status !== undefined) input.status = v.status;
  if (v.vin !== undefined) input.vin = v.vin;
  if (v.serial_number !== undefined) input.serialNumber = v.serial_number;
  if (v.product_type !== undefined) input.productType = v.product_type;
  if (v.brand !== undefined) input.brand = v.brand;
  if (v.model !== undefined) input.model = v.model;
  if (v.modification !== undefined) input.modification = v.modification;
  if (v.year_model !== undefined) input.yearModel = v.year_model;
  if (v.producer_country !== undefined) input.producerCountry = v.producer_country;
  if (v.location !== undefined) input.location = v.location;
  if (v.description !== undefined) input.description = v.description;
  if (v.gross_weight_kg !== undefined) input.grossWeightKg = v.gross_weight_kg;
  if (v.payload_kg !== undefined) input.payloadKg = v.payload_kg;
  if (v.engine_cm3 !== undefined) input.engineCm3 = v.engine_cm3;
  if (v.power_kw !== undefined) input.powerKw = v.power_kw;
  if (v.wheel_formula !== undefined) input.wheelFormula = v.wheel_formula;
  if (v.seats !== undefined) input.seats = v.seats;
  if (v.transmission !== undefined) input.transmission = v.transmission;
  if (v.mileage !== undefined) input.mileage = v.mileage;
  if (v.body_type !== undefined) input.bodyType = v.body_type;
  if (v.condition !== undefined) input.condition = v.condition;
  if (v.fuel_type !== undefined) input.fuelType = v.fuel_type;
  if (v.cargo_dimensions !== undefined) input.cargoDimensions = v.cargo_dimensions;
  if (v.mrn !== undefined) input.mrn = v.mrn;
  if (v.uktzed !== undefined) input.uktzed = v.uktzed;
  if (v.create_at_ccd !== undefined) input.createAtCcd = v.create_at_ccd;
  if (v.customs_value !== undefined) input.customsValue = v.customs_value;
  if (v.customs_value_plus_10_vat !== undefined) input.customsValuePlus10Vat = v.customs_value_plus_10_vat;
  if (v.customs_value_plus_20_vat !== undefined) input.customsValuePlus20Vat = v.customs_value_plus_20_vat;
  if (v.cost_without_vat !== undefined) input.costWithoutVat = v.cost_without_vat;
  if (v.cost_with_vat !== undefined) input.costWithVat = v.cost_with_vat;
  if (v.vat_amount !== undefined) input.vatAmount = v.vat_amount;
  if (v.currency !== undefined) input.currency = v.currency;
  return input;
}

function buildWhere(
  search: string,
  filter: ProductFilterState,
  categoryId?: string
): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [];

  if (categoryId?.trim()) {
    and.push({
      productTypeRef: { categoryId: categoryId.trim() },
    });
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    and.push({
      OR: [
        { mrn: { not: null, contains: q, mode: "insensitive" } },
        { vin: { not: null, contains: q, mode: "insensitive" } },
        { serialNumber: { not: null, contains: q, mode: "insensitive" } },
        { brand: { not: null, contains: q, mode: "insensitive" } },
        { model: { not: null, contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (filter.product_type?.trim()) {
    and.push({
      productType: { contains: filter.product_type.trim(), mode: "insensitive" },
    });
  }
  if (filter.brand?.trim()) {
    and.push({
      brand: { contains: filter.brand.trim(), mode: "insensitive" },
    });
  }
  if (filter.model?.trim()) {
    and.push({
      model: { contains: filter.model.trim(), mode: "insensitive" },
    });
  }
  if (filter.year_from) {
    const y = parseInt(filter.year_from, 10);
    if (!Number.isNaN(y)) and.push({ yearModel: { gte: y } });
  }
  if (filter.year_to) {
    const y = parseInt(filter.year_to, 10);
    if (!Number.isNaN(y)) and.push({ yearModel: { lte: y } });
  }

  if (and.length === 0) return {};
  return { AND: and };
}

const SORT_KEYS: ProductColumnId[] = [
  "processed_file_id", "status", "vin", "serial_number", "product_type",
  "brand", "model", "modification", "year_model", "producer_country", "location", "description",
  "gross_weight_kg", "payload_kg", "engine_cm3", "power_kw", "wheel_formula", "seats",
  "transmission", "mileage", "body_type", "condition", "fuel_type", "cargo_dimensions",
  "mrn", "uktzed", "create_at_ccd", "created_at",
  "customs_value", "customs_value_plus_10_vat", "customs_value_plus_20_vat",
  "cost_without_vat", "cost_with_vat", "vat_amount", "currency",
];

function getOrderBy(sortKey: ProductColumnId | null, sortDir: "asc" | "desc"): Prisma.ProductOrderByWithRelationInput {
  const key = sortKey && SORT_KEYS.includes(sortKey) ? sortKey : "created_at";
  const map: Record<string, Prisma.ProductOrderByWithRelationInput> = {
    processed_file_id: { processedFileId: sortDir },
    status: { status: sortDir },
    vin: { vin: sortDir },
    serial_number: { serialNumber: sortDir },
    product_type: { productType: sortDir },
    brand: { brand: sortDir },
    model: { model: sortDir },
    modification: { modification: sortDir },
    year_model: { yearModel: sortDir },
    producer_country: { producerCountry: sortDir },
    location: { location: sortDir },
    description: { description: sortDir },
    gross_weight_kg: { grossWeightKg: sortDir },
    payload_kg: { payloadKg: sortDir },
    engine_cm3: { engineCm3: sortDir },
    power_kw: { powerKw: sortDir },
    wheel_formula: { wheelFormula: sortDir },
    seats: { seats: sortDir },
    transmission: { transmission: sortDir },
    mileage: { mileage: sortDir },
    body_type: { bodyType: sortDir },
    condition: { condition: sortDir },
    fuel_type: { fuelType: sortDir },
    cargo_dimensions: { cargoDimensions: sortDir },
    mrn: { mrn: sortDir },
    uktzed: { uktzed: sortDir },
    create_at_ccd: { createAtCcd: sortDir },
    created_at: { createdAt: sortDir },
    customs_value: { customsValue: sortDir },
    customs_value_plus_10_vat: { customsValuePlus10Vat: sortDir },
    customs_value_plus_20_vat: { customsValuePlus20Vat: sortDir },
    cost_without_vat: { costWithoutVat: sortDir },
    cost_with_vat: { costWithVat: sortDir },
    vat_amount: { vatAmount: sortDir },
    currency: { currency: sortDir },
  };
  return map[key] ?? { createdAt: sortDir };
}

export type ListProductsParams = {
  search?: string;
  filter?: ProductFilterState;
  sortKey?: ProductColumnId | null;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  categoryId?: string;
};

export type ListProductsResult = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listProducts(params: ListProductsParams): Promise<ListProductsResult> {
  const {
    search = "",
    filter = {
      product_type: "",
      brand: "",
      model: "",
      year_from: "",
      year_to: "",
      value_from: "",
      value_to: "",
    },
    sortKey = "created_at",
    sortDir = "desc",
    page = 1,
    pageSize = 500,
    categoryId = undefined,
  } = params;

  const where = buildWhere(search, filter, categoryId);
  const orderBy = getOrderBy(sortKey ?? null, sortDir);

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  let list = (items as DbProduct[]).map(dbToProduct);
  const valueFrom = filter.value_from ? parseFloat(filter.value_from) : NaN;
  const valueTo = filter.value_to ? parseFloat(filter.value_to) : NaN;
  if (!Number.isNaN(valueFrom) || !Number.isNaN(valueTo)) {
    list = list.filter((v) => {
      const num = v.customs_value ?? v.cost_without_vat ?? v.cost_with_vat;
      if (num == null || Number.isNaN(num)) return true;
      if (!Number.isNaN(valueFrom) && num < valueFrom) return false;
      if (!Number.isNaN(valueTo) && num > valueTo) return false;
      return true;
    });
  }

  return {
    items: list,
    total: list.length === items.length ? total : list.length,
    page,
    pageSize,
  };
}

export async function getProductById(id: number): Promise<Product | null> {
  try {
    const row = await prisma.product.findUnique({
      where: { id },
      include: { media: { orderBy: { order: "asc" } } },
    });
    if (!row) return null;
    return dbToProduct(row as DbProduct);
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2021") {
      const row = await prisma.product.findUnique({ where: { id } });
      if (!row) return null;
      return dbToProduct({ ...row, media: [] } as DbProduct);
    }
    throw e;
  }
}

export async function createProduct(data: Omit<Product, "id" | "created_at">): Promise<Product> {
  const row = await prisma.product.create({
    data: productToCreateInput(data),
  });
  return dbToProduct(row as DbProduct);
}

export async function updateProduct(id: number, data: Partial<Omit<Product, "id">>): Promise<Product | null> {
  try {
    const row = await prisma.product.update({
      where: { id },
      data: productToUpdateInput(data),
    });
    return dbToProduct(row as DbProduct);
  } catch {
    return null;
  }
}

export async function deleteProduct(id: number): Promise<boolean> {
  try {
    await prisma.product.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

async function getNextMediaOrder(productId: number): Promise<number> {
  const last = await prisma.productMedia.findFirst({
    where: { productId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? -1) + 1;
}

export async function createProductMedia(
  productId: number,
  data: { path: string; mimeType: string | null; kind: "image" | "video" }
): Promise<ProductMedia> {
  const row = await prisma.productMedia.create({
    data: {
      productId,
      path: data.path,
      mimeType: data.mimeType,
      kind: data.kind,
      order: await getNextMediaOrder(productId),
    },
  });
  return dbMediaToMedia(row as DbProductMedia);
}

export async function deleteProductMediaById(
  productId: number,
  mediaId: number
): Promise<{ path: string } | null> {
  const row = await prisma.productMedia.findFirst({
    where: { id: mediaId, productId },
  });
  if (!row) return null;
  await prisma.productMedia.delete({ where: { id: mediaId } });
  return { path: row.path };
}

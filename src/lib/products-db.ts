/**
 * Маппінг між Prisma Product (camelCase) та фронтовим Product (snake_case base + EAV).
 * Всі польові дані — через ProductFieldValue.
 */
import { prisma } from "@/lib/prisma";
import type { Product, ProductMedia } from "@/features/products/types";
import type { ProductFilterState, ProductColumnId } from "@/features/products/types";
import type { Prisma } from "@/generated/prisma/client";
import {
  upsertProductFieldValues,
  loadProductFieldValues,
  getFieldDefinitionsForCategory,
} from "@/lib/product-field-values";

type DbProductMedia = {
  id: number;
  productId: number;
  path: string;
  mimeType: string | null;
  kind: string | null;
  order: number;
  createdAt: Date;
};

type DbProductRow = {
  id: number;
  productTypeId: string | null;
  categoryId: string | null;
  productStatusId: string | null;
  processedFileId: number | null;
  createdAt: Date;
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

function rowToBaseProduct(row: DbProductRow): Omit<Product, "media"> & { media?: ProductMedia[] } {
  const base: Product = {
    id: row.id,
    processed_file_id: row.processedFileId,
    product_status_id: row.productStatusId,
    product_type_id: row.productTypeId,
    category_id: row.categoryId,
    created_at: row.createdAt.toISOString(),
    media: row.media?.map(dbMediaToMedia),
  };
  return base;
}

function mergeFieldValues(base: Record<string, unknown>, fieldValues: Record<string, unknown>): Product {
  return { ...base, ...fieldValues } as Product;
}

const BASE_PRODUCT_KEYS = new Set([
  "id",
  "processed_file_id",
  "product_status_id",
  "product_type_id",
  "category_id",
  "created_at",
  "media",
]);

type BaseProductInput = {
  processedFileId?: number | null;
  productStatusId?: string | null;
  productTypeId?: string | null;
  categoryId?: string | null;
};

function extractBaseAndFieldValues(data: Record<string, unknown>): {
  base: BaseProductInput;
  fieldValues: Record<string, unknown>;
} {
  const base: Record<string, unknown> = {};
  const fieldValues: Record<string, unknown> = {};
  const snakeToCamel: Record<string, string> = {
    processed_file_id: "processedFileId",
    product_status_id: "productStatusId",
    product_type_id: "productTypeId",
    category_id: "categoryId",
  };
  for (const [key, value] of Object.entries(data)) {
    if (BASE_PRODUCT_KEYS.has(key)) {
      const camel = snakeToCamel[key] ?? key;
      if (key === "processed_file_id") base[camel] = value as number | null;
      else if (key === "media") continue;
      else base[camel] = value;
    } else {
      fieldValues[key] = value;
    }
  }
  return { base: base as BaseProductInput, fieldValues };
}

const BASE_FILTER_KEYS = new Set(["product_status_id", "productStatusId", "product_type_id", "productTypeId"]);

function buildWhere(
  filter: ProductFilterState,
  categoryId?: string,
  search?: string,
  searchableFieldCodes?: string[]
): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [];

  if (categoryId?.trim()) {
    const catId = categoryId.trim();
    and.push({
      OR: [
        { productTypeRef: { categoryId: catId } },
        { categoryId: catId },
      ],
    });
  }

  const productStatusId = filter.product_status_id ?? filter.productStatusId;
  const productTypeId = filter.product_type_id ?? filter.productTypeId;
  if (productStatusId?.trim()) and.push({ productStatusId: productStatusId.trim() });
  if (productTypeId?.trim()) and.push({ productTypeId: productTypeId.trim() });

  if (search?.trim() && searchableFieldCodes?.length) {
    const q = search.trim();
    const codes = searchableFieldCodes.filter(Boolean);
    if (codes.length > 0) {
      and.push({
        fieldValues: {
          some: {
            fieldDefinition: { code: { in: codes } },
            textValue: { contains: q, mode: "insensitive" },
          },
        },
      });
    }
  }

  for (const [key, value] of Object.entries(filter)) {
    const v = String(value ?? "").trim();
    if (!v) continue;
    if (BASE_FILTER_KEYS.has(key)) continue;

    const isFrom = key.endsWith("_from");
    const isTo = key.endsWith("_to");
    const code = isFrom ? key.slice(0, -5) : isTo ? key.slice(0, -3) : key;

    if (isFrom) {
      const num = parseFloat(v);
      if (!Number.isNaN(num)) {
        and.push({
          fieldValues: {
            some: {
              fieldDefinition: { code },
              numericValue: { gte: num },
            },
          },
        });
      }
    } else if (isTo) {
      const num = parseFloat(v);
      if (!Number.isNaN(num)) {
        and.push({
          fieldValues: {
            some: {
              fieldDefinition: { code },
              numericValue: { lte: num },
            },
          },
        });
      }
    } else {
      and.push({
        fieldValues: {
          some: {
            fieldDefinition: { code },
            textValue: { contains: v, mode: "insensitive" },
          },
        },
      });
    }
  }

  if (and.length === 0) return {};
  return { AND: and };
}

function getOrderBy(sortKey: ProductColumnId | null, sortDir: "asc" | "desc"): Prisma.ProductOrderByWithRelationInput {
  const valid: ProductColumnId[] = ["created_at", "id"];
  const key = sortKey && valid.includes(sortKey) ? sortKey : "created_at";
  const camel = key === "created_at" ? "createdAt" : key;
  return { [camel]: sortDir };
}

export type ListProductsParams = {
  search?: string;
  filter?: ProductFilterState;
  sortKey?: ProductColumnId | null;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  categoryId?: string;
  searchableFieldCodes?: string[];
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
    filter = {},
    sortKey = "created_at",
    sortDir = "desc",
    page = 1,
    pageSize = 500,
    categoryId = undefined,
    searchableFieldCodes = undefined,
  } = params;

  const where = buildWhere(filter, categoryId, search, searchableFieldCodes);
  const orderBy = getOrderBy(sortKey ?? null, sortDir);

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        media: { orderBy: { order: "asc" } },
        fieldValues: { include: { fieldDefinition: { select: { id: true, code: true, dataType: true } } } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const products: Product[] = [];
  for (const row of items) {
  const baseObj = rowToBaseProduct(row as DbProductRow);
  const base = baseObj as Record<string, unknown>;
  const fv: Record<string, unknown> = {};
  for (const v of row.fieldValues ?? []) {
      const fd = v.fieldDefinition;
      const key = fd.code ?? fd.id;
      const dt = fd.dataType ?? "string";
      let val: unknown;
      if (dt === "integer" || dt === "float") val = v.numericValue;
      else if (dt === "date" || dt === "datetime") val = v.dateValue?.toISOString() ?? null;
      else val = v.textValue ?? null;
      if (val !== null && val !== undefined && (typeof val !== "string" || val !== "")) {
        if (typeof val === "string" && val.trim()) {
          const t = val.trim();
          if ((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))) {
            try {
              val = JSON.parse(t) as unknown;
            } catch {
              // leave as string
            }
          }
        }
        fv[key] = val;
      }
    }
    products.push(mergeFieldValues(base, fv));
  }

  return { items: products, total, page, pageSize };
}

export async function getProductById(id: number): Promise<Product | null> {
  const row = await prisma.product.findUnique({
    where: { id },
    include: {
      media: { orderBy: { order: "asc" } },
      fieldValues: { include: { fieldDefinition: { select: { id: true, code: true, dataType: true } } } },
    },
  });
  if (!row) return null;
  const base = rowToBaseProduct(row as DbProductRow);
  const fv = await loadProductFieldValues(id);
  return mergeFieldValues(base, fv);
}

export type CreateProductInput = Omit<Product, "id" | "created_at">;

export async function createProduct(data: CreateProductInput): Promise<Product> {
  const { base, fieldValues } = extractBaseAndFieldValues(data as Record<string, unknown>);
  const categoryId = (base.categoryId ?? data.category_id) as string | undefined;
  if (!categoryId?.trim()) {
    throw new Error("category_id обов'язковий для створення товару");
  }
  const row = await prisma.product.create({
    data: {
      processedFileId: base.processedFileId ?? undefined,
      productStatusId: base.productStatusId ?? undefined,
      productTypeId: base.productTypeId ?? undefined,
      categoryId: base.categoryId ?? undefined,
    },
    include: {
      media: { orderBy: { order: "asc" } },
    },
  });
  const defs = await getFieldDefinitionsForCategory(categoryId.trim());
  if (Object.keys(fieldValues).length > 0) {
    await upsertProductFieldValues(row.id, fieldValues, defs);
  }
  const loaded = await loadProductFieldValues(row.id);
  const baseProduct = rowToBaseProduct(row as DbProductRow);
  return mergeFieldValues(baseProduct, loaded);
}

export async function updateProduct(
  id: number,
  data: Partial<Omit<Product, "id">>
): Promise<Product | null> {
  const { base, fieldValues } = extractBaseAndFieldValues(data as Record<string, unknown>);
  const updateData: Prisma.ProductUncheckedUpdateInput = {};
  if (base.processedFileId !== undefined) updateData.processedFileId = base.processedFileId;
  if (base.productStatusId !== undefined) updateData.productStatusId = base.productStatusId;
  if (base.productTypeId !== undefined) updateData.productTypeId = base.productTypeId;
  if (base.categoryId !== undefined) updateData.categoryId = base.categoryId;

  try {
    const row = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { media: { orderBy: { order: "asc" } } },
    });
    if (Object.keys(fieldValues).length > 0) {
      const categoryId = (row.categoryId ?? base.categoryId) as string | undefined;
      if (categoryId?.trim()) {
        const defs = await getFieldDefinitionsForCategory(categoryId.trim());
        await upsertProductFieldValues(id, fieldValues, defs);
      }
    }
    const loaded = await loadProductFieldValues(id);
    const baseProduct = rowToBaseProduct(row as DbProductRow);
    return mergeFieldValues(baseProduct, loaded);
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

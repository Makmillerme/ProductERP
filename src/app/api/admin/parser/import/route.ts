import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { OWNER_ROLE } from "@/config/owner";
import { ADMIN_ROLE } from "@/config/roles";
import { prisma } from "@/lib/prisma";
import { createProduct, updateProduct } from "@/lib/products-db";
import { findProductIdByFieldValue } from "@/lib/product-field-values";

export const dynamic = "force-dynamic";

/** Поля парсера, що йдуть у fieldValues (code). vehicle_type → productTypeId, решта — EAV. */
const PARSER_FIELD_CODES = new Set([
  "mrn",
  "uktzed",
  "brand",
  "model",
  "modification",
  "year_model",
  "vin",
  "serial_number",
  "gross_weight_kg",
  "payload_kg",
  "engine_cm3",
  "power_kw",
  "seats",
  "wheel_formula",
  "producer_country",
  "customs_value",
  "fuel_type",
  "condition",
  "body_type",
  "description",
  "create_at_ccd",
  "mileage",
  "cargo_dimensions",
  "transmission",
  "customs_value_plus_10_vat",
  "customs_value_plus_20_vat",
]);

const FLOAT_CODES = new Set([
  "gross_weight_kg",
  "payload_kg",
  "engine_cm3",
  "power_kw",
  "mileage",
  "customs_value",
  "customs_value_plus_10_vat",
  "customs_value_plus_20_vat",
]);

const INT_CODES = new Set(["year_model", "seats"]);

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  if (role !== ADMIN_ROLE && role !== OWNER_ROLE) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

function coerceValue(code: string, value: unknown): unknown {
  if (value === null || value === undefined || value === "") return null;
  if (INT_CODES.has(code)) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  if (FLOAT_CODES.has(code)) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return String(value);
}

function buildFieldValuesFromRaw(raw: Record<string, unknown>): Record<string, unknown> {
  const fieldValues: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!PARSER_FIELD_CODES.has(key)) continue;
    const v = coerceValue(key, value);
    if (v !== null && v !== undefined && v !== "") {
      fieldValues[key] = v;
    }
  }
  return fieldValues;
}

const productTypeCache = new Map<string, ResolvedProductType>();

type ResolvedProductType = { id: string; categoryId: string | null };

async function resolveProductType(
  typeName: string | null | undefined,
  defaultCategoryId?: string | null
): Promise<ResolvedProductType | null> {
  if (!typeName?.trim()) return null;
  const name = typeName.trim();
  const nameLower = name.toLowerCase();

  if (productTypeCache.has(nameLower)) {
    return productTypeCache.get(nameLower)!;
  }

  const existing = await prisma.productType.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true, categoryId: true },
  });

  if (existing) {
    const result = { id: existing.id, categoryId: existing.categoryId };
    productTypeCache.set(nameLower, result);
    return result;
  }

  const created = await prisma.productType.create({
    data: {
      name,
      isAutoDetected: true,
      categoryId: defaultCategoryId?.trim() ?? null,
    },
  });

  const result = { id: created.id, categoryId: created.categoryId };
  productTypeCache.set(nameLower, result);
  return result;
}

async function findExistingProductId(mrn: string | null, vin: string | null): Promise<number | null> {
  if (mrn) {
    const id = await findProductIdByFieldValue("mrn", mrn);
    if (id) return id;
  }
  if (vin) {
    const id = await findProductIdByFieldValue("vin", vin);
    if (id) return id;
  }
  return null;
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: {
    products?: Record<string, unknown>[];
    vehicles?: Record<string, unknown>[];
    categoryId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const items = body.products ?? body.vehicles;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "products or vehicles array is required and must not be empty" },
      { status: 400 }
    );
  }

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  productTypeCache.clear();

  for (let i = 0; i < items.length; i++) {
    try {
      const raw = items[i] as Record<string, unknown>;
      const productTypeName = (raw.vehicle_type ?? raw.productType) as string | null | undefined;
      const resolved = await resolveProductType(productTypeName, body.categoryId);

      let categoryId: string | null = resolved?.categoryId ?? null;
      if (!categoryId && body.categoryId) categoryId = body.categoryId;
      if (!categoryId?.trim()) {
        errors.push(`Product[${i}]: category_id обов'язковий (вкажіть categoryId у body або прив'яжіть productType до категорії)`);
        continue;
      }

      const productTypeId = resolved?.id ?? null;
      const fieldValues = buildFieldValuesFromRaw(raw);

      const mrn = (fieldValues.mrn as string) || (raw.mrn as string) || null;
      const vin = (fieldValues.vin as string) || (raw.vin as string) || null;

      const existingId = await findExistingProductId(mrn, vin);

      const payload = {
        product_type_id: productTypeId,
        category_id: categoryId,
        product_status_id: null,
        ...fieldValues,
      };

      if (existingId) {
        await updateProduct(existingId, payload);
        updated++;
      } else {
        await createProduct(payload);
        created++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Product[${i}]: ${msg}`);
    }
  }

  return NextResponse.json({ created, updated, errors });
}

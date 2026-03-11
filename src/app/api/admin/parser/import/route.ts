import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { OWNER_ROLE } from "@/config/owner";
import { ADMIN_ROLE } from "@/config/roles";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export const dynamic = "force-dynamic";

const FIELD_MAP: Record<string, string> = {
  mrn: "mrn",
  uktzed: "uktzed",
  vehicle_type: "productType",
  brand: "brand",
  model: "model",
  modification: "modification",
  year_model: "yearModel",
  vin: "vin",
  serial_number: "serialNumber",
  gross_weight_kg: "grossWeightKg",
  payload_kg: "payloadKg",
  engine_cm3: "engineCm3",
  power_kw: "powerKw",
  seats: "seats",
  wheel_formula: "wheelFormula",
  producer_country: "producerCountry",
  customs_value: "customsValue",
  fuel_type: "fuelType",
  condition: "condition",
  body_type: "bodyType",
  description: "description",
  create_at_ccd: "createAtCcd",
  mileage: "mileage",
  cargo_dimensions: "cargoDimensions",
  transmission: "transmission",
  customs_value_plus_10_vat: "customsValuePlus10Vat",
  customs_value_plus_20_vat: "customsValuePlus20Vat",
};

const FLOAT_FIELDS = new Set([
  "grossWeightKg",
  "payloadKg",
  "engineCm3",
  "powerKw",
  "mileage",
  "customsValue",
  "customsValuePlus10Vat",
  "customsValuePlus20Vat",
]);

const INT_FIELDS = new Set(["yearModel", "seats"]);

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  if (role !== ADMIN_ROLE && role !== OWNER_ROLE) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

function coerce(key: string, value: unknown): unknown {
  if (value === null || value === undefined || value === "") return null;
  if (INT_FIELDS.has(key)) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  if (FLOAT_FIELDS.has(key)) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return String(value);
}

function mapVehicleData(raw: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  for (const [snakeKey, value] of Object.entries(raw)) {
    const camelKey = FIELD_MAP[snakeKey];
    if (!camelKey) continue;
    mapped[camelKey] = coerce(camelKey, value);
  }
  return mapped;
}

const productTypeCache = new Map<string, string>();

async function resolveProductTypeId(typeName: string | null | undefined): Promise<string | null> {
  if (!typeName?.trim()) return null;
  const name = typeName.trim();
  const nameLower = name.toLowerCase();

  if (productTypeCache.has(nameLower)) {
    return productTypeCache.get(nameLower)!;
  }

  const existing = await prisma.productType.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });

  if (existing) {
    productTypeCache.set(nameLower, existing.id);
    return existing.id;
  }

  const code = slugify(name) || `type-${Date.now()}`;
  const codeExists = await prisma.productType.findUnique({ where: { code } });
  const finalCode = codeExists ? `${code}-${Date.now()}` : code;

  const created = await prisma.productType.create({
    data: { name, code: finalCode, isAutoDetected: true },
  });

  productTypeCache.set(nameLower, created.id);
  return created.id;
}

async function findExisting(mrn: string | null, vin: string | null) {
  if (mrn) {
    const found = await prisma.product.findFirst({ where: { mrn } });
    if (found) return found;
  }
  if (vin) {
    const found = await prisma.product.findFirst({ where: { vin } });
    if (found) return found;
  }
  return null;
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { vehicles?: Record<string, unknown>[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.vehicles) || body.vehicles.length === 0) {
    return NextResponse.json(
      { error: "vehicles array is required and must not be empty" },
      { status: 400 },
    );
  }

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  productTypeCache.clear();

  for (let i = 0; i < body.vehicles.length; i++) {
    try {
      const raw = body.vehicles[i];
      const data = mapVehicleData(raw);

      const productTypeName = data.productType as string | null;
      const productTypeId = await resolveProductTypeId(productTypeName);
      if (productTypeId) {
        data.productTypeId = productTypeId;
      }

      const mrn = (data.mrn as string) || null;
      const vin = (data.vin as string) || null;

      const existing = await findExisting(mrn, vin);

      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await prisma.product.create({ data });
        created++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Product[${i}]: ${msg}`);
    }
  }

  return NextResponse.json({ created, updated, errors });
}

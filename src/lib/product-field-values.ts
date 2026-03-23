/**
 * EAV: збереження та завантаження значень полів товару через ProductFieldValue.
 * Маппінг по dataType: string/boolean/composite/multiselect → textValue,
 * integer/float → numericValue, date/datetime → dateValue.
 */
import { prisma } from "@/lib/prisma";

export type FieldDefinitionRef = {
  id: string;
  code: string | null;
  dataType: string;
};

/** Отримати FieldDefinition за code (перший знайдений). */
export async function getFieldDefinitionByCode(code: string): Promise<FieldDefinitionRef | null> {
  const fd = await prisma.fieldDefinition.findFirst({
    where: { code },
    select: { id: true, code: true, dataType: true },
  });
  return fd ? { id: fd.id, code: fd.code, dataType: fd.dataType ?? "string" } : null;
}

/** Побудувати code|id → FieldDefinitionRef з табів категорії. */
export async function getFieldDefinitionsForCategory(
  categoryId: string
): Promise<FieldDefinitionRef[]> {
  const tabs = await prisma.tabDefinition.findMany({
    where: { categoryId },
    orderBy: { order: "asc" },
    include: {
      fields: {
        orderBy: { order: "asc" },
        include: {
          fieldDefinition: {
            select: { id: true, code: true, dataType: true },
          },
        },
      },
    },
  });
  const seen = new Set<string>();
  const result: FieldDefinitionRef[] = [];
  for (const tab of tabs) {
    for (const f of tab.fields) {
      const fd = f.fieldDefinition;
      if (!fd || seen.has(fd.id)) continue;
      seen.add(fd.id);
      result.push({
        id: fd.id,
        code: fd.code,
        dataType: fd.dataType ?? "string",
      });
    }
  }
  return result;
}

/** Ключ для доступу: code або id. */
function getFieldDefByKey(
  defs: FieldDefinitionRef[],
  key: string
): FieldDefinitionRef | undefined {
  const byCode = defs.find((d) => d.code === key);
  if (byCode) return byCode;
  return defs.find((d) => d.id === key);
}

function valueToDb(
  value: unknown,
  dataType: string
): { textValue?: string; numericValue?: number; dateValue?: Date } {
  if (value === null || value === undefined || value === "") {
    return {};
  }
  const dt = dataType.toLowerCase();

  if (dt === "integer" || dt === "float") {
    const n = typeof value === "number" ? value : parseFloat(String(value));
    if (!Number.isNaN(n)) return { numericValue: n };
  }
  if (dt === "date" || dt === "datetime") {
    const d = value instanceof Date ? value : new Date(String(value));
    if (!Number.isNaN(d.getTime())) return { dateValue: d };
  }

  // string, boolean, composite, multiselect, media, file
  if (typeof value === "object" && value !== null && !(value instanceof Date)) {
    return { textValue: JSON.stringify(value) };
  }
  return { textValue: String(value) };
}

function dbToValue(
  fv: { textValue?: string | null; numericValue?: number | null; dateValue?: Date | null },
  dataType: string
): unknown {
  const dt = dataType.toLowerCase();
  if (dt === "integer" || dt === "float") {
    if (fv.numericValue != null) return fv.numericValue;
  }
  if (dt === "date" || dt === "datetime") {
    if (fv.dateValue) return fv.dateValue.toISOString();
  }
  if (fv.textValue != null && fv.textValue !== "") {
    if (dt === "boolean") return fv.textValue === "true";
    const trimmed = fv.textValue.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        return JSON.parse(trimmed) as unknown;
      } catch {
        return fv.textValue;
      }
    }
    return fv.textValue;
  }
  return null;
}

/** Зберегти fieldValues для товару. Ключі в record — code або fieldDefinitionId. */
export async function upsertProductFieldValues(
  productId: number,
  fieldValues: Record<string, unknown>,
  fieldDefinitions: FieldDefinitionRef[]
): Promise<void> {
  for (const [key, value] of Object.entries(fieldValues)) {
    const def = getFieldDefByKey(fieldDefinitions, key);
    if (!def) continue;

    const db = valueToDb(value, def.dataType);
    if (Object.keys(db).length === 0) {
      await prisma.productFieldValue.deleteMany({
        where: { productId, fieldDefinitionId: def.id },
      });
      continue;
    }

    await prisma.productFieldValue.upsert({
      where: {
        productId_fieldDefinitionId: { productId, fieldDefinitionId: def.id },
      },
      create: {
        productId,
        fieldDefinitionId: def.id,
        ...db,
      },
      update: db,
    });
  }
}

/** Знайти productId за значенням поля (наприклад mrn, vin). */
export async function findProductIdByFieldValue(
  code: string,
  value: string | null
): Promise<number | null> {
  if (!value?.trim()) return null;
  const fd = await prisma.fieldDefinition.findFirst({
    where: { code },
    select: { id: true },
  });
  if (!fd) return null;
  const pv = await prisma.productFieldValue.findFirst({
    where: { fieldDefinitionId: fd.id, textValue: value.trim() },
    select: { productId: true },
  });
  return pv?.productId ?? null;
}

/** Завантажити значення полів товару, повернути Record<code, value>. */
export async function loadProductFieldValues(
  productId: number
): Promise<Record<string, unknown>> {
  const rows = await prisma.productFieldValue.findMany({
    where: { productId },
    include: {
      fieldDefinition: {
        select: { id: true, code: true, dataType: true },
      },
    },
  });
  const result: Record<string, unknown> = {};
  for (const r of rows) {
    const fd = r.fieldDefinition;
    const key = fd.code ?? fd.id;
    result[key] = dbToValue(
      {
        textValue: r.textValue,
        numericValue: r.numericValue,
        dateValue: r.dateValue,
      },
      fd.dataType ?? "string"
    );
  }
  return result;
}

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { OWNER_ROLE } from "@/config/owner";
import { ADMIN_ROLE } from "@/config/roles";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { validatePresetValuesForWidget } from "@/lib/validate-preset-values";
import { validateFormula } from "@/features/products/lib/field-utils";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  if (role !== ADMIN_ROLE && role !== OWNER_ROLE) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const categoryId = searchParams.get("categoryId")?.trim() ?? null;
    const productTypeId = searchParams.get("productTypeId")?.trim() ?? null;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(500, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20));

    const andParts: Prisma.FieldDefinitionWhereInput[] = [];

    if (search) {
      andParts.push({
        OR: [
          { label: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
          { dataType: { contains: search, mode: "insensitive" } },
          { widgetType: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (categoryId || productTypeId) {
      const orParts: Prisma.FieldDefinitionWhereInput[] = [
        { AND: [{ fieldDefinitionCategories: { none: {} } }, { fieldDefinitionProductTypes: { none: {} } }] },
      ];
      if (categoryId) {
        orParts.push({ fieldDefinitionCategories: { some: { categoryId } } });
        orParts.push({ fieldDefinitionProductTypes: { some: { productType: { categoryId } } } });
      }
      if (productTypeId) {
        orParts.push({ fieldDefinitionProductTypes: { some: { productTypeId } } });
      }
      andParts.push({ OR: orParts });
    }

    const where: Prisma.FieldDefinitionWhereInput | undefined =
      andParts.length > 0 ? { AND: andParts } : undefined;

    const [fields, total] = await Promise.all([
      prisma.fieldDefinition.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { tabFields: true } },
          fieldDefinitionCategories: { select: { categoryId: true } },
          fieldDefinitionProductTypes: { select: { productTypeId: true } },
        },
      }),
      prisma.fieldDefinition.count({ where }),
    ]);

    const fieldDefinitions = fields.map(({ fieldDefinitionCategories, fieldDefinitionProductTypes, ...f }) => ({
      ...f,
      categoryIds: fieldDefinitionCategories.map((c) => c.categoryId),
      productTypeIds: fieldDefinitionProductTypes.map((p) => p.productTypeId),
    }));

    return NextResponse.json({ fieldDefinitions, total });
  } catch (e) {
    console.error("[GET /api/admin/field-definitions]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: {
    code?: string;
    label?: string;
    dataType?: string;
    widgetType?: string;
    systemColumn?: string;
    validation?: string;
    presetValues?: string;
    unit?: string;
    placeholder?: string;
    defaultValue?: string;
    hiddenOnCard?: boolean;
    categoryIds?: string[];
    productTypeIds?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.label?.trim() || !body.dataType?.trim()) {
    return NextResponse.json(
      { error: "label and dataType are required" },
      { status: 400 },
    );
  }

  const widgetType = body.widgetType?.trim() ?? "text_input";
  if (body.presetValues?.trim()) {
    const presetError = validatePresetValuesForWidget(body.presetValues.trim(), widgetType);
    if (presetError) {
      return NextResponse.json({ error: presetError }, { status: 400 });
    }
  }
  if (widgetType === "calculated" && body.validation?.trim()) {
    const formulaError = validateFormula(body.validation.trim());
    if (formulaError) {
      return NextResponse.json({ error: formulaError }, { status: 400 });
    }
  }

  const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds.filter((id) => id?.trim()) : [];
  const productTypeIds = Array.isArray(body.productTypeIds) ? body.productTypeIds.filter((id) => id?.trim()) : [];

  try {
    const created = await prisma.fieldDefinition.create({
      data: {
        code: body.code?.trim() || null,
        label: body.label!.trim(),
        dataType: body.dataType!.trim(),
        widgetType,
        systemColumn: body.systemColumn?.trim() ?? null,
        isSystem: false,
        validation: body.validation ?? null,
        presetValues: body.presetValues ?? null,
        unit: body.unit?.trim() ?? null,
        placeholder: body.placeholder?.trim() ?? null,
        defaultValue: body.defaultValue ?? null,
        hiddenOnCard: body.hiddenOnCard ?? false,
        fieldDefinitionCategories: categoryIds.length > 0 ? { createMany: { data: categoryIds.map((categoryId) => ({ categoryId })) } } : undefined,
        fieldDefinitionProductTypes: productTypeIds.length > 0 ? { createMany: { data: productTypeIds.map((productTypeId) => ({ productTypeId })) } } : undefined,
      },
      include: {
        fieldDefinitionCategories: { select: { categoryId: true } },
        fieldDefinitionProductTypes: { select: { productTypeId: true } },
      },
    });

    const { fieldDefinitionCategories, fieldDefinitionProductTypes, ...rest } = created;
    const result = {
      ...rest,
      categoryIds: fieldDefinitionCategories.map((c) => c.categoryId),
      productTypeIds: fieldDefinitionProductTypes.map((p) => p.productTypeId),
    };
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    console.error("[POST /api/admin/field-definitions]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

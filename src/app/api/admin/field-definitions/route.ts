import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { OWNER_ROLE } from "@/config/owner";
import { ADMIN_ROLE } from "@/config/roles";
import { prisma } from "@/lib/prisma";
import { validatePresetValuesForWidget } from "@/lib/validate-preset-values";
import { validateFormula } from "@/features/vehicles/lib/field-utils";

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
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20));

    const where = search
      ? {
          OR: [
            { label: { contains: search, mode: "insensitive" as const } },
            { code: { contains: search, mode: "insensitive" as const } },
            { dataType: { contains: search, mode: "insensitive" as const } },
            { widgetType: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : undefined;

    const [fields, total] = await Promise.all([
      prisma.fieldDefinition.findMany({
        where,
        orderBy: [{ isSystem: "desc" }, { code: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { tabFields: true } } },
      }),
      prisma.fieldDefinition.count({ where }),
    ]);

    return NextResponse.json({ fieldDefinitions: fields, total });
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
    validation?: string;
    presetValues?: string;
    unit?: string;
    placeholder?: string;
    defaultValue?: string;
    hiddenOnCard?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.code?.trim() || !body.label?.trim() || !body.dataType?.trim()) {
    return NextResponse.json(
      { error: "code, label, and dataType are required" },
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

  try {
    const existing = await prisma.fieldDefinition.findUnique({
      where: { code: body.code.trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "Code already exists" }, { status: 409 });
    }

    const created = await prisma.fieldDefinition.create({
      data: {
        code: body.code.trim(),
        label: body.label.trim(),
        dataType: body.dataType.trim(),
        widgetType,

        isSystem: false,
        validation: body.validation ?? null,
        presetValues: body.presetValues ?? null,
        unit: body.unit?.trim() ?? null,
        placeholder: body.placeholder?.trim() ?? null,
        defaultValue: body.defaultValue ?? null,
        hiddenOnCard: body.hiddenOnCard ?? false,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("[POST /api/admin/field-definitions]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

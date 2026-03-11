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

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await context.params;

  try {
    const field = await prisma.fieldDefinition.findUnique({ where: { id } });
    if (!field) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(field);
  } catch (e) {
    console.error("[GET /api/admin/field-definitions/[id]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await context.params;

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
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const existing = await prisma.fieldDefinition.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (body.presetValues != null && String(body.presetValues).trim()) {
      const widgetType = body.widgetType?.trim() ?? existing.widgetType;
      const presetError = validatePresetValuesForWidget(String(body.presetValues).trim(), widgetType);
      if (presetError) {
        return NextResponse.json({ error: presetError }, { status: 400 });
      }
    }
    const effectiveWidgetType = body.widgetType?.trim() ?? existing.widgetType;
    if (effectiveWidgetType === "calculated" && body.validation != null && String(body.validation).trim()) {
      const formulaError = validateFormula(String(body.validation).trim());
      if (formulaError) {
        return NextResponse.json({ error: formulaError }, { status: 400 });
      }
    }

    type UpdateData = Record<string, string | null | undefined>;
    const data: UpdateData = {};

    if (existing.isSystem) {
      if (body.label !== undefined) data.label = body.label.trim();
      if (body.placeholder !== undefined) data.placeholder = body.placeholder?.trim() ?? null;
      if (body.unit !== undefined) data.unit = body.unit?.trim() ?? null;
    } else {
      if (body.code !== undefined) {
        const dup = await prisma.fieldDefinition.findFirst({
          where: { code: body.code.trim(), NOT: { id } },
        });
        if (dup) {
          return NextResponse.json({ error: "Code already exists" }, { status: 409 });
        }
        data.code = body.code.trim();
      }
      if (body.label !== undefined) data.label = body.label.trim();
      if (body.dataType !== undefined) data.dataType = body.dataType.trim();
      if (body.widgetType !== undefined) data.widgetType = body.widgetType.trim();
      if (body.systemColumn !== undefined) data.systemColumn = body.systemColumn?.trim() ?? null;
      if (body.validation !== undefined) data.validation = body.validation ?? null;
      if (body.presetValues !== undefined) data.presetValues = body.presetValues ?? null;
      if (body.unit !== undefined) data.unit = body.unit?.trim() ?? null;
      if (body.placeholder !== undefined) data.placeholder = body.placeholder?.trim() ?? null;
      if (body.defaultValue !== undefined) data.defaultValue = body.defaultValue ?? null;
    }
    if (body.hiddenOnCard !== undefined) data.hiddenOnCard = body.hiddenOnCard;

    const updated = await prisma.fieldDefinition.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[PATCH /api/admin/field-definitions/[id]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await context.params;

  try {
    const field = await prisma.fieldDefinition.findUnique({ where: { id } });
    if (!field) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (field.isSystem) {
      return NextResponse.json({ error: "Cannot delete system field" }, { status: 403 });
    }

    const usageCount = await prisma.tabField.count({ where: { fieldDefinitionId: id } });
    if (usageCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: field is used in ${usageCount} tab(s)` },
        { status: 409 },
      );
    }

    await prisma.fieldDefinition.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/admin/field-definitions/[id]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

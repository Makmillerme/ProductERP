import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { OWNER_ROLE } from "@/config/owner";
import { ADMIN_ROLE } from "@/config/roles";
import { prisma } from "@/lib/prisma";

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

interface TabFieldInput {
  fieldDefinitionId: string;
  productTypeId?: string | null;
  order?: number;
  colSpan?: number;
  isRequired?: boolean;
  sectionTitle?: string | null;
}

export async function GET(request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const productTypeId = searchParams.get("productTypeId");

  try {
    const tab = await prisma.tabDefinition.findUnique({
      where: { id },
      include: {
        fields: {
          where: productTypeId
            ? { OR: [{ productTypeId: null }, { productTypeId }] }
            : undefined,
          orderBy: { order: "asc" },
          include: { fieldDefinition: true },
        },
      },
    });

    if (!tab) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(tab);
  } catch (e) {
    console.error("[GET /api/admin/tabs/[id]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await context.params;

  let body: {
    name?: string;
    icon?: string;
    tabConfig?: string;
    order?: number;
    fields?: TabFieldInput[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const existing = await prisma.tabDefinition.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const tab = await tx.tabDefinition.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: body.name.trim() }),
          ...(body.icon !== undefined && { icon: body.icon?.trim() ?? null }),
          ...(body.tabConfig !== undefined && { tabConfig: body.tabConfig ?? null }),
          ...(body.order !== undefined && { order: body.order }),
        },
      });

      if (body.fields) {
        await tx.tabField.deleteMany({ where: { tabDefinitionId: id } });

        const seen = new Map<string, TabFieldInput>();
        for (const f of body.fields) {
          const prev = seen.get(f.fieldDefinitionId);
          if (!prev || (f.productTypeId && !prev.productTypeId)) {
            seen.set(f.fieldDefinitionId, f);
          }
        }
        const deduped = Array.from(seen.values());

        if (deduped.length > 0) {
          await tx.tabField.createMany({
            data: deduped.map((f, idx) => ({
              tabDefinitionId: id,
              fieldDefinitionId: f.fieldDefinitionId,
              productTypeId: f.productTypeId ?? null,
              order: f.order ?? idx,
              colSpan: f.colSpan ?? 1,
              isRequired: f.isRequired ?? false,
              sectionTitle: f.sectionTitle ?? null,
            })),
          });
        }
      }

      return tx.tabDefinition.findUnique({
        where: { id: tab.id },
        include: {
          fields: {
            orderBy: { order: "asc" },
            include: { fieldDefinition: true },
          },
        },
      });
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("[PATCH /api/admin/tabs/[id]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await context.params;

  try {
    const tab = await prisma.tabDefinition.findUnique({ where: { id } });
    if (!tab) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (tab.isSystem) {
      return NextResponse.json(
        { error: "Cannot delete system tab" },
        { status: 400 }
      );
    }

    await prisma.tabDefinition.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/admin/tabs/[id]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

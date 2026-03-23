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

export async function GET(_request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id: categoryId } = await context.params;

  try {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const tabs = await prisma.tabDefinition.findMany({
      where: { categoryId },
      orderBy: { order: "asc" },
      include: {
        _count: { select: { fields: true } },
        fields: { select: { fieldDefinitionId: true } },
      },
    });
    return NextResponse.json(tabs);
  } catch (e) {
    console.error("[GET /api/admin/categories/[id]/tabs]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id: categoryId } = await context.params;

  let body: {
    name?: string;
    icon?: string;
    tabConfig?: string;
    order?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  try {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const created = await prisma.tabDefinition.create({
      data: {
        categoryId,
        name: body.name.trim(),
        icon: body.icon?.trim() ?? null,
        tabConfig: body.tabConfig ?? null,
        order: body.order ?? 0,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("[POST /api/admin/categories/[id]/tabs]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

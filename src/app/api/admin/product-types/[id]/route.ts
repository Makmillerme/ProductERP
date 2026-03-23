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

  const { id } = await context.params;

  try {
    const productType = await prisma.productType.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
    });

    if (!productType) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(productType);
  } catch (e) {
    console.error("[GET /api/admin/product-types/[id]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await context.params;

  let body: {
    name?: string;
    description?: string;
    categoryId?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const updated = await prisma.productType.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description?.trim() ?? null }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[PATCH /api/admin/product-types/[id]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await context.params;

  try {
    const count = await prisma.product.count({ where: { productTypeId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${count} product(s) linked to this type` },
        { status: 409 },
      );
    }

    await prisma.productType.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/admin/product-types/[id]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

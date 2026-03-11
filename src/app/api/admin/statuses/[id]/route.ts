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
    const status = await prisma.productStatus.findUnique({ where: { id } });
    if (!status) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(status);
  } catch (e) {
    console.error("[GET /api/admin/statuses/[id]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await context.params;

  let body: {
    name?: string;
    code?: string;
    color?: string;
    order?: number;
    description?: string;
    isDefault?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const existing = await prisma.productStatus.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (body.code?.trim()) {
      const dup = await prisma.productStatus.findFirst({
        where: { code: body.code.trim(), NOT: { id } },
      });
      if (dup) {
        return NextResponse.json({ error: "Code already exists" }, { status: 409 });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (body.isDefault) {
        await tx.productStatus.updateMany({
          where: { isDefault: true, NOT: { id } },
          data: { isDefault: false },
        });
      }

      return tx.productStatus.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: body.name.trim() }),
          ...(body.code !== undefined && { code: body.code!.trim() }),
          ...(body.color !== undefined && { color: body.color!.trim() }),
          ...(body.order !== undefined && { order: body.order }),
          ...(body.description !== undefined && { description: body.description?.trim() ?? null }),
          ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
        },
      });
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("[PATCH /api/admin/statuses/[id]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await context.params;

  try {
    const status = await prisma.productStatus.findUnique({ where: { id } });
    if (!status) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (status.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default status" },
        { status: 409 },
      );
    }

    await prisma.productStatus.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/admin/statuses/[id]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

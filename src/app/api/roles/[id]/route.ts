import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isOwnerRole } from "@/config/owner";
import { ADMIN_ROLE } from "@/config/roles";

export const dynamic = "force-dynamic";

async function requireAdminOrOwner(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "\u041d\u0435 \u0430\u0432\u0442\u043e\u0440\u0438\u0437\u043e\u0432\u0430\u043d\u043e" }, { status: 401 });
  }
  const role = session.user.role ?? null;
  if (!isOwnerRole(role) && role !== ADMIN_ROLE) {
    return NextResponse.json({ error: "\u0414\u043e\u0441\u0442\u0443\u043f \u043b\u0438\u0448\u0435 \u0434\u043b\u044f \u0430\u0434\u043c\u0456\u043d\u0430 \u0430\u0431\u043e \u0432\u043b\u0430\u0441\u043d\u0438\u043a\u0430" }, { status: 403 });
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdminOrOwner(request);
  if (err) return err;
  const { id } = await params;
  try {
    const role = await prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
    if (!role) {
      return NextResponse.json({ error: "Роль не знайдено" }, { status: 404 });
    }
    const permissionsMap: Record<string, Record<string, boolean>> = {};
    for (const p of role.permissions) {
      if (!permissionsMap[p.sectionId]) permissionsMap[p.sectionId] = {};
      permissionsMap[p.sectionId][p.actionId] = true;
    }
    return NextResponse.json({
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
      permissionsCount: role.permissions.length,
      permissions: permissionsMap,
    });
  } catch (e) {
    console.error("[GET /api/roles/[id]]", e);
    return NextResponse.json(
      { error: "Помилка отримання ролі" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdminOrOwner(request);
  if (err) return err;
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, description, permissions } = body;
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return NextResponse.json({ error: "Роль не знайдено" }, { status: 404 });
    }
    const updateData: { name?: string; description?: string | null } = {};
    if (typeof name === "string" && name.trim()) updateData.name = name.trim();
    if (typeof description === "string") updateData.description = description.trim() || null;
    if (Object.keys(updateData).length > 0) {
      await prisma.role.update({
        where: { id },
        data: updateData,
      });
    }
    if (permissions && typeof permissions === "object") {
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });
      const entries: { roleId: string; sectionId: string; actionId: string }[] = [];
      for (const [sectionId, actions] of Object.entries(permissions)) {
        if (actions && typeof actions === "object") {
          for (const [actionId, value] of Object.entries(actions)) {
            if (value === true) {
              entries.push({ roleId: id, sectionId, actionId });
            }
          }
        }
      }
      if (entries.length > 0) {
        await prisma.rolePermission.createMany({
          data: entries,
        });
      }
    }
    const updated = await prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
    const permissionsMap: Record<string, Record<string, boolean>> = {};
    for (const p of updated?.permissions ?? []) {
      if (!permissionsMap[p.sectionId]) permissionsMap[p.sectionId] = {};
      permissionsMap[p.sectionId][p.actionId] = true;
    }
    return NextResponse.json({
      id: updated?.id,
      name: updated?.name,
      code: updated?.code,
      description: updated?.description,
      createdAt: updated?.createdAt.toISOString(),
      updatedAt: updated?.updatedAt.toISOString(),
      permissions: permissionsMap,
    });
  } catch (e) {
    console.error("[PATCH /api/roles/[id]]", e);
    return NextResponse.json(
      { error: "Помилка оновлення ролі" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdminOrOwner(request);
  if (err) return err;
  const { id } = await params;
  try {
    await prisma.role.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/roles/[id]]", e);
    return NextResponse.json(
      { error: "Помилка видалення ролі" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isOwnerRole, OWNER_ROLE } from "@/config/owner";
import { ADMIN_ROLE } from "@/config/roles";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ userId: string }> };

/**
 * Зміна ролі користувача. Правила:
 * - Тільки власник може призначати або знімати роль admin.
 * - Роль "owner" заборонено через цей маршрут — використовуйте /api/admin/owner/transfer.
 * - Адміни можуть змінювати ролі лише не-адмінів та не-власника.
 */
export async function POST(request: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  }

  const currentRole = session.user.role ?? null;
  const currentIsOwner = isOwnerRole(currentRole);
  const isAdmin = currentRole === ADMIN_ROLE;

  if (!currentIsOwner && !isAdmin) {
    return NextResponse.json({ error: "Доступ заборонено" }, { status: 403 });
  }

  const { userId } = await params;
  let body: { role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Невірний JSON" }, { status: 400 });
  }

  const newRole = typeof body.role === "string" ? body.role.trim() : undefined;
  if (!newRole) {
    return NextResponse.json({ error: "Вкажіть роль" }, { status: 400 });
  }

  if (newRole === OWNER_ROLE) {
    return NextResponse.json(
      { error: "Роль власника не можна присвоїти цільовим. Використовуйте передачу прав власника." },
      { status: 403 }
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "Користувача не знайдено" }, { status: 404 });
  }

  const targetIsOwner = isOwnerRole(targetUser.role);
  if (targetIsOwner) {
    return NextResponse.json(
      { error: "Роль власника змінити не можна. Спочатку передайте права власника." },
      { status: 403 }
    );
  }

  const targetIsAdmin = targetUser.role === ADMIN_ROLE;
  if (newRole === ADMIN_ROLE || targetIsAdmin) {
    if (!currentIsOwner) {
      return NextResponse.json(
        { error: "Тільки власник може призначати або знімати права адміна" },
        { status: 403 }
      );
    }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole, updatedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST /api/admin/users/[userId]/set-role]", e);
    return NextResponse.json(
      { error: "\u041f\u043e\u043c\u0438\u043b\u043a\u0430 \u0437\u043c\u0456\u043d\u0438 \u0440\u043e\u043b\u0456" },
      { status: 500 }
    );
  }
}

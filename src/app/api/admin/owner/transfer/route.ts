import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isOwnerRole, OWNER_ROLE } from "@/config/owner";
import { ADMIN_ROLE } from "@/config/roles";

export const dynamic = "force-dynamic";

/**
 * Передача прав власника іншому користувачу.
 * - Дозволено лише поточному власнику (role = "owner").
 * - Після передачі: попередній власник отримує роль admin, новий — owner.
 * - Зміна виконується в транзакції через прямий UPDATE user.role (без окремої таблиці owner).
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  }

  if (!isOwnerRole(session.user.role)) {
    return NextResponse.json(
      { error: "Тільки власник може передати права власника" },
      { status: 403 }
    );
  }

  let body: { newOwnerUserId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Невірний JSON" }, { status: 400 });
  }

  const newOwnerUserId = typeof body.newOwnerUserId === "string" ? body.newOwnerUserId.trim() : undefined;
  if (!newOwnerUserId) {
    return NextResponse.json({ error: "Вкажіть newOwnerUserId" }, { status: 400 });
  }

  if (newOwnerUserId === session.user.id) {
    return NextResponse.json(
      { error: "Неможливо передати права самому собі" },
      { status: 400 }
    );
  }

  const newUser = await prisma.user.findUnique({
    where: { id: newOwnerUserId },
    select: { id: true },
  });
  if (!newUser) {
    return NextResponse.json({ error: "Користувача не знайдено" }, { status: 404 });
  }

  const now = new Date();

  await prisma.$transaction([
    // Попередній власник стає адміном
    prisma.user.update({
      where: { id: session.user.id },
      data: { role: ADMIN_ROLE, updatedAt: now },
    }),
    // Новий власник отримує роль owner
    prisma.user.update({
      where: { id: newOwnerUserId },
      data: { role: OWNER_ROLE, updatedAt: now },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

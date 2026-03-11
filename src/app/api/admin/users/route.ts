import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isOwnerRole, OWNER_ROLE } from "@/config/owner";
import { ADMIN_ROLE } from "@/config/roles";

export const dynamic = "force-dynamic";

/**
 * Список користувачів. Доступно admin та owner.
 */
export async function GET(request: NextRequest) {
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

  try {
    const result = await auth.api.listUsers({
      query: { limit: 1000 },
      headers: request.headers,
    });
    const users =
      (result as { users?: { id: string; name: string; email: string }[] })
        ?.users ?? [];
    return NextResponse.json({ users });
  } catch (e) {
    console.error("[GET /api/admin/users]", e);
    return NextResponse.json(
      { error: "Помилка завантаження користувачів" },
      { status: 500 }
    );
  }
}

/**
 * Створення користувача. Тільки власник може створити користувача з роллю admin.
 * Роль "owner" не може бути присвоєна при створенні — для цього є /api/admin/owner/transfer.
 */
export async function POST(request: NextRequest) {
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

  let body: { email?: string; password?: string; name?: string; lastName?: string; role?: string; data?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Невірний JSON" }, { status: 400 });
  }

  const role = typeof body.role === "string" ? body.role.trim() : "user";

  if (role === OWNER_ROLE) {
    return NextResponse.json(
      { error: "Роль власника не можна присвоїти при створенні" },
      { status: 403 }
    );
  }

  if (role === ADMIN_ROLE && !currentIsOwner) {
    return NextResponse.json(
      { error: "Тільки власник може створювати користувачів з роллю адміна" },
      { status: 403 }
    );
  }

  if (!body.email || !body.password || !body.name) {
    return NextResponse.json({ error: "\u041f\u043e\u0442\u0440\u0456\u0431\u043d\u0456 email, password, name" }, { status: 400 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newUser = await (auth.api.createUser as any)({
      body: {
        email: body.email,
        password: body.password,
        name: body.name,
        ...(body.lastName && { lastName: body.lastName }),
        role,
        ...(body.data && { data: body.data }),
      },
      headers: request.headers,
    });
    return NextResponse.json(newUser, { status: 201 });
  } catch (e) {
    console.error("[POST /api/admin/users]", e);
    return NextResponse.json(
      { error: "Помилка створення користувача" },
      { status: 500 }
    );
  }
}

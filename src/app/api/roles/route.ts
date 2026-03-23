import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { ADMIN_ROLE } from "@/config/roles";
import { isOwnerRole, OWNER_ROLE } from "@/config/owner";

export const dynamic = "force-dynamic";

async function requireAdminOrOwner(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  }
  const role = session.user.role ?? null;
  if (!isOwnerRole(role) && role !== ADMIN_ROLE) {
    return NextResponse.json({ error: "Доступ лише для адміна або власника" }, { status: 403 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const err = await requireAdminOrOwner(request);
  if (err) return err;
  try {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: "asc" },
      include: { permissions: true },
    });
    const list = roles.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      description: r.description,
      createdAt: r.createdAt.toISOString(),
      permissionsCount: r.permissions.length,
    }));
    return NextResponse.json({ roles: list });
  } catch (e) {
    console.error("[GET /api/roles]", e);
    return NextResponse.json({ error: "Помилка отримання ролей" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const err = await requireAdminOrOwner(request);
  if (err) return err;
  try {
    const body = await request.json();
    const { name, code, description } = body;
    if (!name || typeof name !== "string" || !code || typeof code !== "string") {
      return NextResponse.json({ error: "Потрібні name та code" }, { status: 400 });
    }
    const slug = slugify(code.trim());
    if (!slug) {
      return NextResponse.json({ error: "Невалідний код ролі" }, { status: 400 });
    }
    // Блокуємо системні коди
    if (slug === ADMIN_ROLE || slug === OWNER_ROLE) {
      return NextResponse.json(
        { error: `Код «${slug}» зарезервовано для системної ролі` },
        { status: 400 }
      );
    }
    const role = await prisma.role.create({
      data: {
        name: name.trim(),
        code: slug,
        description: typeof description === "string" ? description.trim() || null : null,
      },
    });
    return NextResponse.json({
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      createdAt: role.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("[POST /api/roles]", e);
    return NextResponse.json({ error: "Помилка створення ролі" }, { status: 500 });
  }
}

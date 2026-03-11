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

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: { select: { productTypes: true, tabs: true } },
      },
    });
    return NextResponse.json(categories);
  } catch (e) {
    console.error("[GET /api/admin/categories]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: {
    name?: string;
    code?: string;
    description?: string;
    icon?: string;
    order?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name?.trim() || !body.code?.trim()) {
    return NextResponse.json({ error: "name and code are required" }, { status: 400 });
  }

  try {
    const existing = await prisma.category.findUnique({
      where: { code: body.code.trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "Code already exists" }, { status: 409 });
    }

    const created = await prisma.category.create({
      data: {
        name: body.name.trim(),
        code: body.code.trim(),
        description: body.description?.trim() ?? null,
        icon: body.icon?.trim() ?? null,
        order: body.order ?? 0,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("[POST /api/admin/categories]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

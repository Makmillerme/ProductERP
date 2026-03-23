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
    const types = await prisma.productType.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
    });
    return NextResponse.json(types);
  } catch (e) {
    console.error("[GET /api/admin/product-types]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: {
    name?: string;
    description?: string;
    categoryId?: string;
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
    const created = await prisma.productType.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() ?? null,
        categoryId: body.categoryId ?? null,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("[POST /api/admin/product-types]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

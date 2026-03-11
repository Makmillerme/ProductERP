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

export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20));

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { code: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : undefined;

    const [statuses, total] = await Promise.all([
      prisma.productStatus.findMany({
        where,
        orderBy: { order: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.productStatus.count({ where }),
    ]);

    return NextResponse.json({ statuses, total });
  } catch (e) {
    console.error("[GET /api/admin/statuses]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

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

  if (!body.name?.trim() || !body.code?.trim()) {
    return NextResponse.json({ error: "name and code are required" }, { status: 400 });
  }

  try {
    const existing = await prisma.productStatus.findUnique({
      where: { code: body.code.trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "Code already exists" }, { status: 409 });
    }

    const created = await prisma.$transaction(async (tx) => {
      if (body.isDefault) {
        await tx.productStatus.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.productStatus.create({
        data: {
          name: body.name!.trim(),
          code: body.code!.trim(),
          color: body.color?.trim() ?? "#6b7280",
          order: body.order ?? 0,
          description: body.description?.trim() ?? null,
          isDefault: body.isDefault ?? false,
        },
      });
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("[POST /api/admin/statuses]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

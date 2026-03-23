import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { OWNER_ROLE } from "@/config/owner";
import { ADMIN_ROLE } from "@/config/roles";
import { prisma } from "@/lib/prisma";
import {
  parseDisplayConfig,
  stringifyDisplayConfig,
  type CategoryDisplayConfig,
} from "@/features/management/types/display-config";

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

/** GET ?categoryId=xxx — отримати display config для категорії (default: roleCode=null, userId=null). */
export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId")?.trim();

  if (!categoryId) {
    return NextResponse.json({ error: "categoryId required" }, { status: 400 });
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const row = await prisma.displayConfig.findFirst({
      where: {
        roleCode: null,
        userId: null,
        categoryId,
      },
      select: { config: true },
    });

    const parsed = parseDisplayConfig(row?.config ?? null);
    return NextResponse.json(parsed);
  } catch (e) {
    console.error("[GET /api/admin/display-config]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** PUT — зберегти display config для категорії. Body: { categoryId, config: CategoryDisplayConfig }. */
export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { categoryId?: string; config?: CategoryDisplayConfig };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const categoryId = body.categoryId?.trim();
  if (!categoryId) {
    return NextResponse.json({ error: "categoryId required" }, { status: 400 });
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const config = body.config ?? {};
    const configStr = stringifyDisplayConfig(config);

    const existing = await prisma.displayConfig.findFirst({
      where: {
        roleCode: null,
        userId: null,
        categoryId,
      },
    });

    if (existing) {
      await prisma.displayConfig.update({
        where: { id: existing.id },
        data: { config: configStr },
      });
    } else {
      await prisma.displayConfig.create({
        data: {
          roleCode: null,
          userId: null,
          categoryId,
          config: configStr,
        },
      });
    }

    return NextResponse.json(parseDisplayConfig(configStr));
  } catch (e) {
    console.error("[PUT /api/admin/display-config]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

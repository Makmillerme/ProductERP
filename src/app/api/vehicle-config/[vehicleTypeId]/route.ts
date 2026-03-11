import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ vehicleTypeId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vehicleTypeId } = await context.params;

  try {
    const vehicleType = await prisma.productType.findUnique({
      where: { id: vehicleTypeId },
      include: {
        category: { select: { id: true, name: true, code: true } },
      },
    });

    if (!vehicleType) {
      return NextResponse.json({ error: "Vehicle type not found" }, { status: 404 });
    }

    const categoryId = vehicleType.categoryId;

    const tabs = categoryId
      ? await prisma.tabDefinition.findMany({
          where: { categoryId },
          orderBy: { order: "asc" },
          include: {
            fields: {
              where: {
                OR: [{ productTypeId: null }, { productTypeId: vehicleTypeId }],
              },
              orderBy: { order: "asc" },
              include: { fieldDefinition: true },
            },
          },
        })
      : [];

    return NextResponse.json({
      vehicleType: {
        id: vehicleType.id,
        name: vehicleType.name,
        code: vehicleType.code,
        categoryId: vehicleType.categoryId,
      },
      category: vehicleType.category,
      tabs,
      displayConfig: null,
    });
  } catch (e) {
    console.error("[GET /api/vehicle-config/[vehicleTypeId]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

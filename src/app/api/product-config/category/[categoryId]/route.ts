import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isFieldAvailableForCategory } from "@/features/products/lib/field-utils";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ categoryId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { categoryId } = await context.params;

  try {
    const [category, productType, productTypesInCategory] = await Promise.all([
      prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true, name: true },
      }),
      prisma.productType.findFirst({
        where: { categoryId },
        orderBy: { createdAt: "asc" },
        include: {
          category: { select: { id: true, name: true } },
        },
      }),
      prisma.productType.findMany({
        where: { categoryId },
        select: { id: true, categoryId: true },
      }),
    ]);

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const fieldWhere =
      productType
        ? { OR: [{ productTypeId: null }, { productTypeId: productType.id }] }
        : { productTypeId: null };

    const tabsRaw = await prisma.tabDefinition.findMany({
      where: { categoryId },
      orderBy: { order: "asc" },
      include: {
        fields: {
          where: fieldWhere,
          orderBy: { order: "asc" },
          include: {
            fieldDefinition: {
              include: {
                fieldDefinitionCategories: { select: { categoryId: true } },
                fieldDefinitionProductTypes: { select: { productTypeId: true } },
              },
            },
          },
        },
      },
    });

    const productTypeId = productType?.id ?? null;

    const tabs = tabsRaw.map((tab) => ({
      ...tab,
      fields: tab.fields
        .map((f) => {
          const fd = f.fieldDefinition;
          const categoryIds = fd.fieldDefinitionCategories?.map((c) => c.categoryId) ?? [];
          const productTypeIds = fd.fieldDefinitionProductTypes?.map((p) => p.productTypeId) ?? [];
          const available = isFieldAvailableForCategory(
            { categoryIds, productTypeIds },
            categoryId,
            productTypeId,
            productTypesInCategory
          );
          if (!available) return null;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars -- exclude from fdRest
          const { fieldDefinitionCategories: _fc, fieldDefinitionProductTypes: _fp, ...fdRest } = fd;
          return {
            ...f,
            fieldDefinition: {
              ...fdRest,
              categoryIds,
              productTypeIds,
            },
          };
        })
        .filter(Boolean),
    }));

    const displayConfigRow = await prisma.displayConfig.findFirst({
      where: {
        roleCode: null,
        userId: null,
        categoryId,
      },
      select: { config: true },
    });

    const displayConfig = displayConfigRow?.config ?? null;

    return NextResponse.json({
      productType: productType
        ? {
            id: productType.id,
            name: productType.name,
            categoryId: productType.categoryId,
          }
        : null,
      category,
      tabs,
      displayConfig,
    });
  } catch (e) {
    console.error("[GET /api/product-config/category/[categoryId]]", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

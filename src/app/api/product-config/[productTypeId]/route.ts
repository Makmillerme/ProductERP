import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isFieldAvailableForCategory } from "@/features/products/lib/field-utils";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ productTypeId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productTypeId } = await context.params;

  try {
    const productType = await prisma.productType.findUnique({
      where: { id: productTypeId },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    if (!productType) {
      return NextResponse.json({ error: "Product type not found" }, { status: 404 });
    }

    const categoryId = productType.categoryId;

    const [tabsRaw, productTypesInCategory] =
      categoryId
        ? await Promise.all([
            prisma.tabDefinition.findMany({
              where: { categoryId },
              orderBy: { order: "asc" },
              include: {
                fields: {
                  where: {
                    OR: [{ productTypeId: null }, { productTypeId: productTypeId }],
                  },
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
            }),
            prisma.productType.findMany({
              where: { categoryId },
              select: { id: true, categoryId: true },
            }),
          ])
        : [[], []];

    const tabs =
      categoryId && Array.isArray(tabsRaw)
        ? tabsRaw.map((tab) => {
            const fields = tab.fields
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
                  fieldDefinition: { ...fdRest, categoryIds, productTypeIds },
                };
              })
              .filter(Boolean);
            return { ...tab, fields };
          })
        : tabsRaw;

    return NextResponse.json({
      productType: {
        id: productType.id,
        name: productType.name,
        categoryId: productType.categoryId,
      },
      category: productType.category,
      tabs,
      displayConfig: null,
    });
  } catch (e) {
    console.error("[GET /api/product-config/[productTypeId]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    if (!categoryId) {
      return NextResponse.json({
        productType: {
          id: productType.id,
          name: productType.name,
          categoryId: productType.categoryId,
        },
        category: productType.category,
        tabs: [],
        displayConfig: null,
      });
    }

    const [tabsRaw, productTypesInCategory] = await Promise.all([
      prisma.tabDefinition.findMany({
        where: { categoryId },
        orderBy: { order: "asc" },
        select: {
          id: true,
          categoryId: true,
          name: true,
          icon: true,
          tabConfig: true,
          order: true,
          isSystem: true,
          fields: {
            where: {
              OR: [{ productTypeId: null }, { productTypeId: productTypeId }],
            },
            orderBy: { order: "asc" },
            select: {
              id: true,
              tabDefinitionId: true,
              fieldDefinitionId: true,
              productTypeId: true,
              order: true,
              colSpan: true,
              isRequired: true,
              sectionTitle: true,
              stretchInRow: true,
            },
          },
        },
      }),
      prisma.productType.findMany({
        where: { categoryId },
        select: { id: true, categoryId: true },
      }),
    ]);

    const fieldIds = [
      ...new Set(tabsRaw.flatMap((tab) => tab.fields.map((f) => f.fieldDefinitionId))),
    ];

    const fieldDefs =
      fieldIds.length === 0
        ? []
        : await prisma.fieldDefinition.findMany({
            where: { id: { in: fieldIds } },
            select: {
              id: true,
              code: true,
              label: true,
              dataType: true,
              widgetType: true,
              isSystem: true,
              systemColumn: true,
              presetValues: true,
              validation: true,
              unit: true,
              defaultValue: true,
              placeholder: true,
              hiddenOnCard: true,
              fieldDefinitionCategories: { select: { categoryId: true } },
              fieldDefinitionProductTypes: { select: { productTypeId: true } },
            },
          });

    const fdMap = new Map(
      fieldDefs.map((fd) => {
        const categoryIds = fd.fieldDefinitionCategories.map((c) => c.categoryId);
        const productTypeIds = fd.fieldDefinitionProductTypes.map((p) => p.productTypeId);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- exclude from fdRest
        const { fieldDefinitionCategories: _fc, fieldDefinitionProductTypes: _fp, ...fdRest } = fd;
        return [fd.id, { ...fdRest, categoryIds, productTypeIds }] as const;
      })
    );

    const tabs = tabsRaw.map((tab) => {
      const fields = tab.fields
        .map((f) => {
          const fd = fdMap.get(f.fieldDefinitionId);
          if (!fd) return null;
          const available = isFieldAvailableForCategory(
            { categoryIds: fd.categoryIds, productTypeIds: fd.productTypeIds },
            categoryId,
            productTypeId,
            productTypesInCategory
          );
          if (!available) return null;
          return {
            ...f,
            fieldDefinition: fd,
          };
        })
        .filter(Boolean);
      return { ...tab, fields };
    });

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

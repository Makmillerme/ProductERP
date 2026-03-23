import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const defaultType = await prisma.productType.findFirst({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
      },
    });

    if (!defaultType) {
      return NextResponse.json(
        { error: "No default product type found" },
        { status: 404 },
      );
    }

    return NextResponse.json(defaultType);
  } catch (e) {
    console.error("[GET /api/product-config/default]", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

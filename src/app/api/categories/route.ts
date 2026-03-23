import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Публічний список категорій (для сайдбару, каталогу). */
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true, order: true },
    });
    return NextResponse.json({ categories });
  } catch (e) {
    console.error("[GET /api/categories]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

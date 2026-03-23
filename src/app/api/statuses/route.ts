import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Публічний список статусів (для фільтрів, картки авто тощо). Не залежить від захардкоджених констант. */
export async function GET() {
  try {
    const statuses = await prisma.productStatus.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true, color: true, order: true, isDefault: true },
    });
    return NextResponse.json({ statuses });
  } catch (e) {
    console.error("[GET /api/statuses]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

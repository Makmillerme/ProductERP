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

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { types?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.types) || body.types.length === 0) {
    return NextResponse.json(
      { error: "types array is required and must not be empty" },
      { status: 400 },
    );
  }

  const created: string[] = [];
  const existing: string[] = [];
  const types: { id: string; name: string }[] = [];

  for (const rawName of body.types) {
    const name = rawName?.trim();
    if (!name) continue;

    try {
      const found = await prisma.productType.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
        select: { id: true, name: true },
      });

      if (found) {
        existing.push(name);
        types.push(found);
        continue;
      }

      const newType = await prisma.productType.create({
        data: { name, isAutoDetected: true },
        select: { id: true, name: true },
      });

      created.push(name);
      types.push(newType);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[auto-detect-types] Failed for "${name}":`, msg);
    }
  }

  return NextResponse.json({ created, existing, types });
}

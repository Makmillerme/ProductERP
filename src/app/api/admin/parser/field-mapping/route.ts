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

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const fields = await prisma.fieldDefinition.findMany({
      orderBy: [{ isSystem: "desc" }, { code: "asc" }],
      select: {
        code: true,
        systemColumn: true,
        label: true,
        dataType: true,
        widgetType: true,
        isSystem: true,
      },
    });
    return NextResponse.json({ fields });
  } catch (e) {
    console.error("[GET /api/admin/parser/field-mapping]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface FieldMappingInput {
  code?: string;
  label?: string;
  dataType?: string;
  widgetType?: string;
  systemColumn?: string;
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { fields?: FieldMappingInput[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.fields) || body.fields.length === 0) {
    return NextResponse.json(
      { error: "fields array is required and must not be empty" },
      { status: 400 },
    );
  }

  const created: string[] = [];
  const existing: string[] = [];
  const errors: string[] = [];

  for (const field of body.fields) {
    try {
      const code = field.code?.trim();
      const label = field.label?.trim();
      const dataType = field.dataType?.trim() || "string";
      const widgetType = field.widgetType?.trim() || "text_input";

      if (!code || !label) {
        errors.push(`Missing code or label for field: ${JSON.stringify(field)}`);
        continue;
      }

      const exists = await prisma.fieldDefinition.findFirst({ where: { code } });

      if (exists) {
        existing.push(code);
        continue;
      }

      await prisma.fieldDefinition.create({
        data: {
          code,
          label,
          dataType,
          widgetType,
          isSystem: false,
          systemColumn: field.systemColumn?.trim() || null,
        },
      });
      created.push(code);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Field "${field.code}": ${msg}`);
    }
  }

  return NextResponse.json({ created, existing, errors }, { status: created.length > 0 ? 201 : 200 });
}

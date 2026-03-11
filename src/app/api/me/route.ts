import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isOwnerRole } from "@/config/owner";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ user: null, isOwner: false }, { status: 200 });
  }
  return NextResponse.json({
    user: session.user,
    isOwner: isOwnerRole(session.user.role),
  });
}

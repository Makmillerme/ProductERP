import { NextRequest, NextResponse } from "next/server";

const LOGIN_PATH = "/login";

function isPublic(pathname: string): boolean {
  if (pathname === LOGIN_PATH) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return true;
  return false;
}

async function getSessionData(origin: string, cookie: string): Promise<{ user?: unknown } | null> {
  try {
    const res = await fetch(`${origin}/api/auth/get-session`, { headers: { cookie } });
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !contentType.includes("application/json")) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) {
    if (pathname === LOGIN_PATH) {
      const cookie = request.headers.get("cookie") ?? "";
      const data = await getSessionData(request.nextUrl.origin, cookie);
      if (data?.user) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  const cookie = request.headers.get("cookie") ?? "";
  const data = await getSessionData(request.nextUrl.origin, cookie);

  if (!data?.user) {
    const login = new URL(LOGIN_PATH, request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

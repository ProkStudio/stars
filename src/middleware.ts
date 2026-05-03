import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  verifyAdminCookieEdge,
  adminCookieNameEdge,
} from "@/lib/admin-auth-edge";

export async function middleware(request: NextRequest) {
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") === "http"
  ) {
    const host = request.headers.get("host");
    if (host) {
      const url = request.nextUrl.clone();
      url.protocol = "https:";
      return NextResponse.redirect(url, 308);
    }
  }

  const path = request.nextUrl.pathname;
  if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
    const cookie = request.cookies.get(adminCookieNameEdge())?.value;
    if (!(await verifyAdminCookieEdge(cookie))) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("next", path + request.nextUrl.search);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

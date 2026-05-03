import type { NextRequest } from "next/server";

export function assertSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");
  if (!host) return false;
  if (origin) {
    try {
      const u = new URL(origin);
      return u.host === host;
    } catch {
      return false;
    }
  }
  if (referer) {
    try {
      const u = new URL(referer);
      return u.host === host;
    } catch {
      return false;
    }
  }
  return process.env.NODE_ENV !== "production";
}

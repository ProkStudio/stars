import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "tg_stars_admin";

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || "dev-change-admin-session";
}

export function createAdminCookieValue(): string {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = `${exp}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ exp, sig }), "utf-8").toString(
    "base64url"
  );
}

export function verifyAdminCookieValue(val: string | undefined): boolean {
  if (!val) return false;
  try {
    const json = JSON.parse(
      Buffer.from(val, "base64url").toString("utf-8")
    ) as { exp: number; sig: string };
    if (!json.exp || !json.sig) return false;
    if (Date.now() > json.exp) return false;
    const expected = createHmac("sha256", getSecret())
      .update(String(json.exp))
      .digest("hex");
    const a = Buffer.from(json.sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function isAdminRequest(): Promise<boolean> {
  const c = await cookies();
  return verifyAdminCookieValue(c.get(COOKIE)?.value);
}

export function adminCookieName() {
  return COOKIE;
}

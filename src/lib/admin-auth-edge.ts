/**
 * Проверка admin-cookie в Edge Middleware (Web Crypto), без node:crypto / Buffer.
 */
const COOKIE = "tg_stars_admin";

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || "dev-change-admin-session";
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

function base64UrlToString(b64: string): string {
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const b64st = b64.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(b64st);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  if (clean.length % 2 !== 0) return new Uint8Array();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyAdminCookieEdge(
  val: string | undefined
): Promise<boolean> {
  if (!val) return false;
  try {
    const raw = base64UrlToString(val);
    const json = JSON.parse(raw) as { exp: number; sig: string };
    if (!json.exp || !json.sig) return false;
    if (Date.now() > json.exp) return false;
    const expected = await hmacSha256Hex(getSecret(), String(json.exp));
    const a = hexToBytes(json.sig);
    const b = hexToBytes(expected);
    return timingSafeEqualBytes(a, b);
  } catch {
    return false;
  }
}

export function adminCookieNameEdge() {
  return COOKIE;
}

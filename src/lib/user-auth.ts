import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "tg_stars_user";

function secretKey() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 chars)");
  }
  return new TextEncoder().encode(s);
}

export type UserJwtPayload = {
  sub: string;
  email: string;
  role: "USER" | "ADMIN";
};

export async function createUserSession(payload: UserJwtPayload): Promise<void> {
  const token = await new SignJWT({
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearUserSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function readUserSession(): Promise<UserJwtPayload | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, secretKey(), {
      algorithms: ["HS256"],
    });
    const sub = payload.sub;
    const email = payload.email as string | undefined;
    const role = payload.role as UserJwtPayload["role"] | undefined;
    if (!sub || !email || !role) return null;
    return { sub, email, role };
  } catch {
    return null;
  }
}

export function userCookieName() {
  return COOKIE;
}

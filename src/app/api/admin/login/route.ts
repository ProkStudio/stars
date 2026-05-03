import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAdminCookieValue, adminCookieName } from "@/lib/admin-auth";
import { assertSameOrigin } from "@/lib/security";
import type { NextRequest } from "next/server";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Отказано" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { email: parsed.data.email.toLowerCase(), role: "ADMIN" },
  });
  if (!user) {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(adminCookieName(), createAdminCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

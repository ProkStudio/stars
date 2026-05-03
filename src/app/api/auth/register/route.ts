import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createUserSession } from "@/lib/user-auth";
import { assertSameOrigin } from "@/lib/security";
import type { NextRequest } from "next/server";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
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
    return NextResponse.json({ error: "Проверьте email и пароль" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (exists) {
    return NextResponse.json({ error: "Email уже зарегистрирован" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      role: "USER",
    },
  });

  await createUserSession({
    sub: user.id,
    email: user.email,
    role: "USER",
  });

  return NextResponse.json({ ok: true });
}

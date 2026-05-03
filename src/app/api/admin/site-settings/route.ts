import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";

const patchSchema = z.object({
  paymentInstructions: z.string().max(20000).optional(),
  heroTitle: z.string().max(500).optional(),
  heroSubtitle: z.string().max(2000).optional(),
  trustBlock: z.string().max(4000).optional(),
});

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const s = await prisma.siteSettings.findUnique({ where: { id: "main" } });
  return NextResponse.json({ settings: s });
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation" }, { status: 400 });
  }

  const s = await prisma.siteSettings.upsert({
    where: { id: "main" },
    create: {
      id: "main",
      ...parsed.data,
    },
    update: parsed.data,
  });

  return NextResponse.json({ settings: s });
}

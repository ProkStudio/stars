import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  sort: z.number().int().optional(),
});

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

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

  const cat = await prisma.category.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ category: cat });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

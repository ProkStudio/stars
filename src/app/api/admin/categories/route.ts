import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  sort: z.number().int().optional(),
});

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const categories = await prisma.category.findMany({
    orderBy: [{ sort: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation" }, { status: 400 });
  }

  const cat = await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      sort: parsed.data.sort ?? 0,
    },
  });

  return NextResponse.json({ category: cat });
}

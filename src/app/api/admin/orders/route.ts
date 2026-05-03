import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, type Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";

const querySchema = z.object({
  q: z.string().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad query" }, { status: 400 });
  }

  const { q, status, take, skip } = parsed.data;
  const where: Prisma.OrderWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (q && q.trim()) {
    const term = q.trim();
    const num = Number(term);
    where.OR = [
      { telegramUsername: { contains: term } },
      ...(Number.isFinite(num) ? [{ orderNumber: num }] : []),
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: take ?? 50,
      skip: skip ?? 0,
      include: {
        lines: { include: { sku: true } },
        user: { select: { email: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total });
}

import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";

const patchSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  operatorNote: z.string().max(8000).optional(),
});

function canSetStatus(
  from: OrderStatus,
  to: OrderStatus
): boolean {
  const rules: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.awaiting_payment]: [
      OrderStatus.cancelled,
      OrderStatus.paid,
    ],
    [OrderStatus.paid]: [
      OrderStatus.processing,
      OrderStatus.fulfilled,
      OrderStatus.failed,
      OrderStatus.cancelled,
    ],
    [OrderStatus.processing]: [
      OrderStatus.fulfilled,
      OrderStatus.failed,
      OrderStatus.cancelled,
    ],
    [OrderStatus.fulfilled]: [],
    [OrderStatus.failed]: [OrderStatus.fulfilled, OrderStatus.processing],
    [OrderStatus.cancelled]: [],
  };
  return rules[from]?.includes(to) ?? false;
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      lines: { include: { sku: true } },
      user: { select: { email: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

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

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (parsed.data.status && parsed.data.status !== existing.status) {
    if (!canSetStatus(existing.status, parsed.data.status)) {
      return NextResponse.json(
        { error: "Недопустимый переход статуса" },
        { status: 400 }
      );
    }
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.operatorNote !== undefined
        ? { operatorNote: parsed.data.operatorNote }
        : {}),
    },
    include: {
      lines: { include: { sku: true } },
      user: { select: { email: true } },
    },
  });

  return NextResponse.json({ order });
}

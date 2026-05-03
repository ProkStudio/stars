import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";
import { runFulfillment } from "@/lib/fulfillment";
import { notifyOrderEvent } from "@/lib/notify";

/**
 * MVP: имитация успешной оплаты — переводит в paid и запускает цепочку Fragment.
 */
export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.status !== OrderStatus.awaiting_payment) {
    return NextResponse.json(
      { error: "Заказ уже не ожидает оплату" },
      { status: 400 }
    );
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      status: OrderStatus.paid,
      paidAt: new Date(),
      paymentProvider: "manual_admin",
      paymentExternalId: null,
    },
  });

  await notifyOrderEvent("paid", order);

  void runFulfillment(order.id).catch((e) =>
    console.error("fulfillment error", e)
  );

  return NextResponse.json({ ok: true, orderId: order.id });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const orderNumber = Number(request.nextUrl.searchParams.get("orderNumber"));
  const token = request.nextUrl.searchParams.get("token");
  if (!Number.isFinite(orderNumber) || !token) {
    return NextResponse.json({ error: "Недостаточно параметров" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { orderNumber, publicToken: token },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalKopecks: true,
      telegramUsername: true,
      createdAt: true,
      paymentProvider: true,
      paymentExternalId: true,
      paidAt: true,
      fulfillmentError: true,
      lines: {
        select: {
          skuNameSnapshot: true,
          quantity: true,
          lineTotalKopecks: true,
          skuTypeSnapshot: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

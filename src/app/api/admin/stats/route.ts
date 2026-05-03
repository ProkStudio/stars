import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [total7, total30, paidSum7, paidSum30, fulfilledSum30] =
    await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: d7 } } }),
      prisma.order.count({ where: { createdAt: { gte: d30 } } }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: d7 },
          status: {
            in: [
              OrderStatus.paid,
              OrderStatus.processing,
              OrderStatus.fulfilled,
            ],
          },
        },
        _sum: { totalKopecks: true },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: d30 },
          status: {
            in: [
              OrderStatus.paid,
              OrderStatus.processing,
              OrderStatus.fulfilled,
            ],
          },
        },
        _sum: { totalKopecks: true },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: d30 },
          status: OrderStatus.fulfilled,
        },
        _sum: { totalKopecks: true },
      }),
    ]);

  const ordersLast7 = await prisma.order.findMany({
    where: { createdAt: { gte: startOfDay(d7) } },
    select: { createdAt: true },
  });
  const ordersPerDay: Record<string, number> = {};
  for (const o of ordersLast7) {
    const key = o.createdAt.toISOString().slice(0, 10);
    ordersPerDay[key] = (ordersPerDay[key] ?? 0) + 1;
  }

  return NextResponse.json({
    orders7: total7,
    orders30: total30,
    paidKopecks7: paidSum7._sum.totalKopecks ?? 0,
    paidKopecks30: paidSum30._sum.totalKopecks ?? 0,
    fulfilledKopecks30: fulfilledSum30._sum.totalKopecks ?? 0,
    ordersPerDay,
  });
}

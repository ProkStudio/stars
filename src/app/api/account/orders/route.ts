import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readUserSession } from "@/lib/user-auth";

export async function GET() {
  const s = await readUserSession();
  if (!s || s.role !== "USER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: s.sub },
    orderBy: { createdAt: "desc" },
    include: {
      lines: {
        select: {
          skuNameSnapshot: true,
          quantity: true,
          lineTotalKopecks: true,
        },
      },
    },
    take: 100,
  });

  return NextResponse.json({ orders });
}

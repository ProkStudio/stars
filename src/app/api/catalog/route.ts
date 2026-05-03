import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const skus = await prisma.sku.findMany({
    where: { active: true },
    orderBy: [{ sort: "asc" }, { name: "asc" }],
    include: {
      category: true,
      bundleItems: {
        include: {
          componentSku: {
            select: { id: true, name: true, type: true, starsAmount: true, premiumMonths: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ skus });
}

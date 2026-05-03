import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SINGLETON = "singleton";

export async function allocateOrderNumberTx(
  tx: Prisma.TransactionClient
): Promise<number> {
  const existing = await tx.orderCounter.findUnique({
    where: { id: SINGLETON },
  });
  if (!existing) {
    await tx.orderCounter.create({
      data: { id: SINGLETON, nextOrderNumber: 10001 },
    });
    return 10000;
  }
  const num = existing.nextOrderNumber;
  await tx.orderCounter.update({
    where: { id: SINGLETON },
    data: { nextOrderNumber: num + 1 },
  });
  return num;
}

export async function allocateOrderNumber(): Promise<number> {
  return prisma.$transaction((tx) => allocateOrderNumberTx(tx));
}

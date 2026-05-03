import { OrderStatus, SkuType } from "@prisma/client";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { normalizeTelegramUsername, isValidTelegramUsername } from "@/lib/telegram-username";
import type { CreateOrderInput } from "@/lib/validation/order";
import { allocateOrderNumberTx } from "@/lib/order-number";
import { notifyOrderEvent } from "@/lib/notify";

export class OrderCreateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderCreateError";
  }
}

export async function createOrderFromInput(
  input: CreateOrderInput,
  userId: string | null
): Promise<{ orderNumber: number; publicToken: string; orderId: string }> {
  const tg = normalizeTelegramUsername(input.telegramUsername);
  if (!isValidTelegramUsername(tg)) {
    throw new OrderCreateError("Некорректный Telegram username");
  }

  const sku = await prisma.sku.findUnique({
    where: { id: input.skuId },
    include: { bundleItems: true },
  });

  if (!sku || !sku.active) {
    throw new OrderCreateError("Товар недоступен");
  }

  let qty = input.quantity;
  if (sku.type === SkuType.PREMIUM || sku.type === SkuType.BUNDLE) {
    qty = 1;
  }

  const unit = sku.priceKopecks;
  const totalKopecks = unit * qty;

  const guestEmail =
    input.guestEmail && input.guestEmail.trim()
      ? input.guestEmail.trim()
      : null;

  const publicToken = randomBytes(24).toString("hex");

  const orderId = await prisma.$transaction(async (tx) => {
    const orderNumber = await allocateOrderNumberTx(tx);

    const order = await tx.order.create({
      data: {
        orderNumber,
        publicToken,
        telegramUsername: tg,
        guestEmail,
        userId,
        status: OrderStatus.awaiting_payment,
        totalKopecks,
        lines: {
          create: {
            skuId: sku.id,
            skuNameSnapshot: sku.name,
            skuTypeSnapshot: sku.type,
            quantity: qty,
            unitKopecks: unit,
            lineTotalKopecks: totalKopecks,
          },
        },
      },
    });

    return order.id;
  });

  const created = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!created) throw new OrderCreateError("Не удалось создать заказ");

  await notifyOrderEvent("created", created);

  return {
    orderNumber: created.orderNumber,
    publicToken,
    orderId: created.id,
  };
}

import { OrderStatus, SkuType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyOrderEvent } from "@/lib/notify";
import { getFragmentMode } from "@/lib/fragment/config";
import {
  IStarPartnerClient,
  getWalletType,
} from "@/lib/fragment/istar-partner";
import { fulfillOrderDirectWallet } from "@/lib/fragment/direct-wallet";
import type { Sku, BundleItem } from "@prisma/client";

const MAX_ATTEMPTS = 4;

type MetaPart = {
  kind: "star" | "premium";
  externalId: string;
  state: "pending" | "completed" | "failed";
  error?: string;
};

type OrderMeta = { parts: MetaPart[] };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetries<T>(fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const wait = 800 * 2 ** i;
      await sleep(wait);
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}

type SkuWithBundle = Sku & {
  bundleItems: (BundleItem & { componentSku: Sku })[];
};

async function dispatchSingleSku(
  client: IStarPartnerClient,
  sku: Sku,
  username: string,
  parts: MetaPart[]
): Promise<void> {
  if (sku.type === SkuType.BUNDLE) {
    throw new Error("Вложенные бандлы в dispatch не допускаются");
  }
  if (sku.type === SkuType.STARS) {
    const quantity = sku.starsAmount ?? 0;
    if (quantity < 50) {
      throw new Error("Количество Stars для API должно быть ≥ 50");
    }
    const search = await withRetries(() =>
      client.searchStarRecipient(username, quantity)
    );
    if (!search.success) {
      throw new Error(
        "Не удалось подтвердить получателя Stars (Fragment / search)."
      );
    }
    const created = await withRetries(() =>
      client.createStarOrder({
        username,
        recipient_hash: search.recipient,
        quantity,
        wallet_type: getWalletType(),
      })
    );
    parts.push({
      kind: "star",
      externalId: created.order_id,
      state: "pending",
    });
    return;
  }
  if (sku.type === SkuType.PREMIUM) {
    const months = sku.premiumMonths ?? 3;
    const search = await withRetries(() =>
      client.searchPremiumRecipient(username, months)
    );
    if (!search.success) {
      throw new Error(
        "Получатель не может принять Premium (eligibility / search)."
      );
    }
    const created = await withRetries(() =>
      client.createPremiumOrder({
        username,
        recipient_hash: search.recipient,
        months,
        wallet_type: getWalletType(),
      })
    );
    parts.push({
      kind: "premium",
      externalId: created.order_id,
      state: "pending",
    });
    return;
  }
}

async function dispatchSkuTree(
  client: IStarPartnerClient,
  sku: SkuWithBundle,
  username: string,
  lineQty: number,
  parts: MetaPart[]
): Promise<void> {
  if (sku.type === SkuType.BUNDLE) {
    for (const bi of sku.bundleItems) {
      const repeat = lineQty * bi.quantity;
      for (let i = 0; i < repeat; i++) {
        if (bi.componentSku.type === SkuType.BUNDLE) {
          throw new Error("Бандл не может содержать другой бандл");
        }
        await dispatchSingleSku(client, bi.componentSku, username, parts);
      }
    }
    return;
  }
  for (let i = 0; i < lineQty; i++) {
    await dispatchSingleSku(client, sku, username, parts);
  }
}

/**
 * Запуск после статуса paid: создаёт заказы у Fragment (partner) или direct (заглушка).
 * Partner: остаётся в processing до webhook; ids хранятся в fragmentMeta.parts.
 */
export async function runFulfillment(orderId: string): Promise<void> {
  const mode = getFragmentMode();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      lines: {
        include: {
          sku: {
            include: {
              bundleItems: { include: { componentSku: true } },
            },
          },
        },
      },
    },
  });

  if (!order || order.status !== OrderStatus.paid) return;

  if (mode === "disabled") {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        fulfillmentAttempts: { increment: 1 },
      },
    });
    return;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.processing,
      fulfillmentAttempts: { increment: 1 },
    },
  });

  if (mode === "direct_wallet") {
    try {
      await fulfillOrderDirectWallet(order);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.failed,
          fulfillmentError: msg.slice(0, 2000),
        },
      });
      await notifyOrderEvent("failed", {
        id: order.id,
        orderNumber: order.orderNumber,
        status: OrderStatus.failed,
      });
    }
    return;
  }

  try {
    const client = new IStarPartnerClient();
    const parts: MetaPart[] = [];
    for (const line of order.lines) {
      await dispatchSkuTree(
        client,
        line.sku as SkuWithBundle,
        order.telegramUsername,
        line.quantity,
        parts
      );
    }

    const primary = parts[0]?.externalId ?? null;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        fragmentExternalOrderId: primary,
        fragmentMeta: { parts } as unknown as Prisma.InputJsonValue,
        fulfillmentError: null,
      },
    });

    await notifyOrderEvent("paid", {
      id: order.id,
      orderNumber: order.orderNumber,
      status: OrderStatus.processing,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.failed,
        fulfillmentError: msg.slice(0, 2000),
      },
    });
    await notifyOrderEvent("failed", {
      id: order.id,
      orderNumber: order.orderNumber,
      status: OrderStatus.failed,
    });
  }
}

export async function applyFragmentWebhookOrderCompleted(
  fragmentOrderId: string
): Promise<void> {
  const orders = await prisma.order.findMany({
    where: {
      status: OrderStatus.processing,
    },
  });

  for (const o of orders) {
    const meta = o.fragmentMeta as OrderMeta | null;
    if (!meta?.parts?.length) continue;
    const idx = meta.parts.findIndex((p) => p.externalId === fragmentOrderId);
    if (idx === -1) continue;

    const nextParts = meta.parts.map((p, i) =>
      i === idx ? { ...p, state: "completed" as const } : p
    );
    const allDone = nextParts.every((p) => p.state === "completed");

    await prisma.order.update({
      where: { id: o.id },
      data: {
        fragmentMeta: { parts: nextParts } as unknown as Prisma.InputJsonValue,
        status: allDone ? OrderStatus.fulfilled : OrderStatus.processing,
        fulfillmentError: null,
      },
    });

    if (allDone) {
      await notifyOrderEvent("fulfilled", {
        id: o.id,
        orderNumber: o.orderNumber,
        status: OrderStatus.fulfilled,
      });
    }
    return;
  }
}

export async function applyFragmentWebhookOrderFailed(
  fragmentOrderId: string,
  reason: string
): Promise<void> {
  const orders = await prisma.order.findMany({
    where: { status: OrderStatus.processing },
  });

  for (const o of orders) {
    const meta = o.fragmentMeta as OrderMeta | null;
    if (!meta?.parts?.length) continue;
    const idx = meta.parts.findIndex((p) => p.externalId === fragmentOrderId);
    if (idx === -1) continue;

    const nextParts = meta.parts.map((p, i) =>
      i === idx ? { ...p, state: "failed" as const, error: reason } : p
    );

    await prisma.order.update({
      where: { id: o.id },
      data: {
        fragmentMeta: { parts: nextParts } as unknown as Prisma.InputJsonValue,
        status: OrderStatus.failed,
        fulfillmentError: reason.slice(0, 2000),
      },
    });

    await notifyOrderEvent("failed", {
      id: o.id,
      orderNumber: o.orderNumber,
      status: OrderStatus.failed,
    });
    return;
  }
}

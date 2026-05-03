import type { Order } from "@prisma/client";

/**
 * Точка расширения для Telegram-бота / email. В MVP — no-op + безопасный лог.
 */
export async function notifyOrderEvent(
  event: "created" | "paid" | "fulfilled" | "failed",
  order: Pick<Order, "id" | "orderNumber" | "status">
): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.info(`[notify] ${event} order=${order.id} #${order.orderNumber} status=${order.status}`);
  }
}

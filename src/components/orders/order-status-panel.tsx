"use client";

import { useEffect, useState } from "react";
import type { Order, OrderLine, OrderStatus } from "@prisma/client";
import { formatRub } from "@/lib/money";
import { orderStatusRu } from "@/lib/order-i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LinePick = Pick<
  OrderLine,
  "skuNameSnapshot" | "quantity" | "lineTotalKopecks" | "skuTypeSnapshot"
>;

type OrderPick = Pick<
  Order,
  | "orderNumber"
  | "status"
  | "totalKopecks"
  | "telegramUsername"
  | "createdAt"
  | "paymentProvider"
  | "paymentExternalId"
  | "paidAt"
  | "fulfillmentError"
> & {
  lines: LinePick[];
};

export function OrderStatusPanel({
  initialOrder,
  paymentStubText,
  publicToken,
}: {
  initialOrder: OrderPick;
  paymentStubText: string;
  publicToken: string;
}) {
  const [order, setOrder] = useState<OrderPick>(initialOrder);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const url = new URL("/api/orders/public", window.location.origin);
      url.searchParams.set("orderNumber", String(order.orderNumber));
      url.searchParams.set("token", publicToken);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!cancelled && data.order) {
        setOrder(data.order as OrderPick);
      }
    };
    const id = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [order.orderNumber, publicToken]);

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Заказ № {order.orderNumber}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Статус:{" "}
          <span className="font-medium text-foreground">
            {orderStatusRu(order.status as OrderStatus)}
          </span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Состав</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {order.lines.map((l, i) => (
            <div key={i} className="flex justify-between gap-4">
              <span>
                {l.skuNameSnapshot} × {l.quantity}
              </span>
              <span className="font-medium">{formatRub(l.lineTotalKopecks)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-3 text-base font-semibold">
            <span>Итого</span>
            <span>{formatRub(order.totalKopecks)}</span>
          </div>
          <p className="text-muted-foreground">
            Получатель в Telegram: @{order.telegramUsername}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Оплата</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{paymentStubText}</p>
          {order.status === "awaiting_payment" && (
            <p className="text-foreground">
              Заказ создан и ожидает подключения платёжного провайдера.
            </p>
          )}
          {order.paidAt && (
            <p>
              Отметка оплаты: {new Date(order.paidAt).toLocaleString("ru-RU")}
              {order.paymentProvider && ` (${order.paymentProvider})`}
            </p>
          )}
          {order.paymentExternalId && (
            <p>Внешний ID платежа: {order.paymentExternalId}</p>
          )}
        </CardContent>
      </Card>

      {order.fulfillmentError && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Ошибка выдачи</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-900">
            {order.fulfillmentError}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

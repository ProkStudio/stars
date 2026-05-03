"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { formatRub } from "@/lib/money";
import { orderStatusRu } from "@/lib/order-i18n";
import type { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OrderDetail = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  telegramUsername: string;
  totalKopecks: number;
  createdAt: string;
  paymentProvider: string | null;
  paymentExternalId: string | null;
  paidAt: string | null;
  fulfillmentError: string | null;
  operatorNote: string;
  fragmentExternalOrderId: string | null;
  fragmentMeta: unknown;
  lines: Array<{
    skuNameSnapshot: string;
    quantity: number;
    lineTotalKopecks: number;
  }>;
};

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");

  async function reload() {
    const res = await fetch(`/api/admin/orders/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setOrder(data.order);
    setNote(data.order.operatorNote ?? "");
    setStatus(data.order.status);
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveNote() {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operatorNote: note }),
    });
    if (!res.ok) toast.error("Не удалось сохранить");
    else toast.success("Заметка сохранена");
  }

  async function saveStatus() {
    if (!status) return;
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) toast.error("Недопустимый переход");
    else {
      toast.success("Статус обновлён");
      void reload();
    }
  }

  async function markPaid() {
    const res = await fetch(`/api/admin/orders/${id}/mark-paid`, {
      method: "POST",
    });
    if (!res.ok) toast.error("Не удалось отметить оплату");
    else {
      toast.success("Оплата отмечена, запущена выдача");
      void reload();
    }
  }

  if (!order) {
    return <p className="text-muted-foreground">Загрузка…</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Заказ № {order.orderNumber}
          </h1>
          <p className="text-muted-foreground">{orderStatusRu(order.status)}</p>
        </div>
        <Link href="/admin/zakazy" className="text-sm text-primary underline">
          ← К списку
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Состав</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {order.lines.map((l, i) => (
            <div key={i} className="flex justify-between gap-4">
              <span>
                {l.skuNameSnapshot} × {l.quantity}
              </span>
              <span>{formatRub(l.lineTotalKopecks)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Итого</span>
            <span>{formatRub(order.totalKopecks)}</span>
          </div>
          <p className="text-muted-foreground">
            Получатель: @{order.telegramUsername}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Оплата и Fragment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Провайдер: {order.paymentProvider ?? "—"}</p>
          <p>Внешний ID: {order.paymentExternalId ?? "—"}</p>
          <p>
            Оплачен:{" "}
            {order.paidAt
              ? new Date(order.paidAt).toLocaleString("ru-RU")
              : "—"}
          </p>
          <p>Fragment order id: {order.fragmentExternalOrderId ?? "—"}</p>
          <pre className="max-h-48 overflow-auto rounded bg-muted p-3 text-xs">
            {JSON.stringify(order.fragmentMeta ?? {}, null, 2)}
          </pre>
          {order.fulfillmentError && (
            <p className="text-red-700">{order.fulfillmentError}</p>
          )}
        </CardContent>
      </Card>

      {order.status === "awaiting_payment" && (
        <Button type="button" onClick={() => void markPaid()}>
          Отметить оплату (тест / ручной MVP)
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Статус и заметка оператора</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Статус</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
            >
              <option value="awaiting_payment">Ожидает оплаты</option>
              <option value="paid">Оплачен</option>
              <option value="processing">В обработке</option>
              <option value="fulfilled">Выдан</option>
              <option value="failed">Ошибка</option>
              <option value="cancelled">Отменён</option>
            </select>
            <Button type="button" variant="secondary" onClick={() => void saveStatus()}>
              Сохранить статус
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Заметка</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button type="button" variant="outline" onClick={() => void saveNote()}>
              Сохранить заметку
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

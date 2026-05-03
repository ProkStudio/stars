"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRub } from "@/lib/money";
import { orderStatusRu } from "@/lib/order-i18n";
import type { OrderStatus } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Row = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  telegramUsername: string;
  totalKopecks: number;
  createdAt: string;
};

export default function AdminOrdersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);

  async function load() {
    const url = new URL("/api/admin/orders", window.location.origin);
    if (q.trim()) url.searchParams.set("q", q.trim());
    if (status) url.searchParams.set("status", status);
    const res = await fetch(url.toString());
    if (!res.ok) return;
    const data = await res.json();
    setRows(data.orders);
    setTotal(data.total);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Заказы</h1>
        <Link href="/admin" className="text-sm text-primary underline">
          ← Дашборд
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Поиск: username или номер"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Все статусы</option>
          <option value="awaiting_payment">Ожидает оплаты</option>
          <option value="paid">Оплачен</option>
          <option value="processing">В обработке</option>
          <option value="fulfilled">Выдан</option>
          <option value="failed">Ошибка</option>
          <option value="cancelled">Отменён</option>
        </select>
        <Button type="button" variant="secondary" onClick={() => void load()}>
          Применить
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">Всего: {total}</p>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="p-3">№</th>
              <th className="p-3">Статус</th>
              <th className="p-3">@username</th>
              <th className="p-3">Сумма</th>
              <th className="p-3">Дата</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-medium">{r.orderNumber}</td>
                <td className="p-3">{orderStatusRu(r.status)}</td>
                <td className="p-3">@{r.telegramUsername}</td>
                <td className="p-3">{formatRub(r.totalKopecks)}</td>
                <td className="p-3">
                  {new Date(r.createdAt).toLocaleString("ru-RU")}
                </td>
                <td className="p-3">
                  <Link
                    className="text-primary underline"
                    href={`/admin/zakazy/${r.id}`}
                  >
                    Открыть
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

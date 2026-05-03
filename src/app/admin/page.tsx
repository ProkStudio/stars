"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRub } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Stats = {
  orders7: number;
  orders30: number;
  paidKopecks7: number;
  paidKopecks30: number;
  fulfilledKopecks30: number;
  ordersPerDay: Record<string, number>;
};

export default function AdminHomePage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/stats");
      if (res.ok) setStats(await res.json());
    })();
  }, []);

  const chartData =
    stats &&
    Object.entries(stats.ordersPerDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, count]) => ({ day, count }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Дашборд</h1>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link className="text-primary underline" href="/admin/zakazy">
            Заказы
          </Link>
          <Link className="text-primary underline" href="/admin/katalog">
            Каталог
          </Link>
          <Link className="text-primary underline" href="/admin/nastroyki">
            Настройки сайта
          </Link>
          <button
            type="button"
            className="text-muted-foreground underline"
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" });
              window.location.href = "/admin/login";
            }}
          >
            Выход
          </button>
        </div>
      </div>

      {!stats ? (
        <p className="text-muted-foreground">Загрузка…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Заказы (7 дней)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {stats.orders7}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Заказы (30 дней)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {stats.orders30}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Сумма оплаченных (7 дней)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatRub(stats.paidKopecks7)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Выдано (30 дней)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatRub(stats.fulfilledKopecks30)}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Заказы по дням (7 дней)</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData ?? []}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} width={32} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

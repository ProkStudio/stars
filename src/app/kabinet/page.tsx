import Link from "next/link";
import { redirect } from "next/navigation";
import { readUserSession } from "@/lib/user-auth";
import { prisma } from "@/lib/prisma";
import { formatRub } from "@/lib/money";
import { orderStatusRu } from "@/lib/order-i18n";
import { OrderStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/account/logout-button";

export const dynamic = "force-dynamic";

export default async function KabinetPage() {
  const s = await readUserSession();
  if (!s || s.role !== "USER") {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    where: { userId: s.sub },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      lines: {
        select: { skuNameSnapshot: true, lineTotalKopecks: true },
      },
    },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Личный кабинет</h1>
          <p className="text-muted-foreground">{s.email}</p>
        </div>
        <LogoutButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>История заказов</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {orders.length === 0 && (
            <p className="text-sm text-muted-foreground">Пока нет заказов.</p>
          )}
          {orders.map((o) => (
            <div
              key={o.id}
              className="flex flex-col gap-2 border-b pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">№ {o.orderNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {orderStatusRu(o.status as OrderStatus)} ·{" "}
                  {new Date(o.createdAt).toLocaleString("ru-RU")}
                </p>
                <p className="text-sm">
                  {o.lines.map((l) => l.skuNameSnapshot).join(", ")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatRub(o.totalKopecks)}</p>
                <Link
                  href={`/zakaz/${o.orderNumber}/${o.publicToken}`}
                  className="text-sm text-primary underline"
                >
                  Статус заказа
                </Link>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

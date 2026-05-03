import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "main" },
  });

  return (
    <div className="space-y-10 animate-fade-in">
      <section className="space-y-4">
        <p className="text-sm font-medium text-primary">Цифровые товары Telegram</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {settings?.heroTitle ?? "Telegram Stars и Premium"}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {settings?.heroSubtitle ??
            "Оформление заказа без регистрации. Укажите @username получателя — выдача через Fragment после оплаты."}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/katalog">Перейти в каталог</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/usloviya">Условия использования</Link>
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Доверие и прозрачность</CardTitle>
          <CardDescription>
            Без недостоверных обещаний о мгновенной оплате картой до подключения эквайринга.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {settings?.trustBlock ??
            "Мы не храним данные банковских карт. Статус заказа доступен по ссылке после оформления."}
        </CardContent>
      </Card>
    </div>
  );
}

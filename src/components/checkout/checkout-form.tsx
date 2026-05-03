"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { SkuType } from "@prisma/client";
import { createOrderSchema } from "@/lib/validation/order";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

const schema = createOrderSchema;
type FormValues = z.infer<typeof schema>;

export function CheckoutForm({
  skuId,
  skuType,
}: {
  skuId: string;
  skuType: SkuType;
}) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      skuId,
      quantity: 1,
      telegramUsername: "",
      acceptTerms: false,
      guestEmail: "",
    },
  });

  async function onSubmit(values: FormValues) {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        skuId,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Ошибка оформления");
      return;
    }
    toast.success("Заказ создан");
    router.push(data.redirectUrl as string);
  }

  const qtyDisabled = skuType !== SkuType.STARS;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Оформление</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <input type="hidden" {...form.register("skuId")} />
          <div className="space-y-2">
            <Label htmlFor="telegramUsername">Telegram получателя</Label>
            <Input
              id="telegramUsername"
              placeholder="username без @"
              autoComplete="off"
              {...form.register("telegramUsername")}
            />
            {form.formState.errors.telegramUsername && (
              <p className="text-sm text-red-600">
                {form.formState.errors.telegramUsername.message}
              </p>
            )}
          </div>

          {!qtyDisabled && (
            <div className="space-y-2">
              <Label htmlFor="quantity">Количество пакетов</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                disabled={qtyDisabled}
                {...form.register("quantity", { valueAsNumber: true })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="guestEmail">Email (необязательно)</Label>
            <Input
              id="guestEmail"
              type="email"
              placeholder="для чека или связи"
              {...form.register("guestEmail")}
            />
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" {...form.register("acceptTerms")} />
            <span>Согласен с условиями использования и политикой конфиденциальности.</span>
          </label>
          {form.formState.errors.acceptTerms && (
            <p className="text-sm text-red-600">Нужно согласие</p>
          )}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Отправка…" : "Создать заказ"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SkuType } from "@prisma/client";
import { formatRub } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type SkuRow = {
  id: string;
  slug: string;
  name: string;
  type: SkuType;
  priceKopecks: number;
  active: boolean;
  starsAmount: number | null;
  premiumMonths: number | null;
};

export default function AdminCatalogPage() {
  const [skus, setSkus] = useState<SkuRow[]>([]);
  const [selected, setSelected] = useState<SkuRow | null>(null);

  async function load() {
    const res = await fetch("/api/admin/skus");
    if (!res.ok) return;
    const data = await res.json();
    setSkus(data.skus);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Каталог SKU</h1>
        <Link href="/admin" className="text-sm text-primary underline">
          ← Дашборд
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="p-3">Название</th>
              <th className="p-3">Тип</th>
              <th className="p-3">Цена</th>
              <th className="p-3">Активен</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {skus.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3 font-medium">{s.name}</td>
                <td className="p-3">{s.type}</td>
                <td className="p-3">{formatRub(s.priceKopecks)}</td>
                <td className="p-3">{s.active ? "да" : "нет"}</td>
                <td className="p-3">
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() => setSelected(s)}
                  >
                    Редактировать
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <SkuEditor sku={selected} onClose={() => setSelected(null)} onSaved={() => void load()} />
      )}
    </div>
  );
}

function SkuEditor({
  sku,
  onClose,
  onSaved,
}: {
  sku: SkuRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(sku.name);
  const [priceRub, setPriceRub] = useState(String(sku.priceKopecks / 100));
  const [active, setActive] = useState(sku.active);

  async function save() {
    const rub = Number(priceRub.replace(",", "."));
    if (!Number.isFinite(rub)) {
      toast.error("Некорректная цена");
      return;
    }
    const priceKopecks = Math.round(rub * 100);
    const res = await fetch(`/api/admin/skus/${sku.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, priceKopecks, active }),
    });
    if (!res.ok) toast.error("Не удалось сохранить");
    else {
      toast.success("Сохранено");
      onSaved();
      onClose();
    }
  }

  return (
    <Card className="fixed inset-0 z-50 m-auto h-fit max-h-[90vh] max-w-lg overflow-auto border-2 bg-background p-0 shadow-xl">
      <CardHeader>
        <CardTitle>Редактирование</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Название</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Цена (₽)</Label>
          <Input value={priceRub} onChange={(e) => setPriceRub(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Активен
        </label>
        <div className="flex gap-2">
          <Button type="button" onClick={() => void save()}>
            Сохранить
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Тип SKU и состав бандла меняются через API или расширение формы; MVP —
          цена, активность, название.
        </p>
      </CardContent>
    </Card>
  );
}

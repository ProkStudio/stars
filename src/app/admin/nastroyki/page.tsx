"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function AdminSiteSettingsPage() {
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [trustBlock, setTrustBlock] = useState("");

  async function load() {
    const res = await fetch("/api/admin/site-settings");
    if (!res.ok) return;
    const data = await res.json();
    const s = data.settings;
    if (s) {
      setPaymentInstructions(s.paymentInstructions ?? "");
      setHeroTitle(s.heroTitle ?? "");
      setHeroSubtitle(s.heroSubtitle ?? "");
      setTrustBlock(s.trustBlock ?? "");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    const res = await fetch("/api/admin/site-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentInstructions,
        heroTitle,
        heroSubtitle,
        trustBlock,
      }),
    });
    if (!res.ok) toast.error("Ошибка сохранения");
    else toast.success("Сохранено");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Настройки сайта</h1>
        <Link href="/admin" className="text-sm text-primary underline">
          ← Дашборд
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Тексты</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="heroTitle">Заголовок главной</Label>
            <Input
              id="heroTitle"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heroSubtitle">Подзаголовок главной</Label>
            <Input
              id="heroSubtitle"
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trustBlock">Блок доверия</Label>
            <textarea
              id="trustBlock"
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={trustBlock}
              onChange={(e) => setTrustBlock(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentInstructions">Текст про оплату (заглушка)</Label>
            <textarea
              id="paymentInstructions"
              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
            />
          </div>
          <Button type="button" onClick={() => void save()}>
            Сохранить
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

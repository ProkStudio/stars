"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error ?? "Ошибка регистрации");
      return;
    }
    toast.success("Аккаунт создан");
    router.push("/kabinet");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Регистрация</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль (мин. 8 символов)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Создание…" : "Создать аккаунт"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link href="/login" className="text-primary underline">
                Вход
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

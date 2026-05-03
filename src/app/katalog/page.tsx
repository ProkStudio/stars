import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatRub } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkuType } from "@prisma/client";

export const dynamic = "force-dynamic";

function typeLabel(t: SkuType) {
  switch (t) {
    case SkuType.STARS:
      return "Stars";
    case SkuType.PREMIUM:
      return "Premium";
    default:
      return "Набор";
  }
}

export default async function CatalogPage() {
  const skus = await prisma.sku.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: [{ category: { sort: "asc" } }, { sort: "asc" }],
  });

  const grouped = new Map<string, typeof skus>();
  for (const s of skus) {
    const key = s.category?.name ?? "Без категории";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Каталог</h1>
        <p className="mt-2 text-muted-foreground">
          Все цены в рублях; в базе хранятся копейки.
        </p>
      </div>

      {[...grouped.entries()].map(([catName, items]) => (
        <section key={catName} className="space-y-4">
          <h2 className="text-lg font-medium">{catName}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((s) => (
              <Link key={s.id} href={`/tovar/${s.slug}`}>
                <Card className="h-full transition hover:shadow-card-hover">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{s.name}</CardTitle>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                        {typeLabel(s.type)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="line-clamp-3">{s.description || "—"}</p>
                    <p className="mt-3 text-lg font-semibold text-foreground">
                      {formatRub(s.priceKopecks)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

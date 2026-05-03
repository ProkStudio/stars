import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatRub } from "@/lib/money";
import { SkuType } from "@prisma/client";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const sku = await prisma.sku.findUnique({
    where: { slug },
    include: {
      category: true,
      bundleItems: {
        include: {
          componentSku: {
            select: {
              name: true,
              type: true,
              starsAmount: true,
              premiumMonths: true,
            },
          },
        },
      },
    },
  });

  if (!sku || !sku.active) notFound();

  const meta =
    sku.type === SkuType.STARS
      ? `${sku.starsAmount ?? "—"} звёзд`
      : sku.type === SkuType.PREMIUM
        ? `${sku.premiumMonths ?? "—"} мес.`
        : "Набор позиций";

  return (
    <div className="mx-auto max-w-xl space-y-8 animate-fade-in">
      <div>
        <p className="text-sm text-muted-foreground">
          {sku.category?.name ?? "Каталог"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{sku.name}</h1>
        <p className="mt-3 text-muted-foreground">{sku.description}</p>
        <p className="mt-4 text-2xl font-semibold">{formatRub(sku.priceKopecks)}</p>
        <p className="mt-1 text-sm text-muted-foreground">{meta}</p>
      </div>

      {sku.type === SkuType.BUNDLE && sku.bundleItems.length > 0 && (
        <div className="rounded-lg border bg-card p-4 text-sm">
          <p className="font-medium">Состав набора</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            {sku.bundleItems.map((b) => (
              <li key={b.id}>
                {b.componentSku.name} × {b.quantity}
              </li>
            ))}
          </ul>
        </div>
      )}

      <CheckoutForm skuId={sku.id} skuType={sku.type} />
    </div>
  );
}

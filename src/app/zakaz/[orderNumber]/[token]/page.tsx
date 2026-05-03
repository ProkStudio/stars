import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { OrderStatusPanel } from "@/components/orders/order-status-panel";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string; token: string }>;
}) {
  const { orderNumber, token } = await params;
  const num = Number(orderNumber);
  if (!Number.isFinite(num)) notFound();

  const [order, settings] = await Promise.all([
    prisma.order.findFirst({
      where: { orderNumber: num, publicToken: token },
      include: {
        lines: {
          select: {
            skuNameSnapshot: true,
            quantity: true,
            lineTotalKopecks: true,
            skuTypeSnapshot: true,
          },
        },
      },
    }),
    prisma.siteSettings.findUnique({ where: { id: "main" } }),
  ]);

  if (!order) notFound();

  const paymentText =
    process.env.PAYMENT_STUB_TEXT || settings?.paymentInstructions || "";

  return (
    <OrderStatusPanel
      initialOrder={order}
      paymentStubText={paymentText}
      publicToken={token}
    />
  );
}

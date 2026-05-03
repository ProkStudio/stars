import { NextRequest, NextResponse } from "next/server";
import { createOrderSchema } from "@/lib/validation/order";
import { createOrderFromInput, OrderCreateError } from "@/lib/orders/create-order";
import { rateLimit } from "@/lib/rate-limit";
import { readUserSession } from "@/lib/user-auth";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rl = rateLimit(`order:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const session = await readUserSession();
  const userId =
    session && session.role === "USER" ? session.sub : null;

  try {
    const result = await createOrderFromInput(parsed.data, userId);
    return NextResponse.json({
      ok: true,
      orderNumber: result.orderNumber,
      publicToken: result.publicToken,
      redirectUrl: `/zakaz/${result.orderNumber}/${result.publicToken}`,
    });
  } catch (e) {
    if (e instanceof OrderCreateError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json(
      { error: "Не удалось создать заказ. Попробуйте позже." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { verifyIStarWebhookSignature } from "@/lib/fragment/istar-webhook";
import {
  applyFragmentWebhookOrderCompleted,
  applyFragmentWebhookOrderFailed,
} from "@/lib/fulfillment";

/**
 * Приём webhook iStar (order.completed / order.failed).
 * Подпись: X-iStar-Signature = HMAC-SHA256(rawBody), секрет FRAGMENT_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.FRAGMENT_WEBHOOK_SECRET || "";
  const sig =
    request.headers.get("x-istar-signature") ||
    request.headers.get("X-iStar-Signature");

  if (secret && !verifyIStarWebhookSignature(raw, sig, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let body: {
    event_type?: string;
    order?: { id?: string; status?: string };
    error?: string;
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const externalId = body.order?.id;
  if (!externalId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const ev = body.event_type || "";
  if (ev === "order.completed") {
    await applyFragmentWebhookOrderCompleted(externalId);
  } else if (ev === "order.failed") {
    await applyFragmentWebhookOrderFailed(
      externalId,
      body.error || "order.failed"
    );
  }

  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";

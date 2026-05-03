import { createHmac, timingSafeEqual } from "crypto";

/**
 * Проверка подписи webhook iStar: HMAC-SHA256 от сырого тела с секретом из Dashboard.
 * Заголовок: X-iStar-Signature (см. https://istar.fragmentapi.com/docs )
 */
export function verifyIStarWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;
  const expectedHex = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  try {
    const a = Buffer.from(signatureHeader.trim(), "utf8");
    const b = Buffer.from(expectedHex, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

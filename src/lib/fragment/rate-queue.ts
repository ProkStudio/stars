/**
 * iStar: до 1 запроса/с на ключ — выдерживаем паузу между вызовами.
 */
let lastCallAt = 0;

export async function fragmentThrottle(minGapMs = 1100): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, lastCallAt + minGapMs - now);
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }
  lastCallAt = Date.now();
}

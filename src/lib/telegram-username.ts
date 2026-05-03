const TG_USER_RE = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/;

export function normalizeTelegramUsername(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("@")) s = s.slice(1);
  return s.toLowerCase();
}

export function isValidTelegramUsername(normalized: string): boolean {
  return TG_USER_RE.test(normalized);
}

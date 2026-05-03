/** Форматирование суммы из копеек в ₽ для UI */
export function formatRub(kopecks: number): string {
  const rub = kopecks / 100;
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: rub % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rub);
}

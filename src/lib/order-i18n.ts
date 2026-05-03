import { OrderStatus } from "@prisma/client";

export function orderStatusRu(s: OrderStatus): string {
  switch (s) {
    case OrderStatus.awaiting_payment:
      return "Ожидает оплаты";
    case OrderStatus.paid:
      return "Оплачен";
    case OrderStatus.processing:
      return "В обработке (Fragment)";
    case OrderStatus.fulfilled:
      return "Выдан";
    case OrderStatus.failed:
      return "Ошибка выдачи";
    case OrderStatus.cancelled:
      return "Отменён";
    default:
      return s;
  }
}

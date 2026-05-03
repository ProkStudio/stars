import type { Order } from "@prisma/client";

/**
 * Прямая интеграция с fragment.com (кошелёк, сессия) — вынесена в отдельный модуль.
 * Не логируйте seed/cookies. Заполните реализацию по вашей связке TonAPI + Fragment session.
 */
export class FragmentDirectNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FragmentDirectNotConfiguredError";
  }
}

export async function fulfillOrderDirectWallet(_order: Order): Promise<never> {
  throw new FragmentDirectNotConfiguredError(
    "Режим direct_wallet: реализуйте lib/fragment/direct-wallet.ts по документации аккаунта (seed/cookies/TonAPI только на сервере). См. README."
  );
}

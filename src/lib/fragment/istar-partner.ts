/**
 * Клиент партнёрского REST API iStar (Fragment): см.
 * https://istar.fragmentapi.com/docs — базовый URL и заголовок API-Key.
 */

import { defaultPartnerBaseUrl } from "@/lib/fragment/config";
import { fragmentThrottle } from "@/lib/fragment/rate-queue";

export class FragmentPartnerConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FragmentPartnerConfigError";
  }
}

export type StarRecipientSearch = {
  success: boolean;
  myself?: boolean;
  recipient: string;
  name?: string;
  photo?: string;
};

export type PremiumRecipientSearch = StarRecipientSearch;

export type CreatedOrderResponse = {
  order_id: string;
  status: string;
  username?: string;
  quantity?: number;
  months?: number;
  amount?: number;
  created_at?: string;
};

export class IStarPartnerClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(opts?: { baseUrl?: string; apiKey?: string }) {
    this.baseUrl = (opts?.baseUrl ?? defaultPartnerBaseUrl()).replace(/\/$/, "");
    this.apiKey = opts?.apiKey ?? process.env.FRAGMENT_API_KEY ?? "";
    if (!this.apiKey) {
      throw new FragmentPartnerConfigError(
        "FRAGMENT_API_KEY не задан: укажите ключ из кабинета iStar (Dashboard)."
      );
    }
  }

  private async request<T>(
    path: string,
    init: RequestInit & { skipThrottle?: boolean }
  ): Promise<T> {
    const { skipThrottle, ...rest } = init;
    if (!skipThrottle) await fragmentThrottle();
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, {
      ...rest,
      headers: {
        "API-Key": this.apiKey,
        ...(rest.headers as Record<string, string>),
      },
      cache: "no-store",
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }
    if (!res.ok) {
      throw new Error(
        `iStar HTTP ${res.status} ${path}: ${text.slice(0, 500)}`
      );
    }
    return json as T;
  }

  async searchStarRecipient(
    username: string,
    quantity: number
  ): Promise<StarRecipientSearch> {
    const q = new URLSearchParams({
      username,
      quantity: String(quantity),
    });
    return this.request<StarRecipientSearch>(
      `/star/recipient/search?${q.toString()}`,
      { method: "GET" }
    );
  }

  async createStarOrder(body: {
    username: string;
    recipient_hash: string;
    quantity: number;
    wallet_type: string;
    /** опционально — если ваш аккаунт поддерживает внешний id */
    idempotency_key?: string;
  }): Promise<CreatedOrderResponse> {
    return this.request<CreatedOrderResponse>(`/orders/star`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async searchPremiumRecipient(
    username: string,
    months: number
  ): Promise<PremiumRecipientSearch> {
    const q = new URLSearchParams({ username, months: String(months) });
    return this.request<PremiumRecipientSearch>(
      `/premium/recipient/search?${q.toString()}`,
      { method: "GET" }
    );
  }

  async createPremiumOrder(body: {
    username: string;
    recipient_hash: string;
    months: number;
    wallet_type: string;
    idempotency_key?: string;
  }): Promise<CreatedOrderResponse> {
    return this.request<CreatedOrderResponse>(`/orders/premium`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
}

export function getWalletType(): string {
  return process.env.FRAGMENT_WALLET_TYPE || "TON";
}

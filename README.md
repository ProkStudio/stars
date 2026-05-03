# Интернет-магазин: Telegram Stars, Premium, бандлы (MVP)

Production-ready каркас на **Next.js 15 (App Router)**, **TypeScript**, **Tailwind**, **Prisma**, **Zod**, **react-hook-form**. UI на русском, суммы в интерфейсе в **₽**, в БД — **копейки (integer)**.

Ориентир по структуре взят из проекта `soit2` (App Router, Prisma, админские паттерны); бизнес-логика адаптирована под Stars / Premium / бандлы.

## Дерево (основное)

```
prisma/
  schema.prisma
  seed.ts
  migrations/
src/
  app/
    api/                    # публичные и админские REST-маршруты
    admin/                  # дашборд, заказы, каталог, настройки, логин
    katalog/ tovar/ zakaz/  # витрина и заказ
    login/ register/ kabinet/
    usloviya/ privacy/ kontakty/
  components/
  lib/
    fragment/               # partner_api + заглушка direct_wallet
    orders/ fulfillment.ts  notify.ts
  middleware.ts
```

## Требования

- Node.js 20+
- npm или pnpm

## База данных

- **Локально по умолчанию:** SQLite (`DATABASE_URL="file:./dev.db"` — путь относительно каталога `prisma/`).
- **Production:** PostgreSQL. В `schema.prisma` замените:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Затем `npx prisma migrate deploy` на сервере.

## Установка и запуск

```bash
cp .env.example .env
# Отредактируйте секреты (AUTH_SECRET, ADMIN_SESSION_SECRET и т.д.)

npm install
npx prisma migrate dev
npm run db:seed

npm run dev
```

Сборка:

```bash
npm run build
npm start
```

## Переменные окружения

| Переменная | Назначение |
|------------|------------|
| `DATABASE_URL` | Строка подключения Prisma |
| `AUTH_SECRET` | Подпись JWT сессии пользователя (≥ 16 символов) |
| `ADMIN_SESSION_SECRET` | Секрет HMAC cookie админ-сессии |
| `ADMIN_EMAIL` | Email администратора для сида (по умолчанию в seed) |
| `ADMIN_PASSWORD_PLAIN` | Пароль админа **только для локального сида** (не в проде) |
| `FRAGMENT_MODE` | `disabled` \| `partner_api` \| `direct_wallet` |
| `FRAGMENT_API_BASE_URL` | Базовый URL партнёрского API (по умолчанию iStar: `https://v1.fragmentapi.com/api/v1/partner`) |
| `FRAGMENT_API_KEY` | Заголовок `API-Key` для партнёрского API |
| `FRAGMENT_WEBHOOK_SECRET` | Секрет проверки HMAC webhook (`X-iStar-Signature`, тело запроса — сырое) |
| `FRAGMENT_WALLET_TYPE` | Например `TON` для полей `wallet_type` в заказах |
| `PAYMENT_STUB_TEXT` | Опционально переопределяет текст заглушки оплаты поверх `SiteSettings` |

Режим **direct_wallet**: переменные вроде `TON_WALLET_SEED`, сессии Fragment, `TONAPI_KEY` не коммитьте; реализация — в `src/lib/fragment/direct-wallet.ts` (сейчас явный `throw` с README).

## Администратор

После `npm run db:seed`:

- Вход: `/admin/login`
- Учётная запись: email из `ADMIN_EMAIL` (по умолчанию `admin@example.com`), пароль из `ADMIN_PASSWORD_PLAIN` или **`change-me`** из `.env.example`.

В production задайте надёжный пароль через повторный seed или отдельный скрипт смены пароля (bcrypt).

## Fragment (iStar Partner API)

Документация партнёрского REST: [iStar Developer API](https://istar.fragmentapi.com/docs).

Реализовано в `src/lib/fragment/istar-partner.ts`:

- `GET /star/recipient/search`, `POST /orders/star`
- `GET /premium/recipient/search`, `POST /orders/premium`
- Заголовок: `API-Key`
- Ограничение **~1 req/s** на ключ — клиент выдерживает паузу между вызовами.

Webhook: `POST /api/webhooks/fragment` — проверка `FRAGMENT_WEBHOOK_SECRET`, события `order.completed` / `order.failed`, маппинг на внутренний заказ по `order.id` из payload и списку `fragmentMeta.parts`.

Режим **`FRAGMENT_MODE=disabled`**: оплата вручную через админку, автоматическая очередь Fragment не вызывается (заказ может остаться в `paid`).

## Заказы и статусы

`awaiting_payment` → (webhook платежки / ручная кнопка «Отметить оплату») → `paid` → `processing` → (`fulfilled` | `failed`) / отмена до оплаты → `cancelled`.

Поля под будущую платёжку: `paymentProvider`, `paymentExternalId`, `paidAt`.

## Ограничение частоты

Публичное создание заказа: in-memory rate limit по IP (`src/lib/rate-limit.ts`). На несколько инстансов замените на Redis/Upstash.

## Лицензия и ответственность

Юридические страницы — нейтральные заглушки, не являются юридической консультацией.

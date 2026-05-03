-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SkuType" AS ENUM ('STARS', 'PREMIUM', 'BUNDLE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('awaiting_payment', 'paid', 'processing', 'fulfilled', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sku" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" "SkuType" NOT NULL,
    "priceKopecks" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT,
    "starsAmount" INTEGER,
    "premiumMonths" INTEGER,

    CONSTRAINT "Sku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleItem" (
    "id" TEXT NOT NULL,
    "bundleSkuId" TEXT NOT NULL,
    "componentSkuId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "BundleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderCounter" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "nextOrderNumber" INTEGER NOT NULL DEFAULT 10000,

    CONSTRAINT "OrderCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "publicToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "telegramUsername" TEXT NOT NULL,
    "guestEmail" TEXT,
    "userId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'awaiting_payment',
    "totalKopecks" INTEGER NOT NULL,
    "paymentProvider" TEXT,
    "paymentExternalId" TEXT,
    "paidAt" TIMESTAMP(3),
    "fragmentExternalOrderId" TEXT,
    "fragmentMeta" JSONB,
    "fulfillmentError" TEXT,
    "fulfillmentAttempts" INTEGER NOT NULL DEFAULT 0,
    "operatorNote" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "skuNameSnapshot" TEXT NOT NULL,
    "skuTypeSnapshot" "SkuType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitKopecks" INTEGER NOT NULL,
    "lineTotalKopecks" INTEGER NOT NULL,

    CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "paymentInstructions" TEXT NOT NULL DEFAULT 'Оплата подключается: переведите сумму по реквизитам, которые вы получите от оператора, или дождитесь интеграции платёжного провайдера.',
    "heroTitle" TEXT NOT NULL DEFAULT 'Telegram Stars и Premium',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'Оформление заказа за пару шагов. Выдача через Fragment после оплаты.',
    "trustBlock" TEXT NOT NULL DEFAULT 'Мы не храним платёжные данные карт. Статус заказа можно отслеживать по ссылке после оформления.',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Sku_slug_key" ON "Sku"("slug");

-- CreateIndex
CREATE INDEX "Sku_categoryId_idx" ON "Sku"("categoryId");

-- CreateIndex
CREATE INDEX "Sku_type_idx" ON "Sku"("type");

-- CreateIndex
CREATE INDEX "Sku_active_idx" ON "Sku"("active");

-- CreateIndex
CREATE INDEX "BundleItem_bundleSkuId_idx" ON "BundleItem"("bundleSkuId");

-- CreateIndex
CREATE UNIQUE INDEX "BundleItem_bundleSkuId_componentSkuId_key" ON "BundleItem"("bundleSkuId", "componentSkuId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_publicToken_key" ON "Order"("publicToken");

-- CreateIndex
CREATE INDEX "Order_telegramUsername_idx" ON "Order"("telegramUsername");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "OrderLine_orderId_idx" ON "OrderLine"("orderId");

-- CreateIndex
CREATE INDEX "OrderLine_skuId_idx" ON "OrderLine"("skuId");

-- AddForeignKey
ALTER TABLE "Sku" ADD CONSTRAINT "Sku_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_bundleSkuId_fkey" FOREIGN KEY ("bundleSkuId") REFERENCES "Sku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_componentSkuId_fkey" FOREIGN KEY ("componentSkuId") REFERENCES "Sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

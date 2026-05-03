-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Sku" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL,
    "priceKopecks" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT,
    "starsAmount" INTEGER,
    "premiumMonths" INTEGER,
    CONSTRAINT "Sku_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BundleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bundleSkuId" TEXT NOT NULL,
    "componentSkuId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "BundleItem_bundleSkuId_fkey" FOREIGN KEY ("bundleSkuId") REFERENCES "Sku" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BundleItem_componentSkuId_fkey" FOREIGN KEY ("componentSkuId") REFERENCES "Sku" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderCounter" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "nextOrderNumber" INTEGER NOT NULL DEFAULT 10000
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" INTEGER NOT NULL,
    "publicToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "telegramUsername" TEXT NOT NULL,
    "guestEmail" TEXT,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'awaiting_payment',
    "totalKopecks" INTEGER NOT NULL,
    "paymentProvider" TEXT,
    "paymentExternalId" TEXT,
    "paidAt" DATETIME,
    "fragmentExternalOrderId" TEXT,
    "fragmentMeta" JSONB,
    "fulfillmentError" TEXT,
    "fulfillmentAttempts" INTEGER NOT NULL DEFAULT 0,
    "operatorNote" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "skuNameSnapshot" TEXT NOT NULL,
    "skuTypeSnapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitKopecks" INTEGER NOT NULL,
    "lineTotalKopecks" INTEGER NOT NULL,
    CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderLine_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'main',
    "paymentInstructions" TEXT NOT NULL DEFAULT 'Оплата подключается: переведите сумму по реквизитам, которые вы получите от оператора, или дождитесь интеграции платёжного провайдера.',
    "heroTitle" TEXT NOT NULL DEFAULT 'Telegram Stars и Premium',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'Оформление заказа за пару шагов. Выдача через Fragment после оплаты.',
    "trustBlock" TEXT NOT NULL DEFAULT 'Мы не храним платёжные данные карт. Статус заказа можно отслеживать по ссылке после оформления.',
    "updatedAt" DATETIME NOT NULL
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

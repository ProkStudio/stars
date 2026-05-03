import { PrismaClient, SkuType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.siteSettings.upsert({
    where: { id: "main" },
    create: {
      id: "main",
      paymentInstructions:
        "После подтверждения заказа интеграция платёжного провайдера покажет реквизиты. В MVP оплата не проводится автоматически — свяжитесь с поддержкой или дождитесь подключения эквайринга.",
      heroTitle: "Stars, Premium и выгодные наборы",
      heroSubtitle:
        "Минималистичная витрина: выберите продукт, укажите @username в Telegram — выдача через Fragment после оплаты.",
      trustBlock:
        "Секреты Fragment и кошелька не попадают в браузер. Заказ можно отслеживать по номеру. Мы не обещаем мгновенную оплату картой до подключения провайдера.",
    },
    update: {},
  });

  const catStars = await prisma.category.upsert({
    where: { slug: "stars" },
    create: { name: "Telegram Stars", slug: "stars", sort: 10 },
    update: {},
  });
  const catPremium = await prisma.category.upsert({
    where: { slug: "premium" },
    create: { name: "Telegram Premium", slug: "premium", sort: 20 },
    update: {},
  });
  const catBundles = await prisma.category.upsert({
    where: { slug: "bundles" },
    create: { name: "Наборы", slug: "bundles", sort: 30 },
    update: {},
  });

  const star50 = await prisma.sku.upsert({
    where: { slug: "stars-50" },
    create: {
      slug: "stars-50",
      name: "50 Stars",
      description: "Пакет 50 звёзд для Telegram.",
      type: SkuType.STARS,
      priceKopecks: 99_00,
      active: true,
      sort: 10,
      categoryId: catStars.id,
      starsAmount: 50,
    },
    update: {
      name: "50 Stars",
      priceKopecks: 99_00,
      starsAmount: 50,
      categoryId: catStars.id,
    },
  });

  await prisma.sku.upsert({
    where: { slug: "stars-100" },
    create: {
      slug: "stars-100",
      name: "100 Stars",
      description: "Пакет 100 звёзд для Telegram.",
      type: SkuType.STARS,
      priceKopecks: 189_00,
      active: true,
      sort: 20,
      categoryId: catStars.id,
      starsAmount: 100,
    },
    update: {
      priceKopecks: 189_00,
      starsAmount: 100,
      categoryId: catStars.id,
    },
  });

  const prem3 = await prisma.sku.upsert({
    where: { slug: "premium-3" },
    create: {
      slug: "premium-3",
      name: "Premium — 3 месяца",
      description: "Подписка Telegram Premium на 3 месяца (подарок).",
      type: SkuType.PREMIUM,
      priceKopecks: 799_00,
      active: true,
      sort: 10,
      categoryId: catPremium.id,
      premiumMonths: 3,
    },
    update: {
      premiumMonths: 3,
      categoryId: catPremium.id,
    },
  });

  await prisma.sku.upsert({
    where: { slug: "premium-6" },
    create: {
      slug: "premium-6",
      name: "Premium — 6 месяцев",
      description: "Подписка Telegram Premium на 6 месяцев (подарок).",
      type: SkuType.PREMIUM,
      priceKopecks: 1499_00,
      active: true,
      sort: 20,
      categoryId: catPremium.id,
      premiumMonths: 6,
    },
    update: { premiumMonths: 6, categoryId: catPremium.id },
  });

  await prisma.sku.upsert({
    where: { slug: "premium-12" },
    create: {
      slug: "premium-12",
      name: "Premium — 12 месяцев",
      description: "Подписка Telegram Premium на 12 месяцев (подарок).",
      type: SkuType.PREMIUM,
      priceKopecks: 2799_00,
      active: true,
      sort: 30,
      categoryId: catPremium.id,
      premiumMonths: 12,
    },
    update: { premiumMonths: 12, categoryId: catPremium.id },
  });

  const bundle = await prisma.sku.upsert({
    where: { slug: "bundle-stars-premium3" },
    create: {
      slug: "bundle-stars-premium3",
      name: "Старт: 50 Stars + Premium 3 мес.",
      description: "Акционный набор: звёзды и Premium одним заказом.",
      type: SkuType.BUNDLE,
      priceKopecks: 849_00,
      active: true,
      sort: 10,
      categoryId: catBundles.id,
    },
    update: {
      priceKopecks: 849_00,
      categoryId: catBundles.id,
    },
  });

  await prisma.bundleItem.deleteMany({ where: { bundleSkuId: bundle.id } });
  await prisma.bundleItem.createMany({
    data: [
      { bundleSkuId: bundle.id, componentSkuId: star50.id, quantity: 1 },
      { bundleSkuId: bundle.id, componentSkuId: prem3.id, quantity: 1 },
    ],
  });

  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPass = process.env.ADMIN_PASSWORD_PLAIN || "change-me";
  const hash = await bcrypt.hash(adminPass, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash: hash,
      role: "ADMIN",
    },
    update: {
      passwordHash: hash,
      role: "ADMIN",
    },
  });

  console.log("Seed OK. Admin:", adminEmail, "(password from ADMIN_PASSWORD_PLAIN or default change-me)");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

import { NextResponse } from "next/server";
import { SkuType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";

const bundleItem = z.object({
  componentSkuId: z.string().min(1),
  quantity: z.number().int().positive(),
});

const createSchema = z
  .object({
    slug: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    type: z.nativeEnum(SkuType),
    priceKopecks: z.number().int().positive(),
    active: z.boolean().optional(),
    sort: z.number().int().optional(),
    categoryId: z.string().nullable().optional(),
    starsAmount: z.number().int().positive().nullable().optional(),
    premiumMonths: z.number().int().nullable().optional(),
    bundleItems: z.array(bundleItem).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === SkuType.STARS && !val.starsAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Укажите starsAmount",
      });
    }
    if (val.type === SkuType.PREMIUM) {
      const m = val.premiumMonths;
      if (!m || ![3, 6, 12].includes(m)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "premiumMonths: 3, 6 или 12",
        });
      }
    }
    if (val.type === SkuType.BUNDLE) {
      if (!val.bundleItems?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Добавьте состав бандла",
        });
      }
    }
  });

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const skus = await prisma.sku.findMany({
    orderBy: [{ sort: "asc" }, { name: "asc" }],
    include: {
      category: true,
      bundleItems: { include: { componentSku: true } },
    },
  });

  return NextResponse.json({ skus });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (data.type === SkuType.BUNDLE && data.bundleItems) {
    for (const bi of data.bundleItems) {
      const comp = await prisma.sku.findUnique({
        where: { id: bi.componentSkuId },
      });
      if (!comp || comp.type === SkuType.BUNDLE) {
        return NextResponse.json(
          { error: "Недопустимый компонент бандла" },
          { status: 400 }
        );
      }
    }
  }

  const sku = await prisma.sku.create({
    data: {
      slug: data.slug,
      name: data.name,
      description: data.description ?? "",
      type: data.type,
      priceKopecks: data.priceKopecks,
      active: data.active ?? true,
      sort: data.sort ?? 0,
      categoryId: data.categoryId ?? null,
      starsAmount: data.type === SkuType.STARS ? data.starsAmount ?? null : null,
      premiumMonths:
        data.type === SkuType.PREMIUM ? data.premiumMonths ?? null : null,
      bundleItems:
        data.type === SkuType.BUNDLE && data.bundleItems
          ? {
              create: data.bundleItems.map((b) => ({
                componentSkuId: b.componentSkuId,
                quantity: b.quantity,
              })),
            }
          : undefined,
    },
    include: {
      bundleItems: { include: { componentSku: true } },
      category: true,
    },
  });

  return NextResponse.json({ sku });
}

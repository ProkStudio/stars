import { NextResponse } from "next/server";
import { SkuType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";

const bundleItem = z.object({
  componentSkuId: z.string().min(1),
  quantity: z.number().int().positive(),
});

const patchSchema = z
  .object({
    slug: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    type: z.nativeEnum(SkuType).optional(),
    priceKopecks: z.number().int().positive().optional(),
    active: z.boolean().optional(),
    sort: z.number().int().optional(),
    categoryId: z.string().nullable().optional(),
    starsAmount: z.number().int().positive().nullable().optional(),
    premiumMonths: z.number().int().nullable().optional(),
    bundleItems: z.array(bundleItem).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === SkuType.STARS && val.starsAmount === undefined) {
      /* optional patch — skip */
    }
    if (val.type === SkuType.PREMIUM && val.premiumMonths != null) {
      const m = val.premiumMonths;
      if (![3, 6, 12].includes(m)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "premiumMonths: 3, 6 или 12",
        });
      }
    }
  });

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const sku = await prisma.sku.findUnique({
    where: { id },
    include: {
      bundleItems: { include: { componentSku: true } },
      category: true,
    },
  });

  if (!sku) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ sku });
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.sku.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nextType = parsed.data.type ?? existing.type;

  if (parsed.data.bundleItems && nextType === SkuType.BUNDLE) {
    for (const bi of parsed.data.bundleItems) {
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

  const sku = await prisma.$transaction(async (tx) => {
    if (parsed.data.bundleItems && nextType === SkuType.BUNDLE) {
      await tx.bundleItem.deleteMany({ where: { bundleSkuId: id } });
      await tx.bundleItem.createMany({
        data: parsed.data.bundleItems.map((b) => ({
          bundleSkuId: id,
          componentSkuId: b.componentSkuId,
          quantity: b.quantity,
        })),
      });
    }

    return tx.sku.update({
      where: { id },
      data: {
        slug: parsed.data.slug,
        name: parsed.data.name,
        description: parsed.data.description,
        type: parsed.data.type,
        priceKopecks: parsed.data.priceKopecks,
        active: parsed.data.active,
        sort: parsed.data.sort,
        categoryId: parsed.data.categoryId,
        starsAmount:
          nextType === SkuType.STARS
            ? parsed.data.starsAmount ?? existing.starsAmount
            : null,
        premiumMonths:
          nextType === SkuType.PREMIUM
            ? parsed.data.premiumMonths ?? existing.premiumMonths
            : null,
      },
      include: {
        bundleItems: { include: { componentSku: true } },
        category: true,
      },
    });
  });

  return NextResponse.json({ sku });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  await prisma.sku.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

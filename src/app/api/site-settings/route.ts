import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const s = await prisma.siteSettings.findUnique({ where: { id: "main" } });
  return NextResponse.json({
    settings: s,
    paymentStubEnv: process.env.PAYMENT_STUB_TEXT ?? null,
  });
}

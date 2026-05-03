import { NextResponse } from "next/server";
import { readUserSession } from "@/lib/user-auth";

export async function GET() {
  const s = await readUserSession();
  if (!s || s.role !== "USER") {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: { id: s.sub, email: s.email },
  });
}

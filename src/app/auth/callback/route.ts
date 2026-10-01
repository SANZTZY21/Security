import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/server";
import { safeRedirect } from "@/lib/domain";
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (code) {
    const s = await db();
    const { error } = await s.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(safeRedirect(req.nextUrl.searchParams.get("next")), req.url),
      );
  }
  return NextResponse.redirect(
    new URL("/login?error=Tautan+kedaluwarsa.+Minta+tautan+baru.", req.url),
  );
}

import { NextResponse } from "next/server";
import { db, configured } from "@/lib/supabase/server";
export async function GET() {
  let database = false;
  if (configured()) {
    try {
      const s = await db();
      const { error } = await s
        .from("subscription_plans")
        .select("id")
        .limit(1);
      database = !error;
    } catch {}
  }
  return NextResponse.json(
    {
      database,
      anilist: "not-probed",
      tmdb: process.env.TMDB_API_KEY ? "configured" : "not-configured",
      payments: process.env.MIDTRANS_SERVER_KEY
        ? "configured"
        : "not-configured",
    },
    { status: database ? 200 : 503 },
  );
}

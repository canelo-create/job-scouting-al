import { NextResponse, type NextRequest } from "next/server";
import { requireCron } from "@/lib/auth/require-admin";
import { runScout } from "@/lib/serpapi/scout";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const guard = requireCron(req);
  if (guard) return guard;

  try {
    const summary = await runScout({ maxSearches: 3, minRemaining: 5 });
    return NextResponse.json({ ok: true, summary });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

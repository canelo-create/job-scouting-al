import { NextResponse, type NextRequest } from "next/server";
import { requireCron } from "@/lib/auth/require-admin";
import { runAggregators } from "@/lib/aggregators/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const guard = requireCron(req);
  if (guard) return guard;
  try {
    const summary = await runAggregators(20);
    return NextResponse.json({ ok: true, summary });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

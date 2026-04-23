import { NextResponse, type NextRequest } from "next/server";
import { requireCron } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily SerpApi scrape orchestrator. Semana 2 populates the full logic per
 * §M3 — for now it just logs a scrape_run row so the Radar UI has something
 * to display and we can verify the cron is firing.
 */
export async function GET(req: NextRequest) {
  const guard = requireCron(req);
  if (guard) return guard;

  const started = new Date().toISOString();
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("scrape_runs")
    .insert({
      kind: "serpapi_daily",
      queries: [],
      engines_used: [],
      status: "success",
      new_offers: 0,
      total_results: 0,
      started_at: started,
      finished_at: new Date().toISOString(),
      summary_md:
        "**Stub** — full SerpApi orchestration llega en Semana 2. Cron validado.",
    })
    .select("id")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, run_id: data.id, stub: true });
}

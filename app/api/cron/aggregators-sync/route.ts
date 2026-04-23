import { NextResponse, type NextRequest } from "next/server";
import { requireCron } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Stub — Adzuna/Remotive/Arbeitnow orchestration llega en Semana 4. */
export async function GET(req: NextRequest) {
  const guard = requireCron(req);
  if (guard) return guard;

  const sb = createAdminClient();
  const { data, error } = await sb
    .from("scrape_runs")
    .insert({
      kind: "adzuna_sync",
      status: "success",
      new_offers: 0,
      total_results: 0,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      summary_md: "**Stub** — Adzuna/Remotive/Arbeitnow llegan en Semana 4.",
    })
    .select("id")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, run_id: data.id, stub: true });
}

import Link from "next/link";
import { Radar as RadarIcon, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import EmptyState from "@/components/common/EmptyState";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

type ScrapeRun = {
  id: string;
  kind: string;
  status: string;
  new_offers: number;
  total_results: number;
  started_at: string;
  finished_at: string | null;
  summary_md: string | null;
  queries: unknown;
  engines_used: string[] | null;
  quota_before: number | null;
  quota_after: number | null;
};

async function loadRuns(): Promise<ScrapeRun[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = createAdminClient();
  const { data } = await sb
    .from("scrape_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(20);
  return (data ?? []) as ScrapeRun[];
}

export default async function RadarPage() {
  const runs = await loadRuns();
  const lastRun = runs[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">Radar</h2>
        <p className="text-sm text-muted-foreground">
          Orquestador SerpApi + agregadores gratuitos. Cron diario 08:00 CET.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
              <Zap className="size-4" /> Último run
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-xl font-semibold">
              {lastRun ? format(new Date(lastRun.started_at), "dd MMM HH:mm") : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {lastRun ? `${lastRun.new_offers} nuevas · ${lastRun.total_results} resultados` : "Sin runs aún"}
            </p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Próximo cron
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-xl font-semibold">07:00 UTC</p>
            <p className="mt-1 text-xs text-muted-foreground">
              job-scout-daily (SerpApi) · 08:00 CET
            </p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Quota SerpApi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-xl font-semibold">
              {lastRun?.quota_after !== null && lastRun?.quota_after !== undefined
                ? `${lastRun.quota_after} left`
                : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Free tier: 100/mes</p>
          </CardContent>
        </Card>
      </div>

      <section>
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Historial de runs
        </h3>
        {runs.length === 0 ? (
          <EmptyState
            icon={RadarIcon}
            title="Sin runs aún"
            description="El primer cron corre mañana 08:00 CET. También podés dispararlo manualmente vía /api/cron/job-scout-daily con el CRON_SECRET."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/pipeline">Ver pipeline</Link>
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {runs.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md border border-border bg-card p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{r.kind}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(r.started_at), "yyyy-MM-dd HH:mm")} · {r.status}
                  </p>
                </div>
                <div className="text-right text-[11px]">
                  <p className="font-medium">{r.new_offers} nuevas</p>
                  <p className="text-muted-foreground">{r.total_results} tot.</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

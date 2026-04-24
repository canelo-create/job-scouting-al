import Link from "next/link";
import { Radar as RadarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getAccount } from "@/lib/serpapi/quota";
import EmptyState from "@/components/common/EmptyState";
import RunNowButton from "@/components/radar/RunNowButton";
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
  error_message: string | null;
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

async function loadQuota(): Promise<{
  remaining: number | null;
  plan: string | null;
  usage: number | null;
  total: number | null;
  error?: string;
}> {
  if (!process.env.SERPAPI_KEY) {
    return { remaining: null, plan: null, usage: null, total: null, error: "SERPAPI_KEY missing" };
  }
  try {
    const acc = await getAccount();
    return {
      remaining:
        acc.total_searches_left ??
        acc.plan_searches_left ??
        (acc.searches_per_month && acc.this_month_usage !== undefined
          ? acc.searches_per_month - acc.this_month_usage
          : null),
      plan: acc.plan_name ?? null,
      usage: acc.this_month_usage ?? null,
      total: acc.searches_per_month ?? null,
    };
  } catch (e) {
    return {
      remaining: null,
      plan: null,
      usage: null,
      total: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export default async function RadarPage() {
  const [runs, quota] = await Promise.all([loadRuns(), loadQuota()]);
  const lastRun = runs[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold">Radar</h2>
          <p className="text-sm text-muted-foreground">
            SerpApi scout. Cron diario 08:00 CET. Gasto: ~3 searches/día.
          </p>
        </div>
        <RunNowButton />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Último run
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-xl font-semibold">
              {lastRun ? format(new Date(lastRun.started_at), "dd MMM HH:mm") : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {lastRun
                ? `${lastRun.new_offers} nuevas · ${lastRun.total_results} resultados · ${lastRun.status}`
                : "Sin runs aún"}
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
              job-scout-daily · 08:00 CET
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
              {quota.remaining !== null ? `${quota.remaining}` : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {quota.total
                ? `${quota.usage ?? 0} / ${quota.total} usadas`
                : quota.error ?? "Free tier: 100/mes"}
            </p>
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
            description="El primer cron corre mañana 08:00 CET. Podés forzar uno ahora con 'Ejecutar ahora' (gasta 3 searches) o esperar."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/pipeline">Ver pipeline</Link>
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {runs.map((r) => (
              <details
                key={r.id}
                className="group rounded-md border border-border bg-card"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-2 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {r.kind} · {r.status}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {format(new Date(r.started_at), "yyyy-MM-dd HH:mm")} ·{" "}
                      {r.engines_used?.join(", ") ?? "—"}
                    </p>
                  </div>
                  <div className="text-right text-[11px]">
                    <p className="font-medium">{r.new_offers} nuevas</p>
                    <p className="text-muted-foreground">{r.total_results} tot.</p>
                  </div>
                </summary>
                {r.summary_md ? (
                  <pre className="overflow-auto border-t border-border p-3 text-[11px] text-muted-foreground whitespace-pre-wrap">
                    {r.summary_md}
                  </pre>
                ) : null}
                {r.error_message ? (
                  <pre className="overflow-auto border-t border-border bg-destructive/10 p-3 text-[11px] text-destructive whitespace-pre-wrap">
                    {r.error_message}
                  </pre>
                ) : null}
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

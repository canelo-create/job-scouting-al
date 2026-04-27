import Link from "next/link";
import { ExternalLink, ArrowLeft, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SOURCES,
  PRIORITY_LABEL,
  VERDICT_LABEL,
  type SourceVerdict,
} from "@/lib/sources/registry";

export const dynamic = "force-static";

const VERDICT_ICON: Record<SourceVerdict, { icon: typeof CheckCircle2; cls: string }> = {
  api: { icon: CheckCircle2, cls: "text-fit-alto" },
  rss: { icon: CheckCircle2, cls: "text-canelo-cyan" },
  "ats-public": { icon: CheckCircle2, cls: "text-fit-alto" },
  scrape: { icon: AlertCircle, cls: "text-fit-medio" },
  manual: { icon: XCircle, cls: "text-muted-foreground" },
  "not-board": { icon: XCircle, cls: "text-muted-foreground/60" },
};

export default function SourcesRegistryPage() {
  const tier1 = SOURCES.filter((s) => s.priority === 1);
  const tier2 = SOURCES.filter((s) => s.priority === 2);
  const tier3 = SOURCES.filter((s) => s.priority === 3);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/ajustes">
            <ArrowLeft className="size-4" /> Ajustes
          </Link>
        </Button>
      </div>

      <div>
        <h2 className="font-heading text-xl font-semibold">Plataformas / Fuentes</h2>
        <p className="text-sm text-muted-foreground">
          {SOURCES.length} job boards + plataformas evaluadas. Verdict por
          integrabilidad técnica.
        </p>
      </div>

      <Section title={PRIORITY_LABEL[1]} sources={tier1} />
      <Section title={PRIORITY_LABEL[2]} sources={tier2} />
      <Section title={PRIORITY_LABEL[3]} sources={tier3} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Roadmap de integración</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <ol className="list-inside list-decimal space-y-1">
            <li>
              <span className="font-medium">Día 6 (Tier 1):</span> Torre, RemoteOK,
              GetonBoard, Anthropic Greenhouse → cron paralelo a SerpApi.
            </li>
            <li>
              <span className="font-medium">Día 7 (Tier 2 selectivo):</span> Wellfound
              + YC + WTJ → Chrome extension MV3 (capture manual). Magma + Atlántico
              VC + AIJobs → scrape con cron 2x/semana.
            </li>
            <li>
              <span className="font-medium">Optional:</span> Mercor + Honeypot →
              skip. Antler + EF → flujo separado (founder track), notebook aparte.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({
  title,
  sources,
}: {
  title: string;
  sources: typeof SOURCES;
}) {
  if (sources.length === 0) return null;
  return (
    <section>
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title} · {sources.length}
      </h3>
      <div className="flex flex-col gap-2">
        {sources.map((s) => {
          const meta = VERDICT_ICON[s.verdict];
          const Icon = meta.icon;
          return (
            <div
              key={s.id}
              className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium">
                    <Icon className={`size-4 ${meta.cls}`} />
                    {s.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{s.enfoque}</p>
                </div>
                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {VERDICT_LABEL[s.verdict]}
                </span>
              </div>
              {s.endpoint ? (
                <p className="rounded bg-muted/40 px-2 py-1 font-mono text-[10px] text-muted-foreground">
                  {s.endpoint}
                </p>
              ) : null}
              {s.notes ? (
                <p className="text-[11px] text-muted-foreground">{s.notes}</p>
              ) : null}
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-1 text-[11px] text-canelo-cyan hover:underline"
              >
                <ExternalLink className="size-3" />
                Abrir
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}

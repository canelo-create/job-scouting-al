import Link from "next/link";
import { FileText, Sparkles, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/auth/require-user";
import EmptyState from "@/components/common/EmptyState";
import { isAnthropicConfigured } from "@/lib/anthropic/client";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  cv: "CV",
  cover_letter: "Cover letter",
};

type CV = {
  id: string;
  kind: string;
  version: number;
  offer_id: string | null;
  created_at: string;
  offers: { title: string; companies: { name: string } | null } | null;
};

async function loadCVs(userId: string): Promise<CV[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = createAdminClient();
  const { data } = await sb
    .from("cv_documents")
    .select("id, kind, version, offer_id, created_at, offers(title, companies(name))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as unknown as CV[];
}

export default async function CVPage() {
  const user = await getAuthedUser();
  const cvs = user ? await loadCVs(user.id) : [];
  const anthropicReady = isAnthropicConfigured();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">CV / Cover</h2>
        <p className="text-sm text-muted-foreground">
          Versiones generadas por oferta usando Claude + tu CV base.
        </p>
      </div>

      {!anthropicReady ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4" /> Configurar Anthropic
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>
              Falta <code>ANTHROPIC_API_KEY</code>. Gratis con $5 credits al crear
              cuenta. Pay-per-use después (Haiku ~$0.003/1k tokens ≈ $0.01 por CV
              completo).
            </p>
            <Button asChild size="sm" variant="outline" className="w-fit">
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                Crear API key
              </a>
            </Button>
            <p className="text-[11px]">
              Una vez creada, pegámela y la inyecto a Vercel env + redeploy.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {cvs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Sin CVs generados todavía"
          description="Desde el detalle de una oferta → 'Adaptar CV + Cover' genera ambos y quedan listos acá."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/pipeline">Ver pipeline</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {cvs.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-md border border-border bg-card p-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {KIND_LABELS[d.kind] ?? d.kind} v{d.version} ·{" "}
                  {d.offers?.companies?.name ?? "—"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {d.offers?.title ?? "(base)"} ·{" "}
                  {format(new Date(d.created_at), "yyyy-MM-dd HH:mm")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/cv/${d.id}`}>Ver</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={`/api/cv/${d.id}/download`}>
                    <Download className="size-3" />
                    .docx
                  </a>
                </Button>
                {d.offer_id ? (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/pipeline/${d.offer_id}`}>Oferta</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

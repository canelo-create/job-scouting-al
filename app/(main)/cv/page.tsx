import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/auth/require-user";
import EmptyState from "@/components/common/EmptyState";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

type CV = {
  id: string;
  kind: string;
  version: number;
  offer_id: string | null;
  created_at: string;
};

async function loadCVs(userId: string): Promise<CV[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = createAdminClient();
  const { data } = await sb
    .from("cv_documents")
    .select("id, kind, version, offer_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as CV[];
}

export default async function CVPage() {
  const user = await getAuthedUser();
  const cvs = user ? await loadCVs(user.id) : [];
  const anthropicConfigured = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">CV / Cover</h2>
        <p className="text-sm text-muted-foreground">
          Generador adaptado por oferta usando Claude + tu perfil YAML.
        </p>
      </div>

      {!anthropicConfigured ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4" /> Configurar Anthropic
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>
              Este módulo necesita `ANTHROPIC_API_KEY`. Anthropic da $5 free
              credits al crear cuenta; después pay-per-use (Haiku ~$0.003/1k
              tokens).
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
          </CardContent>
        </Card>
      ) : null}

      {cvs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Sin CVs generados todavía"
          description="Desde el detalle de una oferta podés pedir 'Generar CV adaptado' — devuelve markdown + .docx."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/pipeline">Ver pipeline</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {cvs.map((cv) => (
            <div
              key={cv.id}
              className="flex items-center justify-between rounded-md border border-border bg-card p-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {cv.kind} v{cv.version}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {format(new Date(cv.created_at), "yyyy-MM-dd HH:mm")}
                </p>
              </div>
              {cv.offer_id ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/pipeline/${cv.offer_id}`}>Ver oferta</Link>
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

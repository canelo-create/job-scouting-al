import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthedUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";
import FitBadge from "@/components/pipeline/FitBadge";
import StatusBadge from "@/components/pipeline/StatusBadge";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  type Offer,
  type OfferStatus,
} from "@/lib/offers/types";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { updateOfferStatus, deleteOffer } from "../actions";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function loadOffer(userId: string, id: string) {
  if (!isSupabaseConfigured()) return null;
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("offers")
    .select("*, companies(name, domain, official_site, careers_page, size, funding_stage, quality_signal)")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Offer & {
    companies: {
      name: string;
      domain: string | null;
      official_site: string | null;
      careers_page: string | null;
      size: string | null;
      funding_stage: string | null;
      quality_signal: string | null;
    } | null;
  };
}

export default async function OfferDetailPage({ params }: Params) {
  const { id } = await params;
  const user = await getAuthedUser();
  if (!user) return notFound();
  const offer = await loadOffer(user.id, id);
  if (!offer) return notFound();

  async function setStatus(formData: FormData) {
    "use server";
    const status = String(formData.get("status"));
    await updateOfferStatus(id, status);
  }

  async function remove() {
    "use server";
    await deleteOffer(id);
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/pipeline">
            <ArrowLeft className="size-4" />
            Volver al pipeline
          </Link>
        </Button>
        <form action={remove}>
          <Button type="submit" variant="outline" size="sm" className="text-status-danger">
            Eliminar
          </Button>
        </form>
      </div>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <FitBadge tier={offer.fit_tier} score={offer.fit_score} />
          <StatusBadge status={offer.status} />
          {offer.opportunity_priority_score ? (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              Prioridad · {offer.opportunity_priority_score}/100
            </span>
          ) : null}
          {offer.company_quality_score ? (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              Empresa · {offer.company_quality_score}/100
            </span>
          ) : null}
        </div>
        <h1 className="font-heading text-2xl font-semibold">{offer.title}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {offer.companies?.name ? <span>{offer.companies.name}</span> : null}
          {offer.location ? <span>· {offer.location}</span> : null}
          {offer.modality ? <span>· {offer.modality}</span> : null}
          {offer.source ? <span>· {offer.source}</span> : null}
        </div>
        {offer.source_url ? (
          <a
            href={offer.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-canelo-cyan hover:underline"
          >
            <ExternalLink className="size-3" />
            Abrir oferta original
          </a>
        ) : null}
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cambiar estado</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={setStatus} className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="status-select">
                Nuevo estado
              </label>
              <select
                id="status-select"
                name="status"
                defaultValue={offer.status}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s as OfferStatus]}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm">
              Actualizar
            </Button>
          </form>
        </CardContent>
      </Card>

      {offer.why_it_matches ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por qué matchea</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{offer.why_it_matches}</p>
          </CardContent>
        </Card>
      ) : null}

      {offer.recommended_action ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acción recomendada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{offer.recommended_action}</p>
          </CardContent>
        </Card>
      ) : null}

      {offer.companies ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Intel empresa</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
              <dt className="text-muted-foreground">Sitio oficial</dt>
              <dd className="truncate">{offer.companies.official_site ?? "—"}</dd>
              <dt className="text-muted-foreground">Careers</dt>
              <dd className="truncate">{offer.companies.careers_page ?? "—"}</dd>
              <dt className="text-muted-foreground">Tamaño</dt>
              <dd>{offer.companies.size ?? "—"}</dd>
              <dt className="text-muted-foreground">Funding</dt>
              <dd>{offer.companies.funding_stage ?? "—"}</dd>
              <dt className="text-muted-foreground">Señal</dt>
              <dd>{offer.companies.quality_signal ?? "—"}</dd>
            </dl>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
            <dt className="text-muted-foreground">Creada</dt>
            <dd>{format(new Date(offer.created_at), "yyyy-MM-dd HH:mm")}</dd>
            <dt className="text-muted-foreground">Último cambio</dt>
            <dd>{format(new Date(offer.last_touched_at), "yyyy-MM-dd HH:mm")}</dd>
            {offer.posted_at ? (
              <>
                <dt className="text-muted-foreground">Publicada</dt>
                <dd>{format(new Date(offer.posted_at), "yyyy-MM-dd")}</dd>
              </>
            ) : null}
            {offer.applied_at ? (
              <>
                <dt className="text-muted-foreground">Aplicada</dt>
                <dd>{format(new Date(offer.applied_at), "yyyy-MM-dd")}</dd>
              </>
            ) : null}
            {offer.deadline ? (
              <>
                <dt className="text-muted-foreground">Deadline</dt>
                <dd>{format(new Date(offer.deadline), "yyyy-MM-dd")}</dd>
              </>
            ) : null}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

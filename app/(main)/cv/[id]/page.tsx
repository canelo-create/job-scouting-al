import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthedUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  cv: "CV",
  cover_letter: "Cover letter",
};

type Params = { params: Promise<{ id: string }> };

export default async function CVDetailPage({ params }: Params) {
  const { id } = await params;
  const user = await getAuthedUser();
  if (!user) return notFound();
  const sb = createAdminClient();
  const { data } = await sb
    .from("cv_documents")
    .select("*, offers(id, title, companies(name))")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return notFound();
  const doc = data as {
    id: string;
    kind: string;
    version: number;
    content_md: string;
    offer_id: string | null;
    created_at: string;
    offers: { id: string; title: string; companies: { name: string } | null } | null;
  };

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href={doc.offers?.id ? `/pipeline/${doc.offers.id}` : "/cv"}>
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={`/api/cv/${doc.id}/download`}>
            <Download className="size-4" />
            Descargar .docx
          </a>
        </Button>
      </div>
      <header>
        <h1 className="font-heading text-xl font-semibold">
          {KIND_LABELS[doc.kind] ?? doc.kind} · v{doc.version}
        </h1>
        <p className="text-sm text-muted-foreground">
          {doc.offers?.companies?.name ?? "—"} · {doc.offers?.title ?? "—"}
          <span className="ml-2 text-[11px]">
            ({format(new Date(doc.created_at), "yyyy-MM-dd HH:mm")})
          </span>
        </p>
      </header>
      <Card>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-serif">
            {doc.content_md}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { CheckCircle2, ExternalLink, Mail } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { markAsAppliedAction } from "@/app/(main)/pipeline/actions";

export default function ApplyHelper({
  offerId,
  sourceUrl,
  title,
  companyName,
  hasCv,
}: {
  offerId: string;
  sourceUrl: string | null;
  title: string;
  companyName: string | null;
  hasCv: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function openAndMark() {
    if (!sourceUrl) {
      toast.error("Esta oferta no tiene URL original.");
      return;
    }
    if (!window.confirm(
      "Abro la oferta en una pestaña nueva y marco como 'Aplicado'. Continuar?",
    )) {
      return;
    }
    window.open(sourceUrl, "_blank", "noopener,noreferrer");
    startTransition(async () => {
      const res = await markAsAppliedAction(offerId);
      if (res.ok) {
        toast.success("Marcada como aplicada. Streak actualizado.");
        router.refresh();
      } else {
        toast.error(res.error ?? "error");
      }
    });
  }

  const mailtoSubject = `Application: ${title}`;
  const mailtoBody = `Hi,%0D%0A%0D%0AI would like to apply for the ${title} position${
    companyName ? ` at ${companyName}` : ""
  }. Please find my CV and cover letter attached.%0D%0A%0D%0ABest regards,%0D%0AAndres Lince Garcia`;
  const mailtoHref = `mailto:?subject=${encodeURIComponent(mailtoSubject)}&body=${mailtoBody}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {sourceUrl ? (
        <Button size="sm" onClick={openAndMark} disabled={isPending}>
          <ExternalLink className="size-4" />
          Aplicar ahora
        </Button>
      ) : null}
      <Button asChild size="sm" variant="outline">
        <a href={mailtoHref}>
          <Mail className="size-4" />
          Borrador email
        </a>
      </Button>
      {!hasCv ? (
        <span className="text-[11px] text-muted-foreground">
          ⚠️ Generá CV adaptado antes de aplicar.
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[11px] text-fit-alto">
          <CheckCircle2 className="size-3" />
          CV + cover listos
        </span>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { CalendarDays, Trash2, ExternalLink, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { deleteEvent } from "@/app/(main)/calendario/actions";

const KIND_STYLES: Record<string, string> = {
  entrevista: "bg-fit-alto/15 text-fit-alto",
  follow_up: "bg-canelo-cyan/15 text-canelo-cyan",
  deadline: "bg-status-danger/15 text-status-danger",
  reunion: "bg-canelo-orange/15 text-canelo-orange",
  preparacion: "bg-fit-medio/15 text-fit-medio",
  otro: "bg-muted text-muted-foreground",
};

export type EventItem = {
  id: string;
  title: string;
  kind: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  meeting_url: string | null;
  offer_id: string | null;
  notes: string | null;
};

export default function EventList({ events }: { events: EventItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [removing, setRemoving] = useState<string | null>(null);

  function onDelete(id: string) {
    if (!window.confirm("¿Eliminar este evento?")) return;
    setRemoving(id);
    startTransition(async () => {
      const res = await deleteEvent(id);
      if (res.ok) {
        toast.success("Eliminado");
        router.refresh();
      } else {
        toast.error(res.error ?? "Error");
      }
      setRemoving(null);
    });
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/40 p-8 text-center">
        <CalendarDays className="size-10 text-muted-foreground/60" />
        <p className="font-medium">Sin eventos próximos</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Agregá entrevistas, follow-ups o deadlines acá. Aparecen en el tablero
          como próximo evento.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {events.map((e) => (
        <div key={e.id} className="rounded-md border border-border bg-card p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{e.title}</p>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                    KIND_STYLES[e.kind] ?? KIND_STYLES.otro
                  }`}
                >
                  {e.kind}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {format(new Date(e.starts_at), "EEE dd MMM · HH:mm")}
                {e.ends_at ? ` → ${format(new Date(e.ends_at), "HH:mm")}` : ""}
                {e.location ? ` · ${e.location}` : ""}
              </p>
              {e.notes ? (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{e.notes}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]">
                {e.meeting_url ? (
                  <a
                    href={e.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-canelo-cyan hover:underline"
                  >
                    <LinkIcon className="size-3" /> Meeting link
                  </a>
                ) : null}
                {e.offer_id ? (
                  <Link
                    href={`/pipeline/${e.offer_id}`}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="size-3" /> Ir a oferta
                  </Link>
                ) : null}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(e.id)}
              disabled={isPending && removing === e.id}
              className="text-status-danger"
              aria-label="Eliminar evento"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

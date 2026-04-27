"use client";

import { useTransition, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createEvent } from "@/app/(main)/calendario/actions";

type OfferOption = { id: string; title: string; company: string | null };

export default function AddEventForm({ offers }: { offers: OfferOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createEvent(fd);
      if (res.ok) {
        toast.success("Evento creado");
        (e.target as HTMLFormElement).reset();
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Agregar evento
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nuevo evento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="title">
                Título *
              </label>
              <Input id="title" name="title" required placeholder="Entrevista BCG round 1" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="kind">
                Tipo
              </label>
              <select
                id="kind"
                name="kind"
                defaultValue="entrevista"
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="entrevista">Entrevista</option>
                <option value="follow_up">Follow-up</option>
                <option value="deadline">Deadline</option>
                <option value="reunion">Reunión</option>
                <option value="preparacion">Preparación</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="starts_at">
                Inicio *
              </label>
              <Input id="starts_at" name="starts_at" type="datetime-local" required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="ends_at">
                Fin
              </label>
              <Input id="ends_at" name="ends_at" type="datetime-local" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="location">
                Ubicación
              </label>
              <Input id="location" name="location" placeholder="Madrid · oficina o virtual" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="meeting_url">
                Meeting URL
              </label>
              <Input id="meeting_url" name="meeting_url" type="url" placeholder="https://zoom.us/..." />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="offer_id">
              Vincular a oferta
            </label>
            <select
              id="offer_id"
              name="offer_id"
              defaultValue="none"
              className="h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="none">— Sin vincular —</option>
              {offers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.company ?? "?"} · {o.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="notes">
              Notas
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="rounded-md border border-border bg-background p-3 text-sm"
              placeholder="Recruiter, agenda, links de prep..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Creando…" : "Crear evento"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

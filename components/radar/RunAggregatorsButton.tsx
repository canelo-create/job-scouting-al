"use client";

import { Layers } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { runAggregatorsNow } from "@/app/(main)/radar/actions";

export default function RunAggregatorsButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [locked, setLocked] = useState(false);

  function onClick() {
    if (!window.confirm("Corre Torre + RemoteOK + GetonBoard + Anthropic Greenhouse. Free, sin gasto. ¿Continuar?")) return;
    setLocked(true);
    startTransition(async () => {
      const res = await runAggregatorsNow();
      if (res.ok) {
        const s = res.summary;
        toast.success(
          `✓ ${s.newOffers} nuevas · ${s.duplicates} dups · ${s.totalResults} fetched`,
          { duration: 6000 },
        );
        router.refresh();
      } else {
        toast.error(`✗ ${res.error}`, { duration: 8000 });
      }
      setLocked(false);
    });
  }

  return (
    <Button size="sm" variant="outline" onClick={onClick} disabled={isPending || locked}>
      <Layers className="size-4" />
      {isPending ? "Corriendo aggregators..." : "Aggregators (free)"}
    </Button>
  );
}

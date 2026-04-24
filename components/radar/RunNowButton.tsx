"use client";

import { Zap } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { runScoutNow } from "@/app/(main)/radar/actions";

export default function RunNowButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [locked, setLocked] = useState(false);

  function onClick() {
    if (!window.confirm("Gasta ~3 searches de tu quota SerpApi (100/mes free). ¿Continuar?")) {
      return;
    }
    setLocked(true);
    startTransition(async () => {
      const res = await runScoutNow();
      if (res.ok) {
        const s = res.summary;
        toast.success(
          `✓ ${s.newOffers} ofertas nuevas · ${s.duplicates} dups · quota ${s.quotaAfter ?? "?"}`,
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
    <Button size="sm" onClick={onClick} disabled={isPending || locked}>
      <Zap className="size-4" />
      {isPending ? "Corriendo scout..." : "Ejecutar ahora"}
    </Button>
  );
}

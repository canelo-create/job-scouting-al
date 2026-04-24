"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function GenerateCvButton({
  offerId,
  disabledReason,
}: {
  offerId: string;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (disabledReason) {
      toast.error(disabledReason);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/cv/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer_id: offerId, language: "en" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "error");
      toast.success(
        `CV + Cover generados (${
          (data.results?.cv?.tokens ?? 0) + (data.results?.cover_letter?.tokens ?? 0)
        } tokens)`,
      );
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={onClick}
      disabled={loading || Boolean(disabledReason)}
      size="sm"
      title={disabledReason}
    >
      <Sparkles className="size-4" />
      {loading ? "Generando…" : "Adaptar CV + Cover"}
    </Button>
  );
}

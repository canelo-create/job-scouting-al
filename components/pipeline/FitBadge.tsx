import { cn } from "@/lib/utils";
import { FIT_TIER_LABELS, type FitTier } from "@/lib/offers/types";

const TIER_STYLES: Record<FitTier, string> = {
  alto: "bg-fit-alto/15 text-fit-alto ring-fit-alto/30",
  medio: "bg-fit-medio/15 text-fit-medio ring-fit-medio/30",
  bajo: "bg-fit-bajo/15 text-fit-bajo ring-fit-bajo/30",
  descartado: "bg-fit-descartado/15 text-fit-descartado ring-fit-descartado/30",
};

export default function FitBadge({
  tier,
  score,
  className,
}: {
  tier: FitTier | null | undefined;
  score?: number | null;
  className?: string;
}) {
  const t = tier ?? "descartado";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
        TIER_STYLES[t],
        className,
      )}
    >
      {FIT_TIER_LABELS[t]}
      {typeof score === "number" ? <span className="opacity-70">· {score}</span> : null}
    </span>
  );
}

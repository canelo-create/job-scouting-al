import { cn } from "@/lib/utils";
import { STATUS_LABELS, type OfferStatus } from "@/lib/offers/types";

const STATUS_STYLES: Record<OfferStatus, string> = {
  pendiente: "bg-muted text-muted-foreground",
  investigar: "bg-canelo-cyan/15 text-canelo-cyan",
  aplicado: "bg-canelo-orange/15 text-canelo-orange",
  entrevistando: "bg-fit-alto/15 text-fit-alto",
  oferta: "bg-fit-alto/25 text-fit-alto",
  rechazado: "bg-status-danger/15 text-status-danger",
  archivado: "bg-fit-descartado/15 text-fit-descartado",
};

export default function StatusBadge({
  status,
  className,
}: {
  status: OfferStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

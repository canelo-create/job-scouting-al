import Link from "next/link";
import { ExternalLink, MapPin, Building2 } from "lucide-react";
import FitBadge from "./FitBadge";
import StatusBadge from "./StatusBadge";
import type { Offer } from "@/lib/offers/types";

export default function OfferListItem({
  offer,
  companyName,
}: {
  offer: Offer;
  companyName?: string | null;
}) {
  return (
    <Link
      href={`/pipeline/${offer.id}`}
      className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium group-hover:text-primary">
            {offer.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {companyName ? (
              <span className="flex items-center gap-1">
                <Building2 className="size-3" />
                {companyName}
              </span>
            ) : null}
            {offer.location ? (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {offer.location}
              </span>
            ) : null}
            {offer.modality ? <span>· {offer.modality}</span> : null}
            {offer.source ? <span>· {offer.source}</span> : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <FitBadge tier={offer.fit_tier} score={offer.fit_score} />
          <StatusBadge status={offer.status} />
        </div>
      </div>
      {offer.why_it_matches ? (
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {offer.why_it_matches}
        </p>
      ) : null}
      {offer.source_url ? (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <ExternalLink className="size-3" />
          <span className="truncate">{offer.source_url}</span>
        </div>
      ) : null}
    </Link>
  );
}

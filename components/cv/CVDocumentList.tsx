import Link from "next/link";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

type Doc = {
  id: string;
  kind: string;
  version: number;
  created_at: string;
};

const KIND_LABELS: Record<string, string> = {
  cv: "CV",
  cover_letter: "Cover letter",
  elevator_pitch: "Elevator pitch",
  email_outreach: "Outreach email",
};

export default function CVDocumentList({ docs }: { docs: Doc[] }) {
  if (docs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aún no hay documentos generados para esta oferta.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {docs.map((d) => (
        <div
          key={d.id}
          className="flex items-center justify-between rounded-md border border-border bg-card p-3 text-sm"
        >
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {KIND_LABELS[d.kind] ?? d.kind} · v{d.version}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {format(new Date(d.created_at), "yyyy-MM-dd HH:mm")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/cv/${d.id}`}>Ver</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`/api/cv/${d.id}/download`}>
                <Download className="size-3" />
                .docx
              </a>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

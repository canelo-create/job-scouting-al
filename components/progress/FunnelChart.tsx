"use client";

type Stage = { label: string; count: number; color: string };

export default function FunnelChart({ stages }: { stages: Stage[] }) {
  const max = Math.max(...stages.map((s) => s.count), 1);
  return (
    <div className="flex flex-col gap-2">
      {stages.map((stage, i) => {
        const widthPct = (stage.count / max) * 100;
        const conversionFromPrev =
          i > 0 && stages[i - 1].count > 0
            ? ((stage.count / stages[i - 1].count) * 100).toFixed(0) + "%"
            : null;
        return (
          <div key={stage.label} className="flex items-center gap-3">
            <div className="w-28 shrink-0 text-xs text-muted-foreground">
              {stage.label}
            </div>
            <div className="relative flex-1">
              <div
                className="flex h-7 items-center justify-end rounded-md px-2 text-xs font-medium"
                style={{
                  width: `${Math.max(widthPct, 8)}%`,
                  background: stage.color,
                  color: "#0b0d10",
                  transition: "width 0.4s ease",
                }}
              >
                {stage.count}
              </div>
            </div>
            <div className="w-12 shrink-0 text-right text-[11px] text-muted-foreground">
              {conversionFromPrev ?? ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}

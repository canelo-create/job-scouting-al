"use client";

import { useEffect, useState } from "react";
import { GRADUATION_DATE, runwayDays, runwayTone } from "@/lib/constants";

const EPOCH = new Date("2026-04-23T00:00:00Z");

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export default function RunwayBanner() {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setDays(runwayDays(GRADUATION_DATE));
    update();
    const id = setInterval(update, 1000 * 60 * 30);
    return () => clearInterval(id);
  }, []);

  if (days === null) {
    return <div className="h-24 rounded-lg border border-border bg-card animate-pulse" />;
  }

  const tone = runwayTone(days);
  const totalDays = Math.max(1, daysBetween(GRADUATION_DATE, EPOCH));
  const pct = Math.min(100, Math.max(0, (days / totalDays) * 100));

  const toneColor =
    tone === "ok"
      ? "bg-fit-alto"
      : tone === "warn"
        ? "bg-fit-medio"
        : "bg-status-danger";

  const toneLabel =
    tone === "ok"
      ? "En ritmo."
      : tone === "warn"
        ? "Aceleramos."
        : "Modo sprint.";

  return (
    <section
      aria-label="Runway hasta graduación"
      className="rounded-lg border border-border bg-card p-4"
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Runway hasta graduación
          </p>
          <p className="font-heading text-2xl font-semibold">
            {days} <span className="text-sm font-normal text-muted-foreground">días</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{toneLabel}</p>
          <p className="text-[11px] text-muted-foreground">Target 20 Jul 2026</p>
        </div>
      </div>
      <div
        role="progressbar"
        aria-valuenow={days}
        aria-valuemin={0}
        aria-valuemax={totalDays}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={`h-full ${toneColor} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </section>
  );
}

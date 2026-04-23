"use client";

type Ring = {
  label: string;
  value: number;
  target: number;
  color: string; // CSS color for stroke
};

export default function WeeklyRings({ rings }: { rings: Ring[] }) {
  return (
    <div className="flex flex-wrap items-center gap-6">
      {rings.map((r) => {
        const pct = Math.min(1, r.target > 0 ? r.value / r.target : 0);
        const size = 96;
        const stroke = 10;
        const radius = (size - stroke) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference * (1 - pct);
        return (
          <div key={r.label} className="flex items-center gap-3">
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                className="text-muted"
                opacity={0.25}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={r.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div>
              <p className="text-xs text-muted-foreground">{r.label}</p>
              <p className="font-heading text-2xl font-semibold">
                {r.value}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / {r.target}
                </span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

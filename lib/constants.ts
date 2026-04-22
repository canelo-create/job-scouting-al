export const APP_NAME = "Job Scouting AL";
export const APP_SHORT = "Job Scouting";
export const OWNER_NAME = "Andrés Lince García";
export const OWNER_NICK = "Canelo";

export const GRADUATION_DATE = new Date("2026-07-20T12:00:00Z");
export const BRIDGE_TARGET_DATE = new Date("2026-07-31T12:00:00Z");

export type NavItem = {
  href: string;
  label: string;
  icon:
    | "LayoutDashboard"
    | "Kanban"
    | "Radar"
    | "Calendar"
    | "Target"
    | "FileText"
    | "Settings";
};

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Tablero", icon: "LayoutDashboard" },
  { href: "/pipeline", label: "Pipeline", icon: "Kanban" },
  { href: "/radar", label: "Radar", icon: "Radar" },
  { href: "/calendario", label: "Calendario", icon: "Calendar" },
  { href: "/progreso", label: "Progreso", icon: "Target" },
  { href: "/cv", label: "CV", icon: "FileText" },
  { href: "/ajustes", label: "Ajustes", icon: "Settings" },
];

export function runwayDays(target: Date = GRADUATION_DATE, from: Date = new Date()): number {
  const ms = target.getTime() - from.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function runwayTone(days: number): "ok" | "warn" | "danger" {
  if (days > 60) return "ok";
  if (days > 30) return "warn";
  return "danger";
}

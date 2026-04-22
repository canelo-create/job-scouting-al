"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Kanban,
  Radar,
  Calendar,
  Target,
  FileText,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { NAV_ITEMS, type NavItem } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<NavItem["icon"], LucideIcon> = {
  LayoutDashboard,
  Kanban,
  Radar,
  Calendar,
  Target,
  FileText,
  Settings,
};

export default function SideNav() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden md:flex md:w-56 shrink-0 flex-col gap-1 border-r border-border bg-card p-4">
        <div className="mb-4 px-2">
          <p className="font-heading text-sm font-semibold">
            <span className="text-canelo-orange">Job Scouting</span>
            <span className="text-muted-foreground"> AL</span>
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Portal privado
          </p>
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </aside>

      <nav
        aria-label="Navegación principal"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around border-t border-border bg-card px-1 py-1.5"
      >
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1 text-[10px]",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

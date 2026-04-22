import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "primary" | "success" | "warn" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "text-foreground",
  primary: "text-canelo-orange",
  success: "text-fit-alto",
  warn: "text-fit-medio",
  danger: "text-status-danger",
};

export default function DashboardCard({
  title,
  value,
  hint,
  href,
  icon: Icon,
  tone = "neutral",
}: {
  title: string;
  value: string | number;
  hint?: string;
  href?: string;
  icon?: LucideIcon;
  tone?: Tone;
}) {
  const inner = (
    <Card size="sm" className="h-full transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
          {Icon ? <Icon className="size-4" /> : null}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("font-heading text-2xl font-semibold", TONE_CLASSES[tone])}>
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

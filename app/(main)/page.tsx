import {
  Radar,
  Kanban,
  CalendarDays,
  Flame,
  Activity,
  MessageSquare,
} from "lucide-react";
import DashboardCard from "@/components/common/DashboardCard";
import RunwayBanner from "@/components/layout/RunwayBanner";

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">Tablero</h2>
        <p className="text-sm text-muted-foreground">
          Resumen de hoy. Entrar a cada módulo para detalle.
        </p>
      </div>

      <RunwayBanner />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Radar hoy"
          value="—"
          hint="Aún no hay scrapes. El primer cron corre mañana 08:00 CET."
          href="/radar"
          icon={Radar}
        />
        <DashboardCard
          title="Pipeline activo"
          value="0"
          hint="Aplicado + entrevistando"
          href="/pipeline"
          icon={Kanban}
          tone="primary"
        />
        <DashboardCard
          title="Próximo evento"
          value="—"
          hint="Sin entrevistas agendadas"
          href="/calendario"
          icon={CalendarDays}
        />
        <DashboardCard
          title="Streak"
          value="0"
          hint="Días seguidos con actividad"
          href="/progreso"
          icon={Flame}
          tone="warn"
        />
        <DashboardCard
          title="Quota SerpApi"
          value="—"
          hint="Configurá SERPAPI_KEY para ver uso mensual"
          icon={Activity}
        />
        <DashboardCard
          title="Nota Cowork"
          value="Sin notas"
          hint="Cowork dejará notas vía /api/admin/intel"
          icon={MessageSquare}
        />
      </div>
    </div>
  );
}

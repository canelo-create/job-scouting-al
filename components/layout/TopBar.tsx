import { OWNER_NICK } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function TopBar() {
  const configured = isSupabaseConfigured();
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-card/60 px-4 py-3 backdrop-blur-sm md:px-6">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          <span className="text-canelo-orange">Hola, {OWNER_NICK}</span>
        </p>
        <p className="text-[11px] text-muted-foreground">
          {configured ? "Portal en modo producción" : "Modo dev · sin Supabase"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={
            "inline-flex size-2 rounded-full " +
            (configured ? "bg-fit-alto" : "bg-fit-medio")
          }
          aria-hidden
        />
      </div>
    </header>
  );
}

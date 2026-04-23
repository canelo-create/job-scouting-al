import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createOffer } from "../actions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function NewOfferPage() {
  async function action(formData: FormData) {
    "use server";
    const res = await createOffer(formData);
    if (res.ok) redirect(`/pipeline/${res.id}`);
    // TODO surface errors via flash; for now, redirect back
    redirect("/pipeline?error=" + encodeURIComponent(res.error));
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">Nueva oferta</h2>
          <p className="text-sm text-muted-foreground">
            Manual entry. El scoring se calcula automáticamente al guardar.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/pipeline">Cancelar</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la oferta</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="flex flex-col gap-4">
            <Field label="Título" name="title" required placeholder="Strategy Associate" />
            <Field label="Empresa" name="company" required placeholder="Globant" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Ubicación" name="location" placeholder="Madrid, España" />
              <Field label="País" name="country" placeholder="ES" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground" htmlFor="modality">
                  Modalidad
                </label>
                <select
                  id="modality"
                  name="modality"
                  defaultValue="unknown"
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="unknown">—</option>
                  <option value="remoto">Remoto</option>
                  <option value="hibrido">Híbrido</option>
                  <option value="hibrido-remoto">Híbrido / Remoto</option>
                  <option value="presencial">Presencial</option>
                </select>
              </div>
              <Field label="Fuente" name="source" placeholder="linkedin, infojobs, manual" defaultValue="manual" />
            </div>
            <Field label="URL de la oferta" name="source_url" type="url" placeholder="https://..." />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="description">
                Descripción (opcional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                className="rounded-md border border-border bg-background p-3 text-sm"
                placeholder="Copy del job description o notas propias..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/pipeline">Cancelar</Link>
              </Button>
              <Button type="submit" size="sm">
                Guardar y calcular score
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  placeholder,
  type,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground" htmlFor={name}>
        {label}
        {required ? " *" : ""}
      </label>
      <Input
        id={name}
        name={name}
        type={type ?? "text"}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
    </div>
  );
}

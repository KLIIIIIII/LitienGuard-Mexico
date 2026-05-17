import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Pill, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import { decryptField } from "@/lib/encryption";
import { RecetaActions } from "./receta-actions";

export const metadata: Metadata = {
  title: "Receta — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_META: Record<
  string,
  { label: string; cls: string; icon: typeof Pencil }
> = {
  borrador: {
    label: "Borrador",
    cls: "bg-warn-soft text-warn border-warn-soft",
    icon: Pencil,
  },
  firmada: {
    label: "Firmada",
    cls: "bg-validation-soft text-validation border-validation-soft",
    icon: CheckCircle2,
  },
  anulada: {
    label: "Anulada",
    cls: "bg-rose-soft text-rose border-rose-soft",
    icon: XCircle,
  },
};

export default async function RecetaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: recetaRaw } = await supa
    .from("recetas")
    .select("*")
    .eq("id", id)
    .single();
  if (!recetaRaw) notFound();

  const { data: itemsRaw } = await supa
    .from("recetas_items")
    .select("*")
    .eq("receta_id", id)
    .order("orden");

  // Descifrar TODOS los campos clínicos / PII en paralelo. Filas
  // legacy pasan sin tocar (decryptField hace passthrough).
  const [
    pacienteNombre,
    apellidoPaterno,
    apellidoMaterno,
    diagnostico,
    diagnosticoCie10,
    indicacionesGenerales,
    observaciones,
    motivoAnulacion,
  ] = await Promise.all([
    decryptField(recetaRaw.paciente_nombre),
    decryptField(recetaRaw.paciente_apellido_paterno),
    decryptField(recetaRaw.paciente_apellido_materno),
    decryptField(recetaRaw.diagnostico),
    decryptField(recetaRaw.diagnostico_cie10),
    decryptField(recetaRaw.indicaciones_generales),
    decryptField(recetaRaw.observaciones),
    decryptField(recetaRaw.motivo_anulacion),
  ]);

  const receta = {
    ...recetaRaw,
    paciente_nombre: pacienteNombre ?? "",
    paciente_apellido_paterno: apellidoPaterno,
    paciente_apellido_materno: apellidoMaterno,
    diagnostico: diagnostico ?? "",
    diagnostico_cie10: diagnosticoCie10,
    indicaciones_generales: indicacionesGenerales,
    observaciones: observaciones,
    motivo_anulacion: motivoAnulacion,
  };

  const items = itemsRaw
    ? await Promise.all(
        itemsRaw.map(async (it) => {
          const [
            medicamento,
            presentacion,
            dosis,
            frecuencia,
            duracion,
            via,
            indicaciones,
          ] = await Promise.all([
            decryptField(it.medicamento),
            decryptField(it.presentacion),
            decryptField(it.dosis),
            decryptField(it.frecuencia),
            decryptField(it.duracion),
            decryptField(it.via_administracion),
            decryptField(it.indicaciones),
          ]);
          return {
            ...it,
            medicamento: medicamento ?? "",
            presentacion,
            dosis,
            frecuencia,
            duracion,
            via_administracion: via,
            indicaciones,
          };
        }),
      )
    : null;

  const status = STATUS_META[receta.status] ?? STATUS_META.borrador;
  const Icon = status.icon;
  const fullName = [
    receta.paciente_nombre,
    receta.paciente_apellido_paterno,
    receta.paciente_apellido_materno,
  ]
    .filter(Boolean)
    .join(" ");
  const fecha = new Date(receta.fecha_emision ?? receta.created_at);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/recetas"
          className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
          Volver a recetas
        </Link>
      </div>

      <header className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow tone="validation">Receta</Eyebrow>
          <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            {fullName}
          </h1>
          <p className="mt-1 text-caption text-ink-muted">
            Emitida{" "}
            {fecha.toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-caption font-semibold ${status.cls}`}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
          {status.label}
        </span>
      </header>

      <div className="lg-card space-y-3">
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
          Diagnóstico
        </h2>
        <p className="text-body text-ink-strong">{receta.diagnostico}</p>
        {receta.diagnostico_cie10 && (
          <p className="text-caption text-ink-muted">
            CIE-10:{" "}
            <span className="font-mono text-ink-strong">
              {receta.diagnostico_cie10}
            </span>
          </p>
        )}
      </div>

      <div className="lg-card space-y-4">
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
          Medicamentos ({items?.length ?? 0})
        </h2>

        <ol className="space-y-3">
          {(items ?? []).map((it) => (
            <li
              key={it.id}
              className="rounded-lg border border-line bg-surface-alt p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-validation-soft text-caption font-semibold text-validation">
                  {it.orden}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-semibold text-ink-strong">
                    {it.medicamento}
                    {it.presentacion ? ` · ${it.presentacion}` : ""}
                  </p>
                  <div className="mt-1.5 grid gap-1 text-caption text-ink-muted sm:grid-cols-2">
                    {it.dosis && (
                      <p>
                        <span className="text-ink-soft">Dosis:</span> {it.dosis}
                      </p>
                    )}
                    {it.frecuencia && (
                      <p>
                        <span className="text-ink-soft">Frecuencia:</span>{" "}
                        {it.frecuencia}
                      </p>
                    )}
                    {it.duracion && (
                      <p>
                        <span className="text-ink-soft">Duración:</span>{" "}
                        {it.duracion}
                      </p>
                    )}
                    {it.via_administracion && (
                      <p>
                        <span className="text-ink-soft">Vía:</span>{" "}
                        {it.via_administracion}
                      </p>
                    )}
                  </div>
                  {it.indicaciones && (
                    <p className="mt-2 text-caption text-ink-muted italic">
                      «{it.indicaciones}»
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {receta.indicaciones_generales && (
        <div className="lg-card space-y-2">
          <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
            Indicaciones generales
          </h2>
          <p className="text-body-sm text-ink-strong whitespace-pre-wrap">
            {receta.indicaciones_generales}
          </p>
        </div>
      )}

      {receta.status === "anulada" && receta.motivo_anulacion && (
        <div className="lg-card border-rose-soft">
          <h2 className="text-h3 font-semibold tracking-tight text-rose">
            Receta anulada
          </h2>
          <p className="mt-2 text-body-sm text-ink-strong">
            <span className="text-ink-muted">Motivo:</span>{" "}
            {receta.motivo_anulacion}
          </p>
        </div>
      )}

      <RecetaActions recetaId={id} status={receta.status} />

      <p className="text-caption text-ink-soft leading-relaxed max-w-prose">
        <Pill className="inline h-3.5 w-3.5 mr-1 text-ink-quiet" strokeWidth={2.2} />
        Esta receta se conserva por 5 años conforme a la NOM-024-SSA3-2012.
        Las recetas firmadas no se pueden borrar — si necesitas dejarla sin
        efecto, anúlala con un motivo.
      </p>
    </div>
  );
}

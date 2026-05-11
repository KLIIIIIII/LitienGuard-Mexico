import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import { NoteStatusBadge } from "@/components/note-status-badge";
import { SoapEditor } from "./soap-editor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nota SOAP",
  robots: { index: false, follow: false },
};

type Nota = {
  id: string;
  medico_id: string;
  paciente_iniciales: string | null;
  paciente_nombre: string | null;
  paciente_apellido_paterno: string | null;
  paciente_apellido_materno: string | null;
  paciente_edad: number | null;
  paciente_sexo: string | null;
  audio_filename: string | null;
  transcripcion: string | null;
  soap_subjetivo: string | null;
  soap_objetivo: string | null;
  soap_analisis: string | null;
  soap_plan: string | null;
  soap_metadata: {
    rag_keywords?: string[];
    rag_chunks_used?: string[];
    rag_citas_modelo?: string[];
  } | null;
  status: "borrador" | "firmada" | "descartada";
  created_at: string;
  updated_at: string;
};

export default async function NotaPage({
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

  const { data: nota } = await supa
    .from("notas_scribe")
    .select(
      "id,medico_id,paciente_iniciales,paciente_nombre,paciente_apellido_paterno,paciente_apellido_materno,paciente_edad,paciente_sexo,audio_filename,transcripcion,soap_subjetivo,soap_objetivo,soap_analisis,soap_plan,soap_metadata,status,created_at,updated_at",
    )
    .eq("id", id)
    .single();

  if (!nota) notFound();
  const n = nota as Nota;

  const fullName = [
    n.paciente_nombre,
    n.paciente_apellido_paterno,
    n.paciente_apellido_materno,
  ]
    .filter((v): v is string => Boolean(v && v.trim()))
    .join(" ");
  const identifier = fullName || n.paciente_iniciales || "Sin nombre";
  const ctx = [
    identifier,
    n.paciente_edad != null ? `${n.paciente_edad} años` : null,
    n.paciente_sexo === "F"
      ? "Femenino"
      : n.paciente_sexo === "M"
        ? "Masculino"
        : n.paciente_sexo === "O"
          ? "Otro"
          : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      <div>
        <Link
          href="/dashboard/notas"
          className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a mis notas
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Eyebrow tone="accent">Nota SOAP</Eyebrow>
            <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
              {ctx || "Consulta sin contexto"}
            </h1>
            <p className="mt-2 text-body-sm text-ink-muted">
              Creada{" "}
              {new Date(n.created_at).toLocaleString("es-MX", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {n.audio_filename ? ` · ${n.audio_filename}` : ""}
            </p>
          </div>
          <NoteStatusBadge status={n.status} />
        </div>

        <div className="mt-8 max-w-3xl">
          <SoapEditor
            notaId={n.id}
            initial={{
              soap_subjetivo: n.soap_subjetivo ?? "",
              soap_objetivo: n.soap_objetivo ?? "",
              soap_analisis: n.soap_analisis ?? "",
              soap_plan: n.soap_plan ?? "",
            }}
            initialStatus={n.status}
            readOnly={n.status === "firmada"}
          />
        </div>

        {(n.soap_metadata?.rag_chunks_used?.length ?? 0) > 0 && (
          <section className="mt-10 max-w-3xl">
            <h2 className="text-h3 font-semibold text-ink-strong">
              Fuentes consultadas
            </h2>
            <p className="mt-1 text-caption text-ink-muted">
              El asistente revisó estas guías al proponer análisis y plan. Las
              sugerencias son herramientas: la decisión clínica es tuya.
            </p>
            <ul className="mt-3 space-y-2">
              {n.soap_metadata?.rag_chunks_used?.map((c, i) => (
                <li
                  key={`${c}-${i}`}
                  className="flex items-start gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-body-sm text-ink-strong"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-validation-soft text-caption font-semibold text-validation">
                    {i + 1}
                  </span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            {(n.soap_metadata?.rag_keywords?.length ?? 0) > 0 && (
              <p className="mt-3 text-caption text-ink-soft">
                Conceptos clínicos detectados:{" "}
                {n.soap_metadata?.rag_keywords?.join(" · ")}
              </p>
            )}
          </section>
        )}

        {n.transcripcion && (
          <details className="mt-10 max-w-3xl">
            <summary className="cursor-pointer text-caption font-medium text-ink-muted hover:text-ink-strong">
              Ver transcripción completa
            </summary>
            <div className="mt-3 whitespace-pre-wrap rounded-lg border border-line bg-surface-alt px-4 py-3 text-body-sm leading-relaxed text-ink-muted">
              {n.transcripcion}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

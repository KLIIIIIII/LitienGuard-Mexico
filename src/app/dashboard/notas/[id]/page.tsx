import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import { NoteStatusBadge } from "@/components/note-status-badge";
import { PatientHeader } from "@/components/clinical";
import { SoapEditor } from "./soap-editor";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { decryptField } from "@/lib/encryption";

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
    rag_memoria_usada?: string[];
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

  // Descifrar contenido clínico (Fase B). decryptField devuelve tal
  // cual los valores legacy sin cifrar, así que es seguro en migración.
  const n = {
    ...nota,
    transcripcion: await decryptField(nota.transcripcion),
    soap_subjetivo: await decryptField(nota.soap_subjetivo),
    soap_objetivo: await decryptField(nota.soap_objetivo),
    soap_analisis: await decryptField(nota.soap_analisis),
    soap_plan: await decryptField(nota.soap_plan),
  } as Nota;

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const canSendToDiferencial =
    canUseCerebro(tier) &&
    Boolean(
      (n.soap_subjetivo && n.soap_subjetivo.trim().length >= 20) ||
        (n.soap_objetivo && n.soap_objetivo.trim().length >= 20) ||
        (n.transcripcion && n.transcripcion.trim().length >= 20),
    );

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
    <>
      <PatientHeader
        iniciales={n.paciente_iniciales}
        nombre={fullName || null}
        edad={n.paciente_edad}
        sexo={
          n.paciente_sexo === "M"
            ? "M"
            : n.paciente_sexo === "F"
              ? "F"
              : null
        }
        mrn={`NOTA-${n.id.slice(0, 6).toUpperCase()}`}
        compact
      />

      <div className="pt-2">
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
          <div className="flex flex-col items-end gap-2">
            <NoteStatusBadge status={n.status} />
            {canSendToDiferencial && (
              <Link
                href={`/dashboard/diferencial?from_nota=${n.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-validation-soft bg-validation-soft px-3 py-1.5 text-caption font-semibold text-validation hover:bg-validation hover:text-surface transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
                Analizar en diferencial
              </Link>
            )}
          </div>
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

        {((n.soap_metadata?.rag_chunks_used?.length ?? 0) > 0 ||
          (n.soap_metadata?.rag_memoria_usada?.length ?? 0) > 0) && (
          <section className="mt-10 max-w-3xl">
            <h2 className="text-h3 font-semibold text-ink-strong">
              Fuentes consultadas
            </h2>
            <p className="mt-1 text-caption text-ink-muted">
              El asistente revisó estas referencias al proponer análisis y
              plan. Las sugerencias son herramientas: la decisión clínica es
              tuya.
            </p>

            {(n.soap_metadata?.rag_chunks_used?.length ?? 0) > 0 && (
              <>
                <p className="mt-4 text-caption font-medium uppercase tracking-eyebrow text-ink-muted">
                  Guías oficiales
                </p>
                <ul className="mt-2 space-y-2">
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
              </>
            )}

            {(n.soap_metadata?.rag_memoria_usada?.length ?? 0) > 0 && (
              <>
                <p className="mt-4 text-caption font-medium uppercase tracking-eyebrow text-ink-muted">
                  Patrón propio · notas previas firmadas
                </p>
                <ul className="mt-2 space-y-2">
                  {n.soap_metadata?.rag_memoria_usada?.map((m, i) => (
                    <li
                      key={`mem-${i}`}
                      className="flex items-start gap-2 rounded-lg border border-accent-soft bg-accent-soft/40 px-4 py-2 text-body-sm text-ink-strong"
                    >
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-caption font-semibold text-surface">
                        P{i + 1}
                      </span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-caption text-ink-soft">
                  Referencia secundaria basada en tus notas firmadas — no
                  sustituye una guía clínica.
                </p>
              </>
            )}

            {(n.soap_metadata?.rag_keywords?.length ?? 0) > 0 && (
              <p className="mt-4 text-caption text-ink-soft">
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
    </>
  );
}

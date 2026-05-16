import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, BarChart3 } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { DiferencialEngine } from "./diferencial-engine";
import { HistorialList } from "./historial-list";
import { PendingOutcomesBanner } from "./pending-outcomes-banner";
import { decryptField } from "@/lib/encryption";

export const metadata: Metadata = {
  title: "Diferencial diagnóstico — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DiferencialPage({
  searchParams,
}: {
  searchParams: Promise<{ from_nota?: string; consulta_id?: string }>;
}) {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;

  const params = await searchParams;
  let initialClinicalText: string | undefined;
  let fromNotaContext: {
    iniciales: string | null;
    edad: number | null;
    sexo: "M" | "F" | "O" | null;
  } | null = null;

  if (params.from_nota && canUseCerebro(tier)) {
    const { data: nota } = await supa
      .from("notas_scribe")
      .select(
        "paciente_iniciales,paciente_edad,paciente_sexo,soap_subjetivo,soap_objetivo,soap_analisis,transcripcion",
      )
      .eq("id", params.from_nota)
      .eq("medico_id", user.id)
      .single();
    if (nota) {
      // Descifrar contenido clínico (Fase B)
      const [subjetivo, objetivo, analisis, transcripcion] =
        await Promise.all([
          decryptField(nota.soap_subjetivo),
          decryptField(nota.soap_objetivo),
          decryptField(nota.soap_analisis),
          decryptField(nota.transcripcion),
        ]);
      const parts: string[] = [];
      if (subjetivo?.trim()) {
        parts.push(`[Subjetivo]\n${subjetivo.trim()}`);
      }
      if (objetivo?.trim()) {
        parts.push(`[Objetivo]\n${objetivo.trim()}`);
      }
      if (analisis?.trim()) {
        parts.push(`[Análisis]\n${analisis.trim()}`);
      }
      if (parts.length === 0 && transcripcion?.trim()) {
        parts.push(transcripcion.trim());
      }
      const combined = parts.join("\n\n").slice(0, 8000);
      if (combined.length >= 20) {
        initialClinicalText = combined;
        fromNotaContext = {
          iniciales: nota.paciente_iniciales ?? null,
          edad: nota.paciente_edad ?? null,
          sexo:
            (nota.paciente_sexo as "M" | "F" | "O" | null) ?? null,
        };
      }
    }
  }

  if (!canUseCerebro(tier)) {
    return (
      <div>
        <Eyebrow tone="warn">Plan requerido</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Diferencial diagnóstico — Plan Profesional o superior
        </h1>
        <p className="mt-3 max-w-prose text-body text-ink-muted">
          El motor de inferencia bayesiana multi-señal con cerebro clínico
          curado está incluido en planes Profesional y Clínica.
        </p>
        <Link href="/precios" className="lg-cta-primary mt-6 inline-flex">
          Ver planes
        </Link>
      </div>
    );
  }

  const [{ data: recentSessions, count: totalCount }, { data: pendientesRaw }] =
    await Promise.all([
      supa
        .from("diferencial_sessions")
        .select(
          "id, paciente_iniciales, paciente_edad, contexto_clinico, top_diagnoses, medico_diagnostico_principal, outcome_confirmado, created_at",
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .limit(5),
      supa
        .from("diferencial_pendientes_outcome")
        .select(
          "id, paciente_iniciales, medico_diagnostico_principal, created_at",
        )
        .eq("medico_id", user.id)
        .order("created_at", { ascending: true }),
    ]);

  const ahora = Date.now();
  const pendientes = (pendientesRaw ?? []).map((p) => ({
    id: p.id as string,
    paciente_iniciales: p.paciente_iniciales as string | null,
    medico_diagnostico_principal:
      p.medico_diagnostico_principal as string | null,
    antiguedad_dias: Math.floor(
      (ahora - new Date(p.created_at as string).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  }));

  return (
    <div className="space-y-6">
      {/* Banner Beta — el motor sigue en pruebas, no es decisión final */}
      <div className="flex items-start gap-3 rounded-xl border-2 border-warn-soft bg-warn-soft/40 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warn-soft text-warn font-bold text-caption">
          β
        </div>
        <div className="text-body-sm text-ink-strong">
          <strong className="font-bold">
            Función en beta — usar con discreción clínica.
          </strong>{" "}
          El motor sigue en calibración activa. Las sugerencias son apoyo a
          la decisión, no diagnóstico — siempre validá con tu juicio
          clínico.
        </div>
      </div>

      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Eyebrow tone="validation">Diferencial diagnóstico</Eyebrow>
            <span className="inline-flex items-center gap-1 rounded-full border border-validation-soft bg-validation-soft px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-eyebrow text-validation">
              Calibrado MX
            </span>
          </div>
          <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            Empieza con tu hipótesis, deja que el motor te confronte
          </h1>
          <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
            Escribe el diagnóstico que sospechas y pega el contexto clínico
            del paciente. El motor extrae los hallazgos automáticamente,
            calcula la probabilidad de tu hipótesis con prevalencias
            mexicanas, y te muestra qué otras enfermedades podrían explicar
            lo mismo (anti-anclaje) + qué hallazgos te faltan confirmar.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Link
            href="/dashboard/diferencial/patrones"
            className="group relative inline-flex items-center gap-1.5 rounded-lg border-2 border-validation bg-validation-soft px-3 py-1.5 text-caption font-semibold text-validation transition-all hover:bg-validation hover:text-canvas hover:shadow-md"
          >
            <Sparkles
              className="h-3.5 w-3.5 transition-transform group-hover:scale-110"
              strokeWidth={2.4}
            />
            Patrones
            <span className="ml-1 rounded-full bg-validation px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-canvas group-hover:bg-canvas group-hover:text-validation">
              Nuevo
            </span>
          </Link>
          <Link
            href="/dashboard/diferencial/calidad"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-caption font-semibold text-ink-strong hover:bg-surface-alt transition-colors"
          >
            <BarChart3 className="h-3.5 w-3.5" strokeWidth={2.2} />
            Mi calidad
          </Link>
        </div>
      </header>

      <PendingOutcomesBanner pendientes={pendientes} />

      {recentSessions && recentSessions.length > 0 && (
        <section>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
              Casos guardados recientes
            </h2>
            {(totalCount ?? 0) > 5 && (
              <Link
                href="/dashboard/diferencial/historial"
                className="text-caption font-semibold text-validation hover:underline"
              >
                Ver los {totalCount} casos →
              </Link>
            )}
          </div>
          <HistorialList sessions={recentSessions} compact />
        </section>
      )}

      <section>
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong mb-4">
          {fromNotaContext ? "Caso desde nota SOAP" : "Nuevo caso"}
        </h2>
        <DiferencialEngine
          initialClinicalText={initialClinicalText}
          initialPatient={fromNotaContext ?? undefined}
          consultaId={params.consulta_id ?? null}
        />
      </section>

      <p className="text-caption text-ink-soft leading-relaxed max-w-3xl">
        El motor no diagnostica — orienta y documenta tu razonamiento. Cuando
        te apartes de la sugerencia del top-1, captura el motivo. Esa
        información alimenta el loop de calidad de tu propia práctica y
        eventualmente mejora la calibración de los likelihood ratios para
        casos similares.
      </p>
    </div>
  );
}

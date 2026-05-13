import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { DiferencialEngine } from "./diferencial-engine";
import { HistorialList } from "./historial-list";

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
      const parts: string[] = [];
      if (nota.soap_subjetivo?.trim()) {
        parts.push(`[Subjetivo]\n${nota.soap_subjetivo.trim()}`);
      }
      if (nota.soap_objetivo?.trim()) {
        parts.push(`[Objetivo]\n${nota.soap_objetivo.trim()}`);
      }
      if (nota.soap_analisis?.trim()) {
        parts.push(`[Análisis]\n${nota.soap_analisis.trim()}`);
      }
      if (parts.length === 0 && nota.transcripcion?.trim()) {
        parts.push(nota.transcripcion.trim());
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

  const { data: recentSessions, count: totalCount } = await supa
    .from("diferencial_sessions")
    .select(
      "id, paciente_iniciales, paciente_edad, contexto_clinico, top_diagnoses, medico_diagnostico_principal, outcome_confirmado, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      {/* Banner Beta — el motor sigue en pruebas, no es decisión final */}
      <div className="flex items-start gap-3 rounded-xl border-2 border-warn-soft bg-warn-soft/40 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warn-soft text-warn font-bold text-caption">
          β
        </div>
        <div className="text-body-sm text-ink-strong">
          <strong className="font-bold">
            Función en pruebas — usar con discreción clínica.
          </strong>{" "}
          El motor cubre 28 enfermedades cardiometabólicas; está en
          calibración activa y la cobertura crecerá pronto. Las sugerencias
          son apoyo a la decisión, no diagnóstico — siempre validá con tu
          juicio clínico.
        </div>
      </div>

      <header className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow tone="validation">Diferencial diagnóstico</Eyebrow>
          <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            Empieza con tu hipótesis, deja que el motor te confronte
          </h1>
          <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
            Escribe el diagnóstico que sospechas y pega el contexto clínico
            del paciente. El motor extrae los hallazgos automáticamente,
            calcula la probabilidad bayesiana de tu hipótesis, y te muestra
            qué otras enfermedades podrían explicar lo mismo (anti-anchoring)
            + qué hallazgos te faltan confirmar.
          </p>
        </div>
        <Link
          href="/dashboard/diferencial/calidad"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-caption font-semibold text-ink-strong hover:bg-surface-alt transition-colors"
        >
          Mi calidad →
        </Link>
      </header>

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

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Network,
  Users,
} from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { ClinicalMetric } from "@/components/clinical";
import { decryptField } from "@/lib/encryption";
import {
  detectarCrucesActivos,
  agregarPorSeveridad,
  type CruceDetectado,
} from "@/lib/inference/cruces-detector";
import type { DiseaseId } from "@/lib/inference/types";
import { CrucesHubClient } from "./cruces-hub-client";

export const metadata: Metadata = {
  title: "Cruces clínicos — LitienGuard",
  description:
    "Inteligencia multivariable — cruces de comorbilidad detectados en tus pacientes.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PacienteAgrupado {
  /** Clave interna de agrupación */
  key: string;
  iniciales: string | null;
  edad: number | null;
  sexo: string | null;
  diseaseIds: DiseaseId[];
  findingsLibres: string[];
  ultimaFecha: Date;
  cruces: CruceDetectado[];
}

export default async function CrucesPage() {
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
  if (!canUseCerebro(tier)) {
    return (
      <div className="space-y-3">
        <Eyebrow tone="warn">Plan requerido</Eyebrow>
        <h1 className="text-h1 font-semibold tracking-tight text-ink-strong">
          Cruces clínicos — Plan Profesional o superior
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
          La detección de cruces de comorbilidad usa el cerebro completo
          + motor multivariable. Disponible en el plan Profesional.
        </p>
        <Link href="/precios" className="lg-cta-primary mt-2 inline-flex">
          Ver planes
        </Link>
      </div>
    );
  }

  // Solo sesiones con outcome confirmado o parcial (dx aceptado por el médico)
  const { data: sessionsRaw } = await supa
    .from("diferencial_sessions")
    .select(
      "id, medico_id, paciente_iniciales, paciente_edad, paciente_sexo, contexto_clinico, top_diagnoses, medico_diagnostico_principal, outcome_confirmado, created_at",
    )
    .eq("medico_id", user.id)
    .in("outcome_confirmado", ["confirmado", "parcial"])
    .order("created_at", { ascending: false })
    .limit(500);

  // Descifrar campos texto (Fase D) — AAD = medico_id de la fila
  type SessionRow = NonNullable<typeof sessionsRaw>[number];
  const sessions: SessionRow[] = sessionsRaw
    ? await Promise.all(
        sessionsRaw.map(async (s) => ({
          ...s,
          contexto_clinico: await decryptField(s.contexto_clinico, s.medico_id),
          medico_diagnostico_principal: await decryptField(
            s.medico_diagnostico_principal,
            s.medico_id,
          ),
        })),
      )
    : [];

  // Agrupar por paciente proxy (iniciales + edad + sexo).
  // Limitación conocida: si el médico no anotó iniciales consistentes,
  // el mismo paciente puede aparecer dividido. Esto se mejora en
  // Sprint δ con vinculación a pacientes.id real.
  const porPaciente = new Map<string, PacienteAgrupado>();

  for (const s of sessions) {
    const ini = s.paciente_iniciales ?? "";
    if (!ini.trim()) continue; // sin iniciales no podemos agrupar
    const key = `${ini.toUpperCase().trim()}|${s.paciente_edad ?? "?"}|${
      s.paciente_sexo ?? "?"
    }`;

    let entry = porPaciente.get(key);
    if (!entry) {
      entry = {
        key,
        iniciales: ini,
        edad: s.paciente_edad,
        sexo: s.paciente_sexo,
        diseaseIds: [],
        findingsLibres: [],
        ultimaFecha: new Date(s.created_at),
        cruces: [],
      };
      porPaciente.set(key, entry);
    }

    // Acumular DiseaseId desde top_diagnoses[0] (el motor sugirió + el
    // médico aceptó porque outcome es confirmado/parcial)
    const topDxs = (s.top_diagnoses as Array<{ disease?: string }> | null) ?? [];
    const topId = topDxs[0]?.disease;
    if (topId && !entry.diseaseIds.includes(topId)) {
      entry.diseaseIds.push(topId);
    }

    // contexto_clinico va como finding libre — el médico documentó allí
    // datos como "embarazo 28 sem", "TFG 35", "antraciclinas en curso"
    if (s.contexto_clinico && s.contexto_clinico.trim().length > 0) {
      entry.findingsLibres.push(s.contexto_clinico);
    }
    if (
      s.medico_diagnostico_principal &&
      s.medico_diagnostico_principal.trim().length > 0
    ) {
      entry.findingsLibres.push(s.medico_diagnostico_principal);
    }

    const f = new Date(s.created_at);
    if (f > entry.ultimaFecha) entry.ultimaFecha = f;
  }

  // Detectar cruces por paciente
  const pacientesConCruces: PacienteAgrupado[] = [];
  for (const entry of porPaciente.values()) {
    if (entry.diseaseIds.length < 1) continue;
    const cruces = detectarCrucesActivos(entry.diseaseIds, {
      edad: entry.edad ?? undefined,
      findingsLibres: entry.findingsLibres,
    });
    if (cruces.length > 0) {
      entry.cruces = cruces;
      pacientesConCruces.push(entry);
    }
  }

  // Ordenar pacientes: los que tienen cruces críticos primero, luego por fecha
  pacientesConCruces.sort((a, b) => {
    const aCrit = a.cruces.filter((c) => c.cruce.severidad === "critica").length;
    const bCrit = b.cruces.filter((c) => c.cruce.severidad === "critica").length;
    if (bCrit !== aCrit) return bCrit - aCrit;
    return b.ultimaFecha.getTime() - a.ultimaFecha.getTime();
  });

  // KPIs
  const todasDetecciones = pacientesConCruces.flatMap((p) => p.cruces);
  const severidades = agregarPorSeveridad(todasDetecciones);
  const totalPacientes = pacientesConCruces.length;

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <Eyebrow tone="validation">Inteligencia multivariable</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Cruces clínicos activos en tus pacientes
        </h1>
        <p className="mt-3 text-body text-ink-muted leading-relaxed">
          Detección automática de comorbilidades que disparan recomendaciones
          de manejo basadas en guías internacionales publicadas. Solo se
          consideran diagnósticos que tú ya confirmaste como{" "}
          <em>confirmado</em> o <em>parcial</em> en el diferencial.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-4">
        <ClinicalMetric
          label="Pacientes con cruces"
          value={totalPacientes}
          unit={totalPacientes === 1 ? "paciente" : "pacientes"}
          icon={Users}
        />
        <ClinicalMetric
          label="Críticos"
          value={severidades.critica}
          unit={severidades.critica === 1 ? "cruce" : "cruces"}
          icon={AlertTriangle}
          critical={severidades.critica > 0}
        />
        <ClinicalMetric
          label="Importantes"
          value={severidades.importante}
          unit={severidades.importante === 1 ? "cruce" : "cruces"}
          icon={Network}
        />
        <ClinicalMetric
          label="Informativos"
          value={severidades.informativa}
          unit={severidades.informativa === 1 ? "cruce" : "cruces"}
          icon={Info}
        />
      </section>

      {pacientesConCruces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center">
          <CheckCircle2
            className="mx-auto h-8 w-8 text-validation mb-2"
            strokeWidth={1.6}
          />
          <p className="text-body-sm text-ink-muted max-w-prose mx-auto">
            Sin cruces de comorbilidad detectados entre los diagnósticos
            confirmados de tus pacientes. Cuando registres un caso con
            ≥2 diagnósticos del catálogo, el motor evalúa los cruces
            automáticamente.
          </p>
        </div>
      ) : (
        <CrucesHubClient
          pacientes={pacientesConCruces.map((p) => ({
            key: p.key,
            iniciales: p.iniciales ?? "—",
            edad: p.edad,
            sexo: p.sexo,
            diseaseIds: p.diseaseIds,
            ultimaFechaIso: p.ultimaFecha.toISOString(),
            cruces: p.cruces.map((d) => ({
              id: d.cruce.id,
              nombre: d.cruce.nombre,
              descripcion: d.cruce.descripcion,
              severidad: d.cruce.severidad,
              recomendacion: d.cruce.recomendacion,
              source: d.cruce.source,
              farmacos: d.cruce.farmacos ?? null,
              motivos: d.motivosMatch,
            })),
          }))}
        />
      )}

      <section className="rounded-xl border border-line bg-surface-alt px-5 py-4">
        <p className="text-caption text-ink-muted leading-relaxed max-w-3xl">
          <span className="font-semibold text-ink-strong">Catálogo curado.</span>{" "}
          El motor cruza diagnósticos confirmados con un catálogo de 20
          combinaciones clínicas ancladas a guías internacionales (AHA,
          ESC, KDIGO, ADA, ESMO, NCCN, ACOG, AAN, Endocrine Society, GOLD,
          AGS, SCCM, IDSA, ATA). Cada recomendación incluye su fuente.
          El sistema no diagnostica — orquesta lo que tú ya confirmaste.
        </p>
      </section>
    </div>
  );
}

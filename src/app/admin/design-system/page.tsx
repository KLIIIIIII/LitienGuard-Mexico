import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Activity, Droplet, Wind, HeartPulse } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import {
  PatientHeader,
  ClinicalMetric,
  ClinicalAlert,
  WorkflowStep,
  DataTable,
  StatusBadge,
  TrendChart,
  CodeStatus,
} from "@/components/clinical";

export const metadata: Metadata = {
  title: "Design System v2 — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type DemoPatient = {
  id: string;
  iniciales: string;
  edad: number;
  sexo: "M" | "F";
  motivo: string;
  triage: "rojo" | "naranja" | "amarillo" | "verde";
  tiempo: number;
};

export default async function DesignSystemPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return (
      <div className="lg-shell py-12">
        <p className="text-body text-ink-muted">Solo administradores.</p>
      </div>
    );
  }

  const demoPatients: DemoPatient[] = [
    {
      id: "1",
      iniciales: "J.M.R.",
      edad: 67,
      sexo: "M",
      motivo: "Dolor torácico irradiado, 30 min de evolución",
      triage: "rojo",
      tiempo: 4,
    },
    {
      id: "2",
      iniciales: "L.G.H.",
      edad: 54,
      sexo: "F",
      motivo: "Cefalea súbita máxima intensidad",
      triage: "naranja",
      tiempo: 12,
    },
    {
      id: "3",
      iniciales: "A.P.M.",
      edad: 42,
      sexo: "F",
      motivo: "Fiebre 38.5°C + tos productiva",
      triage: "amarillo",
      tiempo: 28,
    },
    {
      id: "4",
      iniciales: "R.S.J.",
      edad: 31,
      sexo: "M",
      motivo: "Esguince tobillo derecho",
      triage: "verde",
      tiempo: 45,
    },
  ];

  return (
    <>
      <PatientHeader
        iniciales="J.M.R."
        edad={67}
        sexo="M"
        mrn="8472-MX-2026"
        fechaNacimiento="1959-03-12"
        alergias={["Penicilina", "Sulfamidas"]}
        alertasActivas={[
          {
            tipo: "sepsis",
            label: "Sepsis bundle",
            transcurridoMin: 23,
          },
        ]}
      />

      <div className="lg-shell space-y-12 py-8">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
            Volver al dashboard
          </Link>
          <h1 className="mt-4 text-h1 font-semibold tracking-tight text-ink-strong">
            Design System v2 — Showcase
          </h1>
          <p className="mt-2 max-w-prose text-body text-ink-muted">
            Componentes clínicos compartidos del nuevo sistema de diseño.
            Toggle del tema en la esquina superior derecha para ver el modo
            oscuro.
          </p>
        </div>

        {/* ============================== 1. Patient Header */}
        <Section
          title="1. PatientHeader"
          description="Banner persistente con identidad del paciente. Sticky debajo del top-bar global. Cumple HIMSS preservation of context. (Ya visible arriba de esta página.)"
        >
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-caption text-ink-muted">
              ↑ El header rojo de sepsis bundle activo arriba es este
              componente. También se renderiza con datos reales del paciente
              actualmente seleccionado.
            </p>
          </div>
        </Section>

        {/* ============================== 2. ClinicalMetric */}
        <Section
          title="2. ClinicalMetric"
          description="Número grande + label + delta + sparkline. Para flowsheets UCI, dashboards, métricas clínicas. Tabular nums, color semántico para urgencia."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ClinicalMetric
              label="Lactato"
              value="3.2"
              unit="mmol/L"
              delta={0.8}
              deltaInterpretation="bad"
              reference="< 2.0"
              critical
              icon={Activity}
              trend={[1.2, 1.5, 2.1, 2.4, 2.8, 3.0, 3.2]}
              caption="Hace 12 min"
            />
            <ClinicalMetric
              label="FC"
              value="112"
              unit="lpm"
              delta={8}
              deltaInterpretation="bad"
              reference="60–100"
              icon={HeartPulse}
              trend={[88, 95, 102, 108, 110, 112]}
            />
            <ClinicalMetric
              label="MAP"
              value="62"
              unit="mmHg"
              delta={-5}
              deltaInterpretation="bad"
              reference="≥ 65"
              critical
              icon={Droplet}
              trend={[78, 75, 70, 68, 65, 62]}
            />
            <ClinicalMetric
              label="SatO₂"
              value="94"
              unit="%"
              delta={-2}
              deltaInterpretation="bad"
              reference="≥ 95"
              icon={Wind}
              trend={[98, 97, 96, 95, 94]}
            />
          </div>
        </Section>

        {/* ============================== 3. ClinicalAlert */}
        <Section
          title="3. ClinicalAlert"
          description="Banner con severidad. Soporta cita verbatim para contrarrestar automation bias (FDA CDS 2026). Roles ARIA correctos para lectores de pantalla."
        >
          <div className="space-y-3">
            <ClinicalAlert
              severity="critical"
              title="Lactato > 2.0 mmol/L — sospecha de sepsis"
              description="MAP < 65 + lactato 3.2 cumple criterio de shock séptico. Considera iniciar bundle 1-hora."
              cite="Hour-1 Bundle: lactate measurement, blood cultures before antibiotics, broad-spectrum antibiotics within 1 hour."
              action={
                <button className="text-caption font-semibold text-code-red hover:underline">
                  Activar sepsis bundle →
                </button>
              }
            />
            <ClinicalAlert
              severity="warning"
              title="Alergia documentada — penicilinas"
              description="El antibiótico de elección sugerido (piperacilina/tazobactam) contiene betalactámico. Considera carbapenem o aztreonam."
            />
            <ClinicalAlert
              severity="success"
              title="WHO Time-out completo"
              description="5/5 checks críticos + 6/7 extendidos. Compliance 100%."
            />
            <ClinicalAlert
              severity="info"
              title="Patient memory disponible"
              description="Este paciente tiene 3 consultas previas con dx de hipertensión. ¿Revisar historial?"
            />
          </div>
        </Section>

        {/* ============================== 4. WorkflowStep */}
        <Section
          title="4. WorkflowStep"
          description="Paso de protocolo con timer + check + detalle expandible. Cumple AMIA closure + visibility."
        >
          <ol className="space-y-2">
            <WorkflowStep
              number={1}
              title="Medir lactato sérico"
              detail="Si > 2 mmol/L → repetir en 2-4h"
              targetTime="0-15 min"
              completed
              tone="success"
            />
            <WorkflowStep
              number={2}
              title="Hemocultivos × 2 antes de antibiótico"
              detail="No retrasar antibiótico > 45 min para obtenerlos"
              targetTime="0-30 min"
              completed
              tone="success"
            />
            <WorkflowStep
              number={3}
              title="Antibiótico amplio espectro IV"
              detail="Carbapenem o piperacilina/tazobactam + cobertura específica"
              targetTime="≤ 60 min"
              active
              tone="warning"
              expandable={
                <div className="space-y-1">
                  <p className="text-caption text-ink-strong font-semibold">
                    Opciones de primera línea (paciente con alergia a penicilinas):
                  </p>
                  <ul className="space-y-0.5 text-caption text-ink-muted">
                    <li>• Meropenem 1 g IV cada 8h</li>
                    <li>• Aztreonam 2 g IV cada 8h + Vancomicina si MRSA</li>
                  </ul>
                </div>
              }
            />
            <WorkflowStep
              number={4}
              title="Cristaloides 30 mL/kg en 3h si hipotensión"
              detail="Suero fisiológico o Ringer lactato"
              targetTime="≤ 60 min"
              tone="default"
            />
            <WorkflowStep
              number={5}
              title="Norepinefrina si MAP < 65 post-cristaloides"
              detail="Iniciar 0.05-0.1 mcg/kg/min, titular hasta MAP ≥ 65"
              targetTime="Si refractario"
              tone="critical"
            />
          </ol>
        </Section>

        {/* ============================== 5. DataTable */}
        <Section
          title="5. DataTable"
          description="Tabla densa con sticky header, sortable, filas con tono semántico. Patrón Cerner FirstNet tracking board."
        >
          <DataTable
            data={demoPatients}
            getRowKey={(r) => r.id}
            columns={[
              {
                key: "iniciales",
                label: "Paciente",
                render: (r) => (
                  <span className="font-semibold text-ink-strong">
                    {r.iniciales}
                  </span>
                ),
              },
              {
                key: "edad",
                label: "Edad",
                numeric: true,
                render: (r) => `${r.edad}a ${r.sexo}`,
              },
              {
                key: "motivo",
                label: "Motivo",
                width: "w-full",
              },
              {
                key: "triage",
                label: "Triage",
                render: (r) => (
                  <StatusBadge
                    tone={
                      r.triage === "rojo"
                        ? "critical"
                        : r.triage === "naranja" || r.triage === "amarillo"
                          ? "warning"
                          : "success"
                    }
                    pulse={r.triage === "rojo"}
                    size="sm"
                  >
                    {r.triage}
                  </StatusBadge>
                ),
              },
              {
                key: "tiempo",
                label: "Tiempo",
                numeric: true,
                render: (r) => `${r.tiempo} min`,
              },
            ]}
            rowTone={(r) =>
              r.triage === "rojo"
                ? "critical"
                : r.triage === "naranja"
                  ? "warning"
                  : null
            }
          />
        </Section>

        {/* ============================== 6. StatusBadge */}
        <Section
          title="6. StatusBadge"
          description="Pill semántico para estados. Cumple AMIA match (rojo=crítico, ámbar=atención, verde=ok)."
        >
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone="critical" pulse>
              Código rojo
            </StatusBadge>
            <StatusBadge tone="critical">Crítico</StatusBadge>
            <StatusBadge tone="warning">Atención</StatusBadge>
            <StatusBadge tone="success">Estable</StatusBadge>
            <StatusBadge tone="info">Información</StatusBadge>
            <StatusBadge tone="neutral">Neutral</StatusBadge>
            <StatusBadge tone="critical" size="sm">
              SM
            </StatusBadge>
            <StatusBadge tone="success" size="lg">
              Grande
            </StatusBadge>
          </div>
        </Section>

        {/* ============================== 7. TrendChart */}
        <Section
          title="7. TrendChart"
          description="Sparkline mínimo para signos vitales / labs en 24h. SVG puro sin libs. Adapta color al tone."
        >
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                FC (24h)
              </p>
              <p className="mt-1 text-h2 font-bold tabular-nums text-ink-strong">
                112
              </p>
              <div className="mt-2">
                <TrendChart
                  data={[88, 85, 92, 95, 102, 108, 110, 112]}
                  tone="bad"
                  width={200}
                  height={40}
                  showDots
                />
              </div>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                MAP (24h)
              </p>
              <p className="mt-1 text-h2 font-bold tabular-nums text-code-red">
                62
              </p>
              <div className="mt-2">
                <TrendChart
                  data={[80, 78, 75, 72, 70, 68, 65, 62]}
                  tone="critical"
                  width={200}
                  height={40}
                />
              </div>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                Glucosa (24h)
              </p>
              <p className="mt-1 text-h2 font-bold tabular-nums text-ink-strong">
                145
              </p>
              <div className="mt-2">
                <TrendChart
                  data={[180, 160, 150, 140, 135, 140, 145]}
                  tone="good"
                  width={200}
                  height={40}
                />
              </div>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                Plaquetas
              </p>
              <p className="mt-1 text-h2 font-bold tabular-nums text-ink-strong">
                185
              </p>
              <div className="mt-2">
                <TrendChart
                  data={[220, 210, 200, 195, 190, 185]}
                  tone="neutral"
                  width={200}
                  height={40}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* ============================== 8. CodeStatus */}
        <Section
          title="8. CodeStatus"
          description="Indicador de código activo con timer en vivo. Color cambia según % del tiempo objetivo. Cumple AMIA visibility + feedback."
        >
          <div className="grid gap-3 lg:grid-cols-2">
            <CodeStatus
              kind="sepsis"
              startedAt={new Date(Date.now() - 23 * 60 * 1000).toISOString()}
            />
            <CodeStatus
              kind="stroke"
              startedAt={new Date(Date.now() - 52 * 60 * 1000).toISOString()}
            />
            <CodeStatus
              kind="iam"
              startedAt={new Date(Date.now() - 95 * 60 * 1000).toISOString()}
            />
            <CodeStatus
              kind="dka"
              startedAt={new Date(Date.now() - 45 * 60 * 1000).toISOString()}
            />
          </div>
          <div className="mt-4">
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
              Compact mode
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <CodeStatus
                kind="sepsis"
                startedAt={new Date(Date.now() - 23 * 60 * 1000).toISOString()}
                compact
              />
              <CodeStatus
                kind="stroke"
                startedAt={new Date(Date.now() - 52 * 60 * 1000).toISOString()}
                compact
              />
              <CodeStatus
                kind="iam"
                startedAt={new Date(Date.now() - 95 * 60 * 1000).toISOString()}
                compact
              />
            </div>
          </div>
        </Section>

        {/* ============================== Documentación */}
        <Section
          title="Cumplimiento académico"
          description="Cada componente cumple los lineamientos siguientes:"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="text-caption uppercase tracking-eyebrow text-validation font-semibold">
                AMIA 14 principios
              </p>
              <p className="mt-1 text-body-sm text-ink-strong">
                Consistency, visibility, match, minimalism, memory, feedback,
                flexibility, useful messages, error prevention, closure,
                reversibility, language, control, help in context.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="text-caption uppercase tracking-eyebrow text-validation font-semibold">
                HIMSS 9 atributos
              </p>
              <p className="mt-1 text-body-sm text-ink-strong">
                Simplicity, naturalness, consistency, forgiveness & feedback,
                effective language, efficient interactions, info presentation,
                preservation of context, cognitive load.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="text-caption uppercase tracking-eyebrow text-validation font-semibold">
                FDA CDS 2026
              </p>
              <p className="mt-1 text-body-sm text-ink-strong">
                Contrarresta automation bias con cita verbatim, muestra
                incertidumbre, target time visible. Identifica use-related
                hazards desde diseño.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="text-caption uppercase tracking-eyebrow text-validation font-semibold">
                WCAG 2.2 AA
              </p>
              <p className="mt-1 text-body-sm text-ink-strong">
                Contraste 4.5:1 mínimo en body text, focus rings visibles,
                ARIA roles + labels en componentes interactivos, navegación
                con teclado.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="text-caption uppercase tracking-eyebrow text-validation font-semibold">
                Stanford Design for Health
              </p>
              <p className="mt-1 text-body-sm text-ink-strong">
                Metodología Double Diamond: Discover → Define → Develop →
                Deliver con co-design + journey mapping clínico.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="text-caption uppercase tracking-eyebrow text-validation font-semibold">
                NIST Common Industry Format
              </p>
              <p className="mt-1 text-body-sm text-ink-strong">
                Métricas obligatorias para validación: completion rate, time
                to task, error rate, SUS satisfaction score.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
          {title}
        </h2>
        <p className="mt-1 max-w-prose text-body-sm text-ink-muted">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

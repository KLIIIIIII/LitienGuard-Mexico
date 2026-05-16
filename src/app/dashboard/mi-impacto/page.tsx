import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Database,
  Lock,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import { ConsentToggle } from "./consent-toggle";

export const metadata: Metadata = {
  title: "Mi impacto en el cerebro — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function MiImpactoPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: contribData }] = await Promise.all([
    supa
      .from("profiles")
      .select("consent_rwd_aggregated_at")
      .eq("id", user.id)
      .single(),
    supa.rpc("mi_contribucion_rwd"),
  ]);

  const consentAt = (profile?.consent_rwd_aggregated_at ?? null) as
    | string
    | null;
  const consentActive = Boolean(consentAt);

  // mi_contribucion_rwd devuelve table row
  const contrib =
    Array.isArray(contribData) && contribData.length > 0
      ? (contribData[0] as {
          total_casos: number;
          casos_contribuidos: number;
          casos_con_outcome: number;
          fecha_consent: string | null;
        })
      : {
          total_casos: 0,
          casos_contribuidos: 0,
          casos_con_outcome: 0,
          fecha_consent: null,
        };

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
        Volver al dashboard
      </Link>

      <header>
        <Eyebrow tone="validation">Mi impacto en el cerebro</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Tu práctica calibra el cerebro de LATAM.
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted leading-relaxed">
          Cada caso con outcome marcado que tú registras ayuda al cerebro a
          afinar sus likelihood ratios y prevalencias para el médico
          mexicano. Si das tu consentimiento, esos casos (anonimizados, sin
          atribución a ti o a tu paciente) alimentan el dataset agregado
          de LitienGuard que en el mediano plazo se licencia a pharma y
          autoridades sanitarias bajo nuestro modelo Tempus-LATAM.
        </p>
      </header>

      {/* KPIs personales */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="lg-card">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-ink-quiet" strokeWidth={2} />
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
              Tus casos registrados
            </p>
          </div>
          <p className="mt-2 text-h2 font-bold tabular-nums text-ink-strong">
            {contrib.total_casos}
          </p>
          <p className="text-caption text-ink-muted">Total en el sistema</p>
        </div>
        <div className="lg-card">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-validation" strokeWidth={2} />
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
              Con outcome marcado
            </p>
          </div>
          <p className="mt-2 text-h2 font-bold tabular-nums text-ink-strong">
            {contrib.casos_con_outcome}
          </p>
          <p className="text-caption text-ink-muted">
            Casos cerrados con seguimiento
          </p>
        </div>
        <div className="lg-card">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-validation" strokeWidth={2} />
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
              Contribuyendo al RWD
            </p>
          </div>
          <p className="mt-2 text-h2 font-bold tabular-nums text-ink-strong">
            {contrib.casos_contribuidos}
          </p>
          <p className="text-caption text-ink-muted">
            {consentActive
              ? "Casos anonimizados en dataset agregado"
              : "Activa el consentimiento abajo"}
          </p>
        </div>
      </div>

      {/* Consent panel */}
      <section className="lg-card space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-validation-soft text-validation">
            <ShieldCheck className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
              Consentimiento de contribución agregada
            </h2>
            <p className="mt-1 text-caption text-ink-muted leading-relaxed">
              Si activas esta opción, los casos con outcome confirmado/
              refutado/parcial que tú registres se incluyen en el dataset
              agregado de LitienGuard. Tu identidad NO se asocia al dato, y
              los datos del paciente (iniciales, edad, sexo) tampoco salen —
              solo el diagnóstico top-1 y el outcome. Puedes revocar en
              cualquier momento.
            </p>
          </div>
        </div>

        <ConsentToggle
          initialActive={consentActive}
          initialConsentAt={consentAt}
        />

        <div className="border-t border-line pt-4 space-y-3">
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
            Qué SÍ contiene el dataset agregado
          </p>
          <ul className="space-y-1.5 text-caption text-ink-strong">
            <li className="flex items-start gap-2">
              <CheckCircle2
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-validation"
                strokeWidth={2.4}
              />
              Diagnóstico top-1 del motor + outcome (confirmado / refutado /
              parcial)
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-validation"
                strokeWidth={2.4}
              />
              Fecha del caso (mes, no día exacto)
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-validation"
                strokeWidth={2.4}
              />
              Conteos agregados por dx y outcome a nivel plataforma
            </li>
          </ul>

          <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold pt-2">
            Qué NO contiene
          </p>
          <ul className="space-y-1.5 text-caption text-ink-strong">
            <li className="flex items-start gap-2">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose" strokeWidth={2.4} />
              Tu identidad como médico
            </li>
            <li className="flex items-start gap-2">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose" strokeWidth={2.4} />
              Datos del paciente (iniciales, nombre, edad exacta, sexo)
            </li>
            <li className="flex items-start gap-2">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose" strokeWidth={2.4} />
              Contenido clínico (notas, SOAP, findings específicos)
            </li>
            <li className="flex items-start gap-2">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose" strokeWidth={2.4} />
              Asociación entre el dato y tú o tu paciente
            </li>
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface-alt/40 p-5">
        <p className="text-caption text-ink-muted leading-relaxed">
          <strong className="text-ink-strong">Modelo de mediano plazo:</strong>{" "}
          en Fase 3 del roadmap (2029+) LitienGuard licencia el dataset
          agregado RWD a laboratorios farmacéuticos y autoridades
          sanitarias. Los médicos que contribuyen reciben acceso a
          herramientas avanzadas del motor sin costo adicional —
          calibración personalizada por estado, análisis comparativo de
          práctica y, eventualmente, participación en estudios clínicos
          patrocinados. Detalle de modelo de compensación en construcción.
        </p>
      </section>
    </div>
  );
}

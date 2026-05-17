import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  KeyRound,
  Lock,
  Pill,
  Search,
  Server,
  Stethoscope,
  Users,
} from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";

export const metadata: Metadata = {
  title: "Cifrado — LitienGuard",
  description:
    "Cómo se protege cada campo de tu expediente clínico en LitienGuard.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// ----------------------------------------------------------------
// Capas del expediente y su estado de cifrado real (a hoy).
// "vivo" significa que se cifra antes de tocar la base de datos.
// "siguiente" / "planeado" son honestos — no se exhibe lo que aún
// no protegemos como si ya estuviera protegido.
// ----------------------------------------------------------------

type EstadoCifrado = "vivo" | "siguiente" | "planeado";

interface CapaCifrado {
  icon: typeof Lock;
  nombre: string;
  detalle: string;
  estado: EstadoCifrado;
  fase: string;
  desde?: string;
}

const CAPAS: CapaCifrado[] = [
  {
    icon: BookOpen,
    nombre: "Cerebro médico (evidencia)",
    detalle:
      "Guías clínicas, LRs, criterios diagnósticos y citas verbatim del cerebro curado.",
    estado: "vivo",
    fase: "Fase A",
    desde: "Mar 2026",
  },
  {
    icon: FileText,
    nombre: "Notas SOAP del Scribe",
    detalle:
      "Transcripción ambiente + Subjetivo, Objetivo, Análisis y Plan.",
    estado: "vivo",
    fase: "Fase B",
    desde: "Abr 2026",
  },
  {
    icon: Pill,
    nombre: "Recetas y medicamentos",
    detalle:
      "Nombre del paciente, diagnóstico, CIE-10, indicaciones, cada renglón de cada receta.",
    estado: "vivo",
    fase: "Fase C",
    desde: "May 2026",
  },
  {
    icon: Brain,
    nombre: "Diferenciales diagnósticos",
    detalle:
      "Hipótesis bayesianas, razonamiento del médico, override y outcome.",
    estado: "siguiente",
    fase: "Fase D",
  },
  {
    icon: Stethoscope,
    nombre: "Consultas — motivo y notas libres",
    detalle:
      "Motivo de la visita y cualquier texto libre que el médico escriba en la consulta.",
    estado: "siguiente",
    fase: "Fase E",
  },
  {
    icon: Users,
    nombre: "Pacientes, citas y perfil del médico",
    detalle:
      "Padrón identificable: nombre completo, correo, teléfono, dirección. Se cifra con índices HMAC para preservar búsqueda exacta.",
    estado: "planeado",
    fase: "Fase F",
  },
];

const ESTADO_META: Record<
  EstadoCifrado,
  { label: string; cls: string; dotCls: string }
> = {
  vivo: {
    label: "Cifrado",
    cls: "bg-validation-soft text-validation border-validation/40",
    dotCls: "bg-validation",
  },
  siguiente: {
    label: "Próximo",
    cls: "bg-warn-soft text-warn border-warn/40",
    dotCls: "bg-warn",
  },
  planeado: {
    label: "En roadmap",
    cls: "bg-surface-alt text-ink-muted border-line",
    dotCls: "bg-ink-quiet",
  },
};

// ----------------------------------------------------------------
// Changelog técnico — solo eventos reales con commit.
// Si agregas un evento, agrégalo arriba (orden cronológico inverso).
// ----------------------------------------------------------------
const CHANGELOG: Array<{ fecha: string; titulo: string; detalle: string }> = [
  {
    fecha: "2026-05-17",
    titulo: "Fase C · Recetas + items",
    detalle:
      "15 campos (PII + clínicos) cifrados con AES-256-GCM antes de persistir. HMAC determinístico para buscar por paciente.",
  },
  {
    fecha: "2026-04-12",
    titulo: "Fase B · Notas SOAP del Scribe",
    detalle:
      "Transcripción ambiente y los cuatro campos SOAP cifrados en la app. Extracción al cerebro hecha server-side antes de cifrar.",
  },
  {
    fecha: "2026-03-28",
    titulo: "Fase A · Cerebro_chunks + watermark forense",
    detalle:
      "Contenido del cerebro curado cifrado en reposo. Las llaves vivien en Google Cloud KMS con HSM-grade key custody.",
  },
];

const TECH_ROWS: Array<{ icon: typeof Lock; label: string; value: string }> = [
  {
    icon: Lock,
    label: "Algoritmo",
    value: "AES-256-GCM (256-bit, autenticado)",
  },
  {
    icon: KeyRound,
    label: "Custodia de llaves",
    value: "Google Cloud KMS · HSM-grade",
  },
  {
    icon: Search,
    label: "Búsqueda exacta",
    value: "HMAC-SHA256 determinístico",
  },
  {
    icon: Server,
    label: "Aislamiento por médico",
    value: "Row Level Security · auth.uid()",
  },
];

export default async function CifradoPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const vivos = CAPAS.filter((c) => c.estado === "vivo").length;
  const total = CAPAS.length;

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/dashboard/configuracion"
          className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
          Volver a configuración
        </Link>
      </div>

      {/* ============ Hero ============ */}
      <header className="max-w-3xl">
        <Eyebrow tone="validation">Tu información, cifrada</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Cada campo del expediente se cifra antes de tocar nuestra base de
          datos.
        </h1>
        <p className="mt-4 text-body text-ink-muted leading-relaxed">
          Usamos cifrado a nivel de campo con AES-256-GCM y custodia de
          llaves en Google Cloud KMS. La llave maestra nunca sale del HSM y
          la llave de datos se desenvuelve una vez por proceso. Esta página
          documenta — sin marketing — exactamente qué capas del expediente
          ya están protegidas y cuáles vienen en el roadmap.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-validation/40 bg-validation-soft px-3 py-1 text-caption font-semibold text-validation">
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.4} />
            {vivos} de {total} capas en producción
          </span>
          <span className="inline-flex items-center gap-1.5 text-caption text-ink-muted">
            <CalendarClock className="h-3.5 w-3.5" strokeWidth={2} />
            Última actualización · 17 May 2026
          </span>
        </div>
      </header>

      {/* ============ Diagrama envelope encryption ============ */}
      <section className="lg-card overflow-hidden p-0">
        <div className="border-b border-line bg-surface-alt px-6 py-4">
          <p className="text-[0.6rem] uppercase tracking-eyebrow font-semibold text-ink-soft">
            Cómo funciona
          </p>
          <h2 className="mt-1 text-h3 font-semibold tracking-tight text-ink-strong">
            Envelope encryption
          </h2>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_auto_1fr]">
          {/* Etapa 1 — Tu dato */}
          <div className="flex flex-col items-center gap-3 border-b border-line p-6 text-center lg:border-b-0 lg:border-r">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-alt text-ink-strong shadow-soft">
              <FileText className="h-6 w-6" strokeWidth={2} />
            </div>
            <p className="text-[0.6rem] uppercase tracking-eyebrow font-semibold text-ink-soft">
              1 · Tu dato
            </p>
            <p className="text-body-sm font-semibold text-ink-strong">
              Texto clínico en claro
            </p>
            <p className="max-w-xs text-caption text-ink-muted leading-relaxed">
              Lo escribes en la app. Solo existe en plaintext en la memoria
              del servidor durante el procesamiento de tu petición.
            </p>
          </div>

          {/* Etapa 2 — Cifrado */}
          <div className="flex flex-col items-center gap-3 border-b border-line p-6 text-center lg:border-b-0 lg:border-r">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-validation text-canvas shadow-soft">
              <Lock className="h-6 w-6" strokeWidth={2.2} />
              <span
                aria-hidden
                className="absolute inset-0 rounded-2xl border-2 border-validation/40"
              />
            </div>
            <p className="text-[0.6rem] uppercase tracking-eyebrow font-semibold text-ink-soft">
              2 · Cifrado AES-256-GCM
            </p>
            <p className="text-body-sm font-semibold text-ink-strong">
              v1 : iv : auth-tag : ciphertext
            </p>
            <p className="max-w-xs text-caption text-ink-muted leading-relaxed">
              Cada campo se cifra con una llave de datos (DEK) en RAM. El
              IV es único por cada operación. El auth-tag detecta cualquier
              alteración.
            </p>
          </div>

          {/* Etapa 3 — KMS / base */}
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-strong text-canvas shadow-soft">
              <KeyRound className="h-6 w-6" strokeWidth={2} />
            </div>
            <p className="text-[0.6rem] uppercase tracking-eyebrow font-semibold text-ink-soft">
              3 · Llave maestra
            </p>
            <p className="text-body-sm font-semibold text-ink-strong">
              Google Cloud KMS · HSM
            </p>
            <p className="max-w-xs text-caption text-ink-muted leading-relaxed">
              La DEK se envuelve con una llave maestra que nunca sale del
              HSM. Solo se desenvuelve en runtime al iniciar el proceso.
              Sin acceso al HSM, el ciphertext es inservible.
            </p>
          </div>
        </div>

        {/* Banda inferior con flujo */}
        <div className="border-t border-line bg-surface-alt/60 px-6 py-3 text-center">
          <p className="text-caption text-ink-muted">
            <span className="font-semibold text-ink-strong">Plaintext</span>{" "}
            →{" "}
            <span className="font-semibold text-validation">
              AES-256-GCM
            </span>{" "}
            →{" "}
            <span className="font-semibold text-ink-strong">
              ciphertext en BD
            </span>{" "}
            · La llave nunca toca la base.
          </p>
        </div>
      </section>

      {/* ============ Estado por capa ============ */}
      <section>
        <Eyebrow tone="validation">Estado por capa del expediente</Eyebrow>
        <h2 className="mt-3 text-h2 font-semibold tracking-tight text-ink-strong">
          Qué está protegido hoy
        </h2>
        <p className="mt-2 max-w-2xl text-body-sm text-ink-muted">
          Listado transparente: lo que ya se cifra, lo que viene en el
          próximo sprint y lo que está en el roadmap. Nada se exhibe como
          protegido si no lo está.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {CAPAS.map((c) => {
            const Icon = c.icon;
            const meta = ESTADO_META[c.estado];
            return (
              <article
                key={c.nombre}
                className="lg-card flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-ink-strong">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-caption font-semibold ${meta.cls}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${meta.dotCls}`}
                      aria-hidden
                    />
                    {meta.label}
                  </span>
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-ink-strong leading-snug">
                    {c.nombre}
                  </p>
                  <p className="mt-1 text-caption text-ink-muted leading-relaxed">
                    {c.detalle}
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-2 text-[0.6rem] uppercase tracking-eyebrow text-ink-soft">
                  <span className="font-semibold">{c.fase}</span>
                  {c.desde && (
                    <>
                      <span aria-hidden>·</span>
                      <span>desde {c.desde}</span>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ============ Detalle técnico ============ */}
      <section>
        <Eyebrow tone="validation">Detalle técnico</Eyebrow>
        <h2 className="mt-3 text-h2 font-semibold tracking-tight text-ink-strong">
          Cómo está implementado
        </h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {TECH_ROWS.map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.label}
                className="flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3.5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-ink-strong">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[0.6rem] uppercase tracking-eyebrow font-semibold text-ink-soft">
                    {row.label}
                  </p>
                  <p className="mt-0.5 text-body-sm font-semibold text-ink-strong">
                    {row.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ Changelog ============ */}
      <section>
        <Eyebrow tone="validation">Logs de versión</Eyebrow>
        <h2 className="mt-3 text-h2 font-semibold tracking-tight text-ink-strong">
          Bitácora del cifrado
        </h2>

        <ol className="mt-6 space-y-4">
          {CHANGELOG.map((entry, idx) => (
            <li key={entry.fecha} className="relative flex gap-4 pl-2">
              <div className="flex flex-col items-center">
                <span className="flex h-3 w-3 items-center justify-center rounded-full bg-validation shadow-[0_0_0_3px_var(--lg-validation-soft)]" />
                {idx < CHANGELOG.length - 1 && (
                  <span
                    aria-hidden
                    className="mt-1 flex-1 w-px bg-line"
                  />
                )}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 text-[0.6rem] uppercase tracking-eyebrow text-ink-soft">
                  <Clock className="h-3 w-3" strokeWidth={2} />
                  <span className="font-semibold">{entry.fecha}</span>
                </div>
                <p className="mt-1 text-body-sm font-semibold text-ink-strong">
                  {entry.titulo}
                </p>
                <p className="mt-0.5 text-caption text-ink-muted leading-relaxed max-w-2xl">
                  {entry.detalle}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ============ Footnote ============ */}
      <section className="rounded-xl border border-line bg-surface-alt px-5 py-4">
        <p className="text-caption text-ink-muted leading-relaxed max-w-3xl">
          <span className="font-semibold text-ink-strong">
            Recuperación ante desastre.
          </span>{" "}
          Si LitienGuard pierde acceso al HSM en Google Cloud KMS, los
          datos cifrados quedan irrecuperables — esto es por diseño. El
          service account está respaldado en custodia separada. Para
          ejercer tu derecho ARCO (acceso, rectificación, cancelación,
          oposición) sobre tus datos cifrados, escríbenos desde el
          correo registrado en tu cuenta.
        </p>
      </section>
    </div>
  );
}

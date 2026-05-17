import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Eye,
  FileCheck2,
  Lock,
  Pill,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";

export const metadata: Metadata = {
  title: "Protección de datos — LitienGuard",
  description:
    "Cómo se protege la información clínica de tus pacientes en LitienGuard.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Garantia {
  icon: typeof Lock;
  titulo: string;
  detalle: string;
}

const GARANTIAS: Garantia[] = [
  {
    icon: Lock,
    titulo: "Cifrado campo por campo",
    detalle:
      "Cada dato clínico se cifra antes de tocar nuestra base. Aunque alguien accediera al almacenamiento, vería ciphertext inservible.",
  },
  {
    icon: Eye,
    titulo: "Aislamiento por médico",
    detalle:
      "Cada cuenta solo accede a sus propios pacientes, consultas y recetas. La separación se aplica en la base de datos, no solo en la app.",
  },
  {
    icon: FileCheck2,
    titulo: "Bitácora de auditoría",
    detalle:
      "Cada acceso a información clínica queda registrado con fecha, usuario y origen. La bitácora no se puede modificar desde la app.",
  },
  {
    icon: ShieldCheck,
    titulo: "Compliance LFPDPPP y NOM-024-SSA3",
    detalle:
      "Construido siguiendo los requisitos mexicanos para datos personales sensibles y expediente clínico electrónico.",
  },
];

interface SuperficieProtegida {
  icon: typeof BookOpen;
  nombre: string;
  detalle: string;
}

const SUPERFICIES: SuperficieProtegida[] = [
  {
    icon: BookOpen,
    nombre: "Evidencia clínica curada",
    detalle:
      "El conocimiento médico que alimenta al motor diagnóstico.",
  },
  {
    icon: Stethoscope,
    nombre: "Notas SOAP",
    detalle:
      "Transcripción ambiente y los cuatro campos SOAP de cada consulta.",
  },
  {
    icon: Pill,
    nombre: "Recetas y medicamentos",
    detalle:
      "Datos del paciente, diagnóstico, indicaciones y cada renglón prescrito.",
  },
];

export default async function CifradoPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/dashboard/seguridad"
          className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
          Volver a seguridad
        </Link>
      </div>

      <header className="max-w-3xl">
        <Eyebrow tone="validation">Protección de datos clínicos</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          La información de tus pacientes está protegida en cada paso.
        </h1>
        <p className="mt-4 text-body text-ink-muted leading-relaxed">
          LitienGuard cumple con los requisitos de la LFPDPPP y la
          NOM-024-SSA3 para el manejo de información clínica. Esta página
          resume cómo cuidamos los datos que confías a la plataforma —
          sin entrar en detalles operativos que solo serían útiles a un
          atacante.
        </p>
      </header>

      <section>
        <Eyebrow tone="validation">Garantías</Eyebrow>
        <h2 className="mt-3 text-h2 font-semibold tracking-tight text-ink-strong">
          Qué hacemos para protegerte
        </h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {GARANTIAS.map((g) => {
            const Icon = g.icon;
            return (
              <article key={g.titulo} className="lg-card flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-validation-soft text-validation">
                  <Icon className="h-4 w-4" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-ink-strong">
                    {g.titulo}
                  </p>
                  <p className="mt-1 text-caption text-ink-muted leading-relaxed">
                    {g.detalle}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <Eyebrow tone="validation">Información cubierta</Eyebrow>
        <h2 className="mt-3 text-h2 font-semibold tracking-tight text-ink-strong">
          Áreas del expediente con cifrado activo
        </h2>
        <p className="mt-2 max-w-2xl text-body-sm text-ink-muted">
          La protección a nivel de campo se va extendiendo de forma
          continua sobre el expediente. Las áreas que faltan están en
          rollout y se anuncian conforme entran en producción.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {SUPERFICIES.map((s) => {
            const Icon = s.icon;
            return (
              <article key={s.nombre} className="lg-card">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-validation-soft text-validation">
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                  </div>
                  <CheckCircle2
                    className="h-4 w-4 text-validation"
                    strokeWidth={2.4}
                  />
                </div>
                <p className="mt-3 text-body-sm font-semibold text-ink-strong">
                  {s.nombre}
                </p>
                <p className="mt-1 text-caption text-ink-muted leading-relaxed">
                  {s.detalle}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface-alt px-5 py-4">
        <p className="text-caption text-ink-muted leading-relaxed max-w-3xl">
          <span className="font-semibold text-ink-strong">Tus derechos.</span>{" "}
          Puedes ejercer tu derecho ARCO (acceso, rectificación,
          cancelación, oposición) en cualquier momento desde Configuración
          o escribiendo desde el correo registrado en tu cuenta. Los
          detalles técnicos de implementación no se comparten por una
          razón: no le damos mapa a quien quiera atacarnos.
        </p>
      </section>
    </div>
  );
}

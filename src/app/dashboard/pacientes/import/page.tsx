import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileSpreadsheet, Info } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import {
  canUsePacientes,
  type SubscriptionTier,
} from "@/lib/entitlements";
import { ImportForm } from "./import-form";

export const metadata: Metadata = {
  title: "Importar pacientes — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ImportPacientesPage() {
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
  if (!canUsePacientes(tier)) {
    redirect("/dashboard/pacientes");
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard/pacientes"
          className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-ink-strong"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
          Volver al padrón
        </Link>
        <Eyebrow tone="accent" className="mt-3">
          Importar pacientes
        </Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Sube tu agenda en CSV
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
          Carga un archivo .csv con tus pacientes. Verás un preview antes de
          confirmar el import. Los duplicados por correo se actualizan en
          lugar de duplicarse.
        </p>
      </div>

      {/* Formato esperado */}
      <div className="rounded-2xl border border-accent-soft bg-accent-soft/30 p-5">
        <div className="flex items-start gap-3">
          <FileSpreadsheet
            className="mt-0.5 h-5 w-5 text-accent shrink-0"
            strokeWidth={2}
          />
          <div className="min-w-0 flex-1">
            <p className="text-body-sm font-semibold text-ink-strong">
              Columnas que reconocemos
            </p>
            <p className="mt-1 text-caption text-ink-muted leading-relaxed">
              Primera fila como encabezados. Mínimo necesitas{" "}
              <strong>nombre</strong>. Las demás son opcionales:
            </p>
            <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-surface">
              <table className="w-full text-caption">
                <thead className="bg-surface-alt text-ink-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">
                      Columna
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Tipo
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Ejemplo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <Row col="nombre" tipo="texto · requerido" ex="María" />
                  <Row
                    col="apellido_paterno"
                    tipo="texto"
                    ex="González"
                  />
                  <Row
                    col="apellido_materno"
                    tipo="texto"
                    ex="Hernández"
                  />
                  <Row
                    col="email"
                    tipo="correo válido"
                    ex="maria@correo.mx"
                  />
                  <Row col="telefono" tipo="texto" ex="55 1234 5678" />
                  <Row
                    col="fecha_nacimiento"
                    tipo="AAAA-MM-DD"
                    ex="1985-04-12"
                  />
                  <Row col="sexo" tipo="M / F / O" ex="F" />
                  <Row
                    col="ultima_consulta_at"
                    tipo="AAAA-MM-DD"
                    ex="2024-09-15"
                  />
                  <Row
                    col="notas_internas"
                    tipo="texto libre"
                    ex="HTA controlada"
                  />
                  <Row
                    col="etiquetas"
                    tipo="separadas por coma"
                    ex="diabetes, mensual"
                  />
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-start gap-2 text-caption text-ink-muted">
              <Info
                className="mt-0.5 h-3.5 w-3.5 text-accent shrink-0"
                strokeWidth={2}
              />
              <p className="leading-relaxed">
                Acepta delimitadores <code>,</code> o <code>;</code>. Si tu
                archivo viene de Excel y tiene comas dentro de campos,
                guárdalo como CSV UTF-8 desde &ldquo;Guardar como&rdquo; →
                CSV (delimitado por comas).
              </p>
            </div>
          </div>
        </div>
      </div>

      <ImportForm />

      <div className="rounded-xl border border-line bg-surface-alt/50 p-5">
        <p className="text-caption text-ink-muted leading-relaxed">
          <strong className="text-ink-strong">Privacidad y LFPDPPP:</strong>{" "}
          Los datos del padrón viajan cifrados y solo tú (el médico
          autenticado) puedes leerlos. Cada paciente que importes debe haber
          dado consentimiento de tratamiento de datos. Eres responsable de
          mantener tu aviso de privacidad y de respetar bajas a solicitud del
          paciente.
        </p>
      </div>
    </div>
  );
}

function Row({ col, tipo, ex }: { col: string; tipo: string; ex: string }) {
  return (
    <tr>
      <td className="px-3 py-2 font-mono font-semibold text-ink-strong">
        {col}
      </td>
      <td className="px-3 py-2 text-ink-muted">{tipo}</td>
      <td className="px-3 py-2 font-mono text-ink-muted">{ex}</td>
    </tr>
  );
}

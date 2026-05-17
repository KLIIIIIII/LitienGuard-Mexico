import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, FileText, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseRecetas, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { decryptField } from "@/lib/encryption";
import { recordBulkDecryption } from "@/lib/decrypt-monitor";

export const metadata: Metadata = {
  title: "Recetas — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { label: string; cls: string; icon: typeof Pencil }> = {
  borrador: {
    label: "Borrador",
    cls: "bg-warn-soft text-warn",
    icon: Pencil,
  },
  firmada: {
    label: "Firmada",
    cls: "bg-validation-soft text-validation",
    icon: CheckCircle2,
  },
  anulada: {
    label: "Anulada",
    cls: "bg-rose-soft text-rose",
    icon: XCircle,
  },
};

export default async function RecetasPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier,cedula_profesional")
    .eq("id", user.id)
    .single();

  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  if (!canUseRecetas(tier)) {
    return (
      <div>
        <Eyebrow tone="warn">Plan requerido</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Recetas electrónicas — Plan Profesional
        </h1>
        <p className="mt-3 max-w-prose text-body text-ink-muted">
          La generación de recetas electrónicas con formato listo para firma e
          impresión está disponible en los planes Profesional y Clínica.
          Actualiza tu plan para habilitar esta función.
        </p>
        <Link href="/contacto" className="lg-cta-primary mt-6 inline-flex">
          Actualizar plan
        </Link>
      </div>
    );
  }

  const consultorioListo = !!profile?.cedula_profesional;

  const { data: recetasRaw } = await supa
    .from("recetas")
    .select(
      "id,paciente_nombre,paciente_apellido_paterno,diagnostico,status,fecha_emision,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  // Descifrar PII + dx en paralelo. AAD = user.id (médico autenticado;
  // RLS garantiza que solo se ven sus propias filas). decryptField hace
  // passthrough en legacy plaintext y maneja v1/v2 automáticamente.
  const aad = user.id;
  const recetas = recetasRaw
    ? await Promise.all(
        recetasRaw.map(async (r) => ({
          ...r,
          paciente_nombre:
            (await decryptField(r.paciente_nombre, aad)) ?? "",
          paciente_apellido_paterno: await decryptField(
            r.paciente_apellido_paterno,
            aad,
          ),
          diagnostico: (await decryptField(r.diagnostico, aad)) ?? "",
        })),
      )
    : null;

  // Defensa contra exfiltración: registrar descifrado masivo (fire-and-forget).
  if (recetas && recetas.length > 0) {
    void recordBulkDecryption(user.id, "recetas.list", recetas.length);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow tone="validation">Recetas electrónicas</Eyebrow>
          <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            Mis recetas
          </h1>
          <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
            Crea recetas con formato profesional listo para imprimir y firmar.
            Las recetas firmadas se conservan 5 años según la NOM-024-SSA3.
          </p>
        </div>
        <Link
          href="/dashboard/recetas/nueva"
          className="lg-cta-primary shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nueva receta
        </Link>
      </header>

      {!consultorioListo && (
        <div className="rounded-xl border border-warn-soft bg-warn-soft px-5 py-4">
          <p className="text-body-sm font-semibold text-ink-strong">
            Falta registrar tu cédula profesional
          </p>
          <p className="mt-1 text-caption text-ink-muted">
            Para imprimir recetas que cumplan con la NOM-024 necesitas registrar
            tu cédula profesional y los datos del consultorio.
          </p>
          <Link
            href="/dashboard/configuracion"
            className="mt-3 inline-flex text-caption font-semibold text-warn underline"
          >
            Ir a configuración →
          </Link>
        </div>
      )}

      {!recetas || recetas.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center">
          <FileText className="mx-auto h-10 w-10 text-ink-quiet" strokeWidth={1.5} />
          <h2 className="mt-3 text-h3 font-semibold text-ink-strong">
            Aún no has emitido recetas
          </h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Empieza creando tu primera receta desde el botón superior.
          </p>
        </div>
      ) : (
        <>
          {/* MOBILE: cards stacked */}
          <div className="space-y-2.5 md:hidden">
            {recetas.map((r) => {
              const meta = STATUS_LABEL[r.status] ?? STATUS_LABEL.borrador;
              const Icon = meta.icon;
              const fullName = [
                r.paciente_nombre,
                r.paciente_apellido_paterno,
              ]
                .filter(Boolean)
                .join(" ");
              const fecha = new Date(r.fecha_emision ?? r.created_at);
              return (
                <Link
                  key={r.id}
                  href={`/dashboard/recetas/${r.id}`}
                  className="block rounded-xl border border-line bg-surface px-4 py-3.5 transition-colors hover:border-line-strong"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink-strong">
                        {fullName}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-caption text-ink-muted">
                        {r.diagnostico}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-medium ${meta.cls}`}
                    >
                      <Icon className="h-2.5 w-2.5" strokeWidth={2.2} />
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-2 text-[0.65rem] text-ink-soft">
                    {fecha.toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </Link>
              );
            })}
          </div>

          {/* DESKTOP: tabla */}
          <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface md:block">
            <table className="min-w-full divide-y divide-line">
            <thead className="bg-surface-alt">
              <tr>
                <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                  Paciente
                </th>
                <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                  Diagnóstico
                </th>
                <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                  Fecha
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recetas.map((r) => {
                const meta = STATUS_LABEL[r.status] ?? STATUS_LABEL.borrador;
                const Icon = meta.icon;
                const fullName = [r.paciente_nombre, r.paciente_apellido_paterno]
                  .filter(Boolean)
                  .join(" ");
                const fecha = new Date(r.fecha_emision ?? r.created_at);
                return (
                  <tr key={r.id} className="hover:bg-surface-alt">
                    <td className="px-4 py-3 text-body-sm text-ink-strong">
                      {fullName}
                    </td>
                    <td className="px-4 py-3 text-body-sm text-ink-muted">
                      {r.diagnostico.length > 60
                        ? `${r.diagnostico.slice(0, 60)}…`
                        : r.diagnostico}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-medium ${meta.cls}`}
                      >
                        <Icon className="h-3 w-3" strokeWidth={2.2} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-caption text-ink-muted">
                      {fecha.toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/recetas/${r.id}`}
                        className="text-caption font-semibold text-validation underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}

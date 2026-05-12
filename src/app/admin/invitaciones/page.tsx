import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { InviteForm } from "./invite-form";
import { RevokeButton } from "./revoke-button";
import { ApprovePreregistroRow } from "./approve-preregistro-row";
import { TierSelect } from "./tier-select";
import { Eyebrow } from "@/components/eyebrow";
import { type SubscriptionTier } from "@/lib/entitlements";
import { Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InvitacionesPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supa
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") redirect("/dashboard");

  const { data: invitaciones } = await supa
    .from("invitaciones")
    .select(
      "id, email, role, subscription_tier, nombre, hospital, usada, expires_at, created_at",
    )
    .order("created_at", { ascending: false });

  const { data: preregistrosPendientes } = await supa
    .from("preregistros")
    .select("id, email, tipo, nombre, mensaje, created_at")
    .eq("status", "nuevo")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="min-h-[calc(100vh-72px)] bg-canvas">
      <div className="lg-shell py-12 lg:py-16">
        <Eyebrow tone="accent">Admin</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
          Invitaciones al piloto
        </h1>
        <p className="mt-2 max-w-prose text-body text-ink-muted">
          Aprueba solicitudes recibidas o crea invitaciones manuales. Cuando un
          invitado pide su magic link desde /login, el sistema valida contra
          esta tabla.
        </p>

        {/* Solicitudes pendientes (preregistros) */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
                Solicitudes recibidas
              </h2>
              <p className="mt-1 text-body-sm text-ink-muted">
                {preregistrosPendientes?.length ?? 0} sin atender · cada una se
                puede aprobar con un plan asignado o descartar.
              </p>
            </div>
          </div>

          {preregistrosPendientes && preregistrosPendientes.length > 0 ? (
            <div className="mt-5 space-y-3">
              {preregistrosPendientes.map((p) => (
                <ApprovePreregistroRow key={p.id} prereg={p} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-line bg-surface p-8 text-center">
              <Inbox
                className="mx-auto h-8 w-8 text-ink-quiet"
                strokeWidth={1.5}
              />
              <p className="mt-3 text-body-sm text-ink-muted">
                Sin solicitudes nuevas por revisar.
              </p>
            </div>
          )}
        </section>

        {/* Crear invitación manual */}
        <section className="mt-12">
          <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
            Crear invitación manual
          </h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Útil cuando alguien te contacta fuera del formulario público.
          </p>
          <div className="mt-5">
            <InviteForm />
          </div>
        </section>

        <div className="mt-12">
          <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
            Invitaciones activas
          </h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            {invitaciones?.length ?? 0} en total
          </p>

          <div className="mt-5 overflow-hidden rounded-lg border border-line bg-surface">
            <table className="w-full text-body-sm">
              <thead className="bg-surface-alt text-caption uppercase tracking-eyebrow text-ink-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Correo</th>
                  <th className="px-4 py-3 text-left font-medium">Rol</th>
                  <th className="px-4 py-3 text-left font-medium">Plan</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-left font-medium">Expira</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {(invitaciones ?? []).map((i) => {
                  const tier =
                    (i.subscription_tier as SubscriptionTier | null) ?? "pilot";
                  return (
                    <tr
                      key={i.id}
                      className="border-t border-line text-ink-strong"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{i.email}</div>
                        {i.nombre && (
                          <div className="text-caption text-ink-soft">
                            {i.nombre}
                            {i.hospital ? ` · ${i.hospital}` : ""}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 capitalize">{i.role}</td>
                      <td className="px-4 py-3">
                        <TierSelect inviteId={i.id} current={tier} />
                      </td>
                      <td className="px-4 py-3">
                        {i.usada ? (
                          <span className="rounded-full bg-validation-soft px-2 py-0.5 text-caption text-validation">
                            Activada
                          </span>
                        ) : (
                          <span className="rounded-full bg-warn-soft px-2 py-0.5 text-caption text-warn">
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-caption text-ink-muted">
                        {i.expires_at
                          ? new Date(i.expires_at).toLocaleDateString("es-MX")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <RevokeButton id={i.id} disabled={i.usada} />
                      </td>
                    </tr>
                  );
                })}
                {(invitaciones?.length ?? 0) === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-body-sm text-ink-soft"
                    >
                      Aún no hay invitaciones. Crea la primera arriba.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

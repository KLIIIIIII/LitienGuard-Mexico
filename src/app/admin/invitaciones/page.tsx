import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { InviteForm } from "./invite-form";
import { RevokeButton } from "./revoke-button";
import { Eyebrow } from "@/components/eyebrow";
import {
  TIER_LABELS,
  tierBadgeClass,
  type SubscriptionTier,
} from "@/lib/entitlements";

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

  return (
    <main className="min-h-[calc(100vh-72px)] bg-canvas">
      <div className="lg-shell py-12 lg:py-16">
        <Eyebrow tone="accent">Admin</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
          Invitaciones al piloto
        </h1>
        <p className="mt-2 max-w-prose text-body text-ink-muted">
          Agrega los correos que pueden entrar. Cuando el invitado pide su magic
          link desde /login, valida contra esta tabla.
        </p>

        <div className="mt-10">
          <InviteForm />
        </div>

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
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium ${tierBadgeClass(
                            tier,
                          )}`}
                        >
                          {TIER_LABELS[tier]}
                        </span>
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

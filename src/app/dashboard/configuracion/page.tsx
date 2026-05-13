import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Compass,
  CreditCard,
  Lock as LockIcon,
  Download,
  Gift,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { ReplayTutorialButton } from "@/components/replay-tutorial-button";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import { CollectiveToggle } from "./collective-toggle";
import { ConsultorioForm } from "./consultorio-form";
import { BookingForm } from "./booking-form";
import { ProfileTypeForm } from "./profile-type-form";
import { ReplyToForm } from "./reply-to-form";
import { PdfBrandingForm } from "./pdf-branding-form";
import {
  canUseAgenda,
  type SubscriptionTier,
  type ProfileType,
} from "@/lib/entitlements";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Configuración",
  robots: { index: false, follow: false },
};

export default async function ConfiguracionPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select(
      "share_with_collective,nombre,email,role,subscription_tier,profile_type,cedula_profesional,especialidad,consultorio_nombre,consultorio_direccion,consultorio_telefono,accepts_public_bookings,booking_slug,booking_workdays,booking_hour_start,booking_hour_end,booking_slot_minutes,booking_advance_days,booking_bio,recall_reply_to_email,pdf_brand_titulo,pdf_brand_subtitulo",
    )
    .eq("id", user.id)
    .single();

  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const profileType = (profile?.profile_type ?? "sin_definir") as ProfileType;
  const canBookings = canUseAgenda(tier);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://litien-guard-mexico.vercel.app";

  const { count: practiceCount } = await supa
    .from("cerebro_chunks")
    .select("*", { count: "exact", head: true })
    .eq("tipo", "practica_observada")
    .eq("created_by", user.id);

  return (
    <div>
      <div>
        <Eyebrow tone="validation">Configuración</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
          Preferencias de cuenta
        </h1>
        <p className="mt-2 max-w-prose text-body text-ink-muted">
          {profile?.nombre ? `${profile.nombre} · ` : ""}
          {profile?.email}
        </p>

        <div className="mt-10 max-w-3xl space-y-6">
          {/* Atajos a las pages consolidadas dentro de Configuración */}
          <section>
            <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
              Tu cuenta
            </h2>
            <p className="mt-1 text-body-sm text-ink-muted">
              Plan, facturación, seguridad y datos personales.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <CuentaCard
                href="/dashboard/mi-plan"
                icon={Compass}
                label="Mi plan"
                hint="Qué incluye tu tier actual y cómo usarlo"
              />
              <CuentaCard
                href="/dashboard/billing"
                icon={CreditCard}
                label="Facturación"
                hint="Método de pago, recibos, cambiar plan"
              />
              <CuentaCard
                href="/dashboard/seguridad"
                icon={LockIcon}
                label="Seguridad"
                hint="MFA, contraseña, dispositivos conocidos"
              />
              <CuentaCard
                href="/dashboard/exportar"
                icon={Download}
                label="Exportar datos"
                hint="Descarga tu información clínica completa"
              />
              <CuentaCard
                href="/dashboard/referidos"
                icon={Gift}
                label="Refiere y gana"
                hint="Tu código de referidos y comisiones"
              />
              <ReplayTutorialButton />
            </div>
          </section>

          <ProfileTypeForm current={profileType} />

          <ConsultorioForm
            initial={{
              nombre: profile?.nombre ?? null,
              cedula_profesional: profile?.cedula_profesional ?? null,
              especialidad: profile?.especialidad ?? null,
              consultorio_nombre: profile?.consultorio_nombre ?? null,
              consultorio_direccion: profile?.consultorio_direccion ?? null,
              consultorio_telefono: profile?.consultorio_telefono ?? null,
            }}
          />

          {canBookings && (
            <BookingForm
              initial={{
                accepts_public_bookings: profile?.accepts_public_bookings ?? false,
                booking_slug: profile?.booking_slug ?? null,
                booking_workdays: profile?.booking_workdays ?? [1, 2, 3, 4, 5],
                booking_hour_start: profile?.booking_hour_start ?? 9,
                booking_hour_end: profile?.booking_hour_end ?? 18,
                booking_slot_minutes: profile?.booking_slot_minutes ?? 30,
                booking_advance_days: profile?.booking_advance_days ?? 14,
                booking_bio: profile?.booking_bio ?? null,
              }}
              siteUrl={siteUrl.replace(/\/$/, "")}
            />
          )}

          <ReplyToForm
            emailLogin={profile?.email ?? user.email ?? ""}
            current={profile?.recall_reply_to_email ?? null}
          />

          <PdfBrandingForm
            currentTitulo={profile?.pdf_brand_titulo ?? null}
            currentSubtitulo={profile?.pdf_brand_subtitulo ?? null}
            medicoNombre={profile?.nombre ?? null}
            consultorioNombre={profile?.consultorio_nombre ?? null}
          />

          <CollectiveToggle
            initial={profile?.share_with_collective ?? false}
            practiceCount={practiceCount ?? 0}
          />

          <div className="lg-card">
            <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
              Tu rol
            </h2>
            <p className="mt-2 text-body-sm text-ink-muted">
              {profile?.role === "admin"
                ? "Administrador — puedes gestionar invitaciones, curar el cerebro y ver todas las notas."
                : "Médico — puedes crear y firmar tus propias notas SOAP."}
            </p>
          </div>

          <div className="lg-card border-warn-soft" id="arco">
            <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
              Derechos ARCO (LFPDPPP)
            </h2>
            <p className="mt-2 text-body-sm text-ink-muted">
              Acceso · Rectificación · Cancelación · Oposición. Tienes derecho
              de ejercer estas acciones sobre tus datos en cualquier momento.
            </p>
            <ul className="mt-3 space-y-2 text-body-sm text-ink-strong">
              <li>
                <strong>Acceso:</strong> descarga tu información completa desde{" "}
                <a
                  href="/dashboard/exportar"
                  className="text-validation underline"
                >
                  Exportar datos
                </a>
                .
              </li>
              <li>
                <strong>Rectificación:</strong> edita o firma cada nota desde
                Mis notas.
              </li>
              <li>
                <strong>Cancelación:</strong> elimina tu cuenta y todos tus
                datos —{" "}
                <a
                  href="/dashboard/cancelar"
                  className="text-rose underline"
                >
                  ir al flujo de cancelación
                </a>
                .
              </li>
              <li>
                <strong>Oposición:</strong> el opt-out del cerebro colectivo
                ya cumple este derecho parcialmente.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function CuentaCard({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition-colors hover:border-line-strong hover:bg-surface-alt"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-validation-soft text-validation">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body-sm font-semibold text-ink-strong">{label}</p>
        <p className="truncate text-caption text-ink-muted">{hint}</p>
      </div>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-ink-quiet transition-transform group-hover:translate-x-0.5"
        strokeWidth={2}
      />
    </Link>
  );
}

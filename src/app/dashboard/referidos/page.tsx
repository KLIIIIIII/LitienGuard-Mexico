import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Gift, Users, Share2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import { ReferralCard } from "./referral-card";

export const metadata: Metadata = {
  title: "Refiere y gana — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface ReferralRow {
  id: string;
  status: "pending" | "qualified" | "rewarded" | "cancelled";
  created_at: string;
  qualified_at: string | null;
  rewarded_at: string | null;
}

export default async function ReferidosPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select("referral_code, nombre")
    .eq("id", user.id)
    .single();

  let code = profile?.referral_code ?? null;

  // Fallback if trigger missed
  if (!code) {
    const { data: gen } = await supa.rpc("generate_referral_code");
    if (gen) {
      await supa
        .from("profiles")
        .update({ referral_code: gen as string })
        .eq("id", user.id);
      code = gen as string;
    }
  }

  const { data: referrals } = await supa
    .from("referrals")
    .select("id, status, created_at, qualified_at, rewarded_at")
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (referrals ?? []) as ReferralRow[];
  const counts = {
    pending: rows.filter((r) => r.status === "pending").length,
    qualified: rows.filter((r) => r.status === "qualified").length,
    rewarded: rows.filter((r) => r.status === "rewarded").length,
    cancelled: rows.filter((r) => r.status === "cancelled").length,
  };
  const totalActive = counts.pending + counts.qualified + counts.rewarded;
  const monthsEarned = counts.qualified + counts.rewarded;

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow tone="validation">Refiere y gana</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Comparte LitienGuard con colegas
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
          Por cada colega que se suscriba con tu código, ganas{" "}
          <strong>1 mes gratis</strong>. Tu colega obtiene{" "}
          <strong>50% de descuento</strong> los primeros 3 meses.
        </p>
      </header>

      {/* Reward summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          icon={Users}
          label="Referidos totales"
          value={String(totalActive)}
          detail={`${counts.pending} pendientes · ${counts.qualified} activos`}
          iconClass="text-validation"
        />
        <KpiCard
          icon={Gift}
          label="Meses gratis ganados"
          value={String(monthsEarned)}
          detail={
            monthsEarned > 0
              ? "Aplicados en tu siguiente factura"
              : "Aún ninguno"
          }
          iconClass="text-accent"
        />
        <KpiCard
          icon={Share2}
          label="Tu cuota mínima"
          value="2 colegas"
          detail="Reto founding member"
          iconClass="text-warn"
        />
      </div>

      {/* Code card */}
      {code ? (
        <ReferralCard code={code} />
      ) : (
        <div className="lg-card border-rose-soft border-2">
          <p className="text-body-sm text-rose">
            No pudimos generar tu código. Contacta a soporte.
          </p>
        </div>
      )}

      {/* How it works */}
      <section className="lg-card">
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong mb-4">
          Cómo funciona
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              n: "01",
              t: "Comparte tu enlace",
              d: "Mándalo por WhatsApp, LinkedIn o email a colegas con consulta privada.",
            },
            {
              n: "02",
              t: "Tu colega se suscribe",
              d: "Obtiene 50% off los primeros 3 meses en cualquier plan pagado.",
            },
            {
              n: "03",
              t: "Tú ganas un mes gratis",
              d: "Cuando tu colega completa su primer pago, te aplicamos el crédito automáticamente.",
            },
          ].map((step) => (
            <div key={step.n} className="rounded-lg border border-line p-4">
              <p className="font-mono text-caption font-bold text-validation">
                {step.n}
              </p>
              <p className="mt-2 text-body-sm font-semibold text-ink-strong">
                {step.t}
              </p>
              <p className="mt-1 text-caption text-ink-muted leading-relaxed">
                {step.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Referrals list */}
      <section className="lg-card">
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong mb-4">
          Tus referidos
        </h2>
        {rows.length === 0 ? (
          <div className="text-center py-10">
            <Users className="mx-auto h-8 w-8 text-ink-quiet mb-3" strokeWidth={1.5} />
            <p className="text-body-sm font-semibold text-ink-strong">
              Aún no has referido a nadie
            </p>
            <p className="mt-1 text-caption text-ink-muted max-w-xs mx-auto">
              Comparte tu código con colegas — incluso si no se suscriben, plantar la semilla cuenta.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((r, idx) => (
              <ReferralRow key={r.id} row={r} index={idx + 1} />
            ))}
          </div>
        )}
      </section>

      <p className="text-caption text-ink-soft leading-relaxed">
        El crédito se aplica automáticamente cuando tu colega completa el
        primer pago. Si tu plan está al día, el crédito extiende tu fecha
        de renovación. Si tienes saldo pendiente, lo amortiza.
      </p>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  detail,
  iconClass,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  detail: string;
  iconClass: string;
}) {
  return (
    <div className="lg-card">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconClass}`} strokeWidth={2} />
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
          {label}
        </p>
      </div>
      <p className="mt-2 text-h2 font-bold tabular-nums text-ink-strong">
        {value}
      </p>
      <p className="text-caption text-ink-muted">{detail}</p>
    </div>
  );
}

function ReferralRow({ row, index }: { row: ReferralRow; index: number }) {
  const fecha = new Date(row.created_at).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const statusMeta =
    row.status === "qualified" || row.status === "rewarded"
      ? {
          label: "Activo",
          icon: CheckCircle2,
          className: "bg-validation-soft text-validation",
        }
      : row.status === "pending"
        ? {
            label: "Pendiente",
            icon: Clock,
            className: "bg-warn-soft text-warn",
          }
        : {
            label: "Cancelado",
            icon: AlertCircle,
            className: "bg-rose-soft text-rose",
          };
  const Icon = statusMeta.icon;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
      <span className="font-mono text-caption font-bold text-ink-quiet w-6">
        {index.toString().padStart(2, "0")}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium text-ink-strong">
          Médico referido
        </p>
        <p className="text-caption text-ink-muted">Registrado {fecha}</p>
      </div>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-semibold ${statusMeta.className}`}
      >
        <Icon className="h-3 w-3" strokeWidth={2.4} />
        {statusMeta.label}
      </span>
    </div>
  );
}

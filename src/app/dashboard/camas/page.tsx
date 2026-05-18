import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bed } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import {
  canUseHospitalModules,
  type SubscriptionTier,
} from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { BedManagementBoard } from "./bed-management-board";

export const metadata: Metadata = {
  title: "Camas — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface CamaRow {
  id: string;
  label: string;
  modulo: string;
  ala: string | null;
  piso: number | null;
  tipo: string;
  status: "libre" | "ocupada" | "limpieza" | "mantenimiento" | "fuera_servicio";
  encounter_id: string | null;
  encounter?: {
    id: string;
    paciente_id: string | null;
    severidad: string | null;
    motivo_admision: string | null;
    admitted_at: string;
    paciente: {
      nombre: string;
      apellido_paterno: string;
      sexo: "M" | "F" | null;
      fecha_nacimiento: string | null;
    } | null;
  } | null;
}

export default async function CamasPage() {
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

  if (!canUseHospitalModules(tier)) {
    return (
      <div className="space-y-3">
        <Eyebrow tone="warn">Plan requerido</Eyebrow>
        <h1 className="text-h1 font-semibold tracking-tight text-ink-strong">
          Bed Management — Plan Clínica
        </h1>
        <p className="max-w-prose text-body text-ink-muted">
          Gestión de camas hospitalarias en tiempo real con visualización
          de ocupación por área, salas en limpieza/mantenimiento y
          asignación automática a encounters activos.
        </p>
        <Link href="/precios" className="lg-cta-primary mt-2 inline-flex">
          Ver planes
        </Link>
      </div>
    );
  }

  const { data: camasRaw } = await supa
    .from("camas")
    .select(
      "id, label, modulo, ala, piso, tipo, status, encounter_id, encounter:encounters!camas_encounter_id_fkey(id, paciente_id, severidad, motivo_admision, admitted_at, paciente:pacientes!encounters_paciente_id_fkey(nombre, apellido_paterno, sexo, fecha_nacimiento))",
    )
    .eq("user_id", user.id)
    .order("modulo", { ascending: true })
    .order("label", { ascending: true });

  const camas = (camasRaw ?? []) as unknown as CamaRow[];

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
        Volver al dashboard
      </Link>

      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-validation-soft p-1.5 text-validation">
            <Bed className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <Eyebrow tone="validation">Bed Management</Eyebrow>
            <h1 className="mt-1 text-h1 font-semibold tracking-tight text-ink-strong">
              Census global de camas
            </h1>
            <p className="mt-1 text-caption text-ink-muted">
              Mapa en tiempo real de las {camas.length} camas del hospital
              · ocupación por área · estado limpieza/mantenimiento · click
              en cama ocupada para ver el encounter del paciente.
            </p>
          </div>
        </div>
      </header>

      <BedManagementBoard camas={camas} />
    </div>
  );
}

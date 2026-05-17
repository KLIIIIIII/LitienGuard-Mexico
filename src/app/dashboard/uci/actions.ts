"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { UCI_TIPOS } from "@/lib/modulos-eventos";
import { calcularSofa, interpretarSofa } from "@/lib/scores-uci";
import {
  calcularApacheII,
  calcularFastHug,
  evaluarCamIcu,
  type ApacheInput,
  type FastHugInput,
  type CamIcuInput,
} from "@/lib/scores-uci-extended";

const sofaSchema = z.object({
  pacienteIniciales: z.string().max(8).optional(),
  pacienteEdad: z.number().int().min(0).max(120).optional(),
  input: z.object({
    pao2Fio2: z.number().min(0).max(800),
    ventMecanica: z.boolean(),
    plaquetasMil: z.number().min(0).max(2000),
    bilirrubinaMg: z.number().min(0).max(50),
    map: z.number().min(0).max(200),
    dopaminaMcgKgMin: z.number().min(0).max(50),
    dobutaminaActiva: z.boolean(),
    norepinefrinaMcgKgMin: z.number().min(0).max(5),
    adrenalinaMcgKgMin: z.number().min(0).max(5),
    glasgow: z.number().int().min(3).max(15),
    creatininaMg: z.number().min(0).max(20),
    gastoUrinarioMlDia: z.number().min(0).max(10000),
  }),
});

export type ActionResult =
  | { status: "ok"; eventoId: string }
  | { status: "error"; message: string };

export async function registrarSofa(
  input: z.infer<typeof sofaSchema>,
): Promise<ActionResult> {
  const parsed = sofaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  if (!canUseCerebro(tier)) {
    return {
      status: "error",
      message: "Requiere plan Profesional o superior.",
    };
  }

  const subscores = calcularSofa(parsed.data.input);
  const interpretacion = interpretarSofa(subscores.total);

  const { data, error } = await supa
    .from("eventos_modulos")
    .insert({
      user_id: user.id,
      modulo: "uci",
      tipo: UCI_TIPOS.sofa,
      datos: {
        paciente_iniciales: parsed.data.pacienteIniciales ?? null,
        paciente_edad: parsed.data.pacienteEdad ?? null,
        input: parsed.data.input,
        subscores,
        interpretacion,
      },
      status: "completado",
      completed_at: new Date().toISOString(),
      metricas: {
        sofa_total: subscores.total,
        riesgo: interpretacion.riesgo,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: "No se pudo registrar." };
  }

  void recordAudit({
    userId: user.id,
    action: "uci.sofa",
    metadata: {
      sofa_total: subscores.total,
      riesgo: interpretacion.riesgo,
    },
  });

  revalidatePath("/dashboard/uci");
  return { status: "ok", eventoId: data.id };
}

// ===================================================================
// APACHE II — registrar score al ingreso de UCI
// ===================================================================

const apacheSchema = z.object({
  pacienteIniciales: z.string().max(8).optional(),
  pacienteEdad: z.number().int().min(0).max(120).optional(),
  input: z.object({
    tempC: z.number().min(25).max(45),
    map: z.number().min(0).max(250),
    fc: z.number().min(0).max(300),
    fr: z.number().min(0).max(80),
    fio2: z.number().min(0.21).max(1),
    aADO2: z.number().min(0).max(700).optional(),
    pao2: z.number().min(0).max(700).optional(),
    pHArterial: z.number().min(6.8).max(7.8),
    naMeqL: z.number().min(100).max(200),
    kMeqL: z.number().min(1).max(10),
    creatininaMg: z.number().min(0).max(20),
    aki: z.boolean(),
    hto: z.number().min(10).max(70),
    leucosMil: z.number().min(0).max(80),
    glasgow: z.number().int().min(3).max(15),
    edad: z.number().int().min(0).max(120),
    cronicaSevera: z.boolean(),
    noElectivo: z.boolean(),
  }),
});

export async function registrarApacheII(
  input: z.infer<typeof apacheSchema>,
): Promise<ActionResult> {
  const parsed = apacheSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  if (!canUseCerebro(tier)) {
    return { status: "error", message: "Requiere plan Profesional o superior." };
  }

  const resultado = calcularApacheII(parsed.data.input as ApacheInput);

  const { data, error } = await supa
    .from("eventos_modulos")
    .insert({
      user_id: user.id,
      modulo: "uci",
      tipo: UCI_TIPOS.apache_ii,
      datos: {
        paciente_iniciales: parsed.data.pacienteIniciales ?? null,
        paciente_edad: parsed.data.pacienteEdad ?? null,
        input: parsed.data.input,
        resultado,
      },
      status: "completado",
      completed_at: new Date().toISOString(),
      metricas: {
        apache_total: resultado.total,
        severidad: resultado.severidad,
        mortalidad_aprox: resultado.mortalidadAprox,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: "No se pudo registrar." };
  }

  void recordAudit({
    userId: user.id,
    action: "uci.apache_ii",
    metadata: { apache_total: resultado.total, severidad: resultado.severidad },
  });

  revalidatePath("/dashboard/uci");
  return { status: "ok", eventoId: data.id };
}

// ===================================================================
// FAST-HUG — bundle diario
// ===================================================================

const fastHugSchema = z.object({
  pacienteIniciales: z.string().max(8).optional(),
  pacienteEdad: z.number().int().min(0).max(120).optional(),
  input: z.object({
    feeding: z.boolean(),
    analgesia: z.boolean(),
    sedation: z.boolean(),
    thromboprophylaxis: z.boolean(),
    headOfBed: z.boolean(),
    ulcerProphylaxis: z.boolean(),
    glucoseControl: z.boolean(),
  }),
});

export async function registrarFastHug(
  input: z.infer<typeof fastHugSchema>,
): Promise<ActionResult> {
  const parsed = fastHugSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  if (!canUseCerebro(tier)) {
    return { status: "error", message: "Requiere plan Profesional o superior." };
  }

  const resultado = calcularFastHug(parsed.data.input as FastHugInput);

  const { data, error } = await supa
    .from("eventos_modulos")
    .insert({
      user_id: user.id,
      modulo: "uci",
      tipo: UCI_TIPOS.fast_hug,
      datos: {
        paciente_iniciales: parsed.data.pacienteIniciales ?? null,
        paciente_edad: parsed.data.pacienteEdad ?? null,
        input: parsed.data.input,
        resultado,
      },
      status: "completado",
      completed_at: new Date().toISOString(),
      metricas: {
        fast_hug_cumplidos: resultado.cumplidos,
        bundle_completo: resultado.bundleCompleto,
        compliance: resultado.compliance,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: "No se pudo registrar." };
  }

  void recordAudit({
    userId: user.id,
    action: "uci.fast_hug",
    metadata: { cumplidos: resultado.cumplidos, completo: resultado.bundleCompleto },
  });

  revalidatePath("/dashboard/uci");
  return { status: "ok", eventoId: data.id };
}

// ===================================================================
// CAM-ICU — delirium screening
// ===================================================================

const camIcuSchema = z.object({
  pacienteIniciales: z.string().max(8).optional(),
  pacienteEdad: z.number().int().min(0).max(120).optional(),
  input: z.object({
    feature1_inicioAgudoFluctuante: z.boolean(),
    feature2_inatencion: z.boolean(),
    feature3_pensamientoDesorganizado: z.boolean(),
    feature4_concienciaAlterada: z.boolean(),
  }),
});

export async function registrarCamIcu(
  input: z.infer<typeof camIcuSchema>,
): Promise<ActionResult> {
  const parsed = camIcuSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  if (!canUseCerebro(tier)) {
    return { status: "error", message: "Requiere plan Profesional o superior." };
  }

  const resultado = evaluarCamIcu(parsed.data.input as CamIcuInput);

  const { data, error } = await supa
    .from("eventos_modulos")
    .insert({
      user_id: user.id,
      modulo: "uci",
      tipo: "cam_icu",
      datos: {
        paciente_iniciales: parsed.data.pacienteIniciales ?? null,
        paciente_edad: parsed.data.pacienteEdad ?? null,
        input: parsed.data.input,
        resultado,
      },
      status: "completado",
      completed_at: new Date().toISOString(),
      metricas: {
        delirium: resultado.delirium,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: "No se pudo registrar." };
  }

  void recordAudit({
    userId: user.id,
    action: "uci.cam_icu",
    metadata: { delirium: resultado.delirium },
  });

  revalidatePath("/dashboard/uci");
  return { status: "ok", eventoId: data.id };
}

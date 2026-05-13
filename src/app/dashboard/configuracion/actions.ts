"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { invalidateCerebroCache } from "@/lib/bm25";

export async function setRecallReplyToEmail(
  emailOrNull: string | null,
): Promise<{ status: "ok" } | { status: "error"; message: string }> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  // Validar formato si se envía un email
  let value: string | null = null;
  if (emailOrNull && emailOrNull.trim().length > 0) {
    const parsed = z
      .string()
      .email("Correo inválido")
      .max(200)
      .safeParse(emailOrNull.trim());
    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Correo inválido",
      };
    }
    value = parsed.data.toLowerCase();
  }

  const { error } = await supa
    .from("profiles")
    .update({ recall_reply_to_email: value })
    .eq("id", user.id);

  if (error) {
    console.error("[configuracion] reply_to update err:", error);
    return {
      status: "error",
      message: "No pudimos guardar tu preferencia. Inténtalo de nuevo.",
    };
  }

  revalidatePath("/dashboard/configuracion");
  return { status: "ok" };
}

export interface ConsultorioData {
  nombre: string | null;
  cedula_profesional: string | null;
  especialidad: string | null;
  consultorio_nombre: string | null;
  consultorio_direccion: string | null;
  consultorio_telefono: string | null;
}

export interface BookingConfigData {
  accepts_public_bookings: boolean;
  booking_slug: string | null;
  booking_workdays: number[];
  booking_hour_start: number;
  booking_hour_end: number;
  booking_slot_minutes: number;
  booking_advance_days: number;
  booking_bio: string | null;
}

export async function updateBookingConfig(
  data: BookingConfigData,
): Promise<{ status: "ok" } | { status: "error"; message: string }> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  // Validations
  if (data.accepts_public_bookings && !data.booking_slug) {
    return {
      status: "error",
      message: "Necesitas un identificador URL para activar reservaciones.",
    };
  }
  if (data.booking_slug && !/^[a-z0-9-]{3,60}$/.test(data.booking_slug)) {
    return {
      status: "error",
      message: "El identificador debe tener entre 3 y 60 caracteres (a-z, 0-9, guiones).",
    };
  }
  if (data.booking_hour_end <= data.booking_hour_start) {
    return {
      status: "error",
      message: "La hora de fin debe ser mayor a la de inicio.",
    };
  }

  // Check slug uniqueness (only if different from current)
  if (data.booking_slug) {
    const { data: existing } = await supa
      .from("profiles")
      .select("id")
      .eq("booking_slug", data.booking_slug)
      .neq("id", user.id)
      .maybeSingle();
    if (existing) {
      return {
        status: "error",
        message: "Ese identificador ya está en uso. Elige otro.",
      };
    }
  }

  const { error } = await supa
    .from("profiles")
    .update({
      accepts_public_bookings: data.accepts_public_bookings,
      booking_slug: data.booking_slug,
      booking_workdays: data.booking_workdays,
      booking_hour_start: data.booking_hour_start,
      booking_hour_end: data.booking_hour_end,
      booking_slot_minutes: data.booking_slot_minutes,
      booking_advance_days: data.booking_advance_days,
      booking_bio: data.booking_bio,
    })
    .eq("id", user.id);

  if (error) {
    console.error("[configuracion] updateBookingConfig error:", error);
    return { status: "error", message: error.message };
  }

  revalidatePath("/dashboard/configuracion");
  revalidatePath("/agendar");
  if (data.booking_slug) {
    revalidatePath(`/agendar/${data.booking_slug}`);
  }
  return { status: "ok" };
}

export async function updateConsultorioData(
  data: ConsultorioData,
): Promise<{ status: "ok" } | { status: "error"; message: string }> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { error } = await supa
    .from("profiles")
    .update({
      nombre: data.nombre,
      cedula_profesional: data.cedula_profesional,
      especialidad: data.especialidad,
      consultorio_nombre: data.consultorio_nombre,
      consultorio_direccion: data.consultorio_direccion,
      consultorio_telefono: data.consultorio_telefono,
    })
    .eq("id", user.id);

  if (error) {
    console.error("[configuracion] updateConsultorioData error:", error);
    return { status: "error", message: error.message };
  }

  revalidatePath("/dashboard/configuracion");
  revalidatePath("/dashboard/recetas");
  return { status: "ok" };
}

export async function toggleShareWithCollective(
  enabled: boolean,
): Promise<{ status: "ok" } | { status: "error"; message: string }> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { error } = await supa
    .from("profiles")
    .update({ share_with_collective: enabled })
    .eq("id", user.id);

  if (error) {
    console.error("[configuracion] toggle error:", error);
    return { status: "error", message: error.message };
  }

  // Cache invalidation: when un-sharing the DB trigger cleans the chunks;
  // when sharing future firmadas notes will produce chunks. Either way, the
  // cerebro index needs to refresh so the change is reflected immediately.
  invalidateCerebroCache();
  revalidatePath("/dashboard/configuracion");
  revalidatePath("/dashboard/cerebro");
  return { status: "ok" };
}

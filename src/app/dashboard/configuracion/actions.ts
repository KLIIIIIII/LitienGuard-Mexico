"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { invalidateCerebroCache } from "@/lib/bm25";

export interface ConsultorioData {
  nombre: string | null;
  cedula_profesional: string | null;
  especialidad: string | null;
  consultorio_nombre: string | null;
  consultorio_direccion: string | null;
  consultorio_telefono: string | null;
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

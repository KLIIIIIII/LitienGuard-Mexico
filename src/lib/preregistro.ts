import { z } from "zod";

export const preregistroSchema = z.object({
  email: z
    .string()
    .min(1, "Tu correo es requerido")
    .email("Formato de correo no válido"),
  tipo: z.enum(["medico", "paciente", "hospital", "otro"], {
    message: "Selecciona una opción",
  }),
  nombre: z.string().max(120).optional().or(z.literal("")),
  mensaje: z.string().max(800).optional().or(z.literal("")),
  utm_source: z.string().max(120).optional().or(z.literal("")),
  utm_medium: z.string().max(120).optional().or(z.literal("")),
  utm_campaign: z.string().max(120).optional().or(z.literal("")),
});

export type PreregistroInput = z.infer<typeof preregistroSchema>;

export const TIPO_LABELS: Record<PreregistroInput["tipo"], string> = {
  medico: "Médico",
  paciente: "Paciente",
  hospital: "Hospital o clínica",
  otro: "Otro",
};

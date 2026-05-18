export const TIER_LABELS = {
  free: "Explorador",
  esencial: "Esencial",
  pilot: "Esencial (piloto)",
  pro: "Profesional",
  enterprise: "Clínica",
} as const;

export type ProfileType =
  | "sin_definir"
  | "medico_general"
  | "dentista"
  | "hospital";

export const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
  sin_definir: "Sin definir",
  medico_general: "Medicina general o especialidad",
  dentista: "Odontología",
  hospital: "Hospital o clínica multi-médico",
};

export const TIER_DESCRIPTIONS = {
  free: "Acceso al panel — 5 notas SOAP, sin cerebro",
  esencial:
    "100 SOAPs + cerebro lectura + recetas + agenda + pacientes",
  pilot: "Esencial + Scribe ilimitado durante piloto",
  pro: "Scribe + cerebro completo + diferencial + agenda avanzada",
  enterprise: "Todo + RCM + multi-médico + SLA",
} as const;

export type SubscriptionTier = keyof typeof TIER_LABELS;

// "pilot" is kept for backward compatibility — same access as "esencial".
const ESENCIAL_TIERS: SubscriptionTier[] = ["esencial", "pilot", "pro", "enterprise"];
const SCRIBE_TIERS: SubscriptionTier[] = ["pilot", "pro", "enterprise"];
const CEREBRO_TIERS: SubscriptionTier[] = ["pro", "enterprise"];
const RECETAS_TIERS: SubscriptionTier[] = ["esencial", "pilot", "pro", "enterprise"];
const AGENDA_TIERS: SubscriptionTier[] = ["esencial", "pilot", "pro", "enterprise"];
const PACIENTES_TIERS: SubscriptionTier[] = ["esencial", "pilot", "pro", "enterprise"];
const PACIENTES_RECALL_AUTO_TIERS: SubscriptionTier[] = ["pro", "enterprise"];
const RCM_TIERS: SubscriptionTier[] = ["enterprise"];
// Hospital-scale modules (Urgencias/UCI/Quirófano/Laboratorio/Radiología/
// Departamentos clínicos/Bed Management). Solo Clínica — operación
// multi-departamento, no consultorio individual.
const HOSPITAL_MODULES_TIERS: SubscriptionTier[] = ["enterprise"];

/**
 * Read-only access to cerebro (search guidelines, no diferencial engine
 * or auto-extraction). Available from Esencial.
 */
export function canReadCerebro(
  tier: SubscriptionTier | null | undefined,
): boolean {
  if (!tier) return false;
  return ESENCIAL_TIERS.includes(tier);
}

export function canUseScribe(tier: SubscriptionTier | null | undefined): boolean {
  if (!tier) return false;
  return SCRIBE_TIERS.includes(tier);
}

/**
 * Full cerebro access — includes diferencial bayesiano engine,
 * auto-extraction of findings, evidence Q&A.
 */
export function canUseCerebro(
  tier: SubscriptionTier | null | undefined,
): boolean {
  if (!tier) return false;
  return CEREBRO_TIERS.includes(tier);
}

export function canUseRecetas(
  tier: SubscriptionTier | null | undefined,
): boolean {
  if (!tier) return false;
  return RECETAS_TIERS.includes(tier);
}

export function canUseAgenda(
  tier: SubscriptionTier | null | undefined,
): boolean {
  if (!tier) return false;
  return AGENDA_TIERS.includes(tier);
}

export function canUseRcm(tier: SubscriptionTier | null | undefined): boolean {
  if (!tier) return false;
  return RCM_TIERS.includes(tier);
}

/**
 * Acceso a módulos hospitalarios (Urgencias / UCI / Quirófano /
 * Laboratorio / Radiología / Departamentos clínicos / Bed Management).
 * Solo Clínica. Profesional (pro) es médico individual, no hospital.
 */
export function canUseHospitalModules(
  tier: SubscriptionTier | null | undefined,
): boolean {
  if (!tier) return false;
  return HOSPITAL_MODULES_TIERS.includes(tier);
}

/**
 * Módulo de pacientes (padrón propio): listar, importar CSV, marcar
 * inactivos, enviar recordatorio MANUAL. Disponible Esencial+.
 */
export function canUsePacientes(
  tier: SubscriptionTier | null | undefined,
): boolean {
  if (!tier) return false;
  return PACIENTES_TIERS.includes(tier);
}

/**
 * Recall AUTOMÁTICO de pacientes inactivos vía cron semanal. Premium
 * de Pro+. El médico configura regla (3/6/12 meses) y el sistema
 * manda recordatorio sin intervención.
 */
export function canUsePacientesRecallAuto(
  tier: SubscriptionTier | null | undefined,
): boolean {
  if (!tier) return false;
  return PACIENTES_RECALL_AUTO_TIERS.includes(tier);
}

export function scribeMonthlyLimit(
  tier: SubscriptionTier | null | undefined,
): number {
  switch (tier) {
    case "pilot":
    case "esencial":
      return 100;
    case "pro":
      return 300;
    case "enterprise":
      return Infinity;
    case "free":
    default:
      return 0;
  }
}

export function tierBadgeClass(tier: SubscriptionTier | null | undefined): string {
  switch (tier) {
    case "pro":
    case "enterprise":
      return "bg-validation-soft text-validation";
    case "pilot":
    case "esencial":
      return "bg-accent-soft text-accent";
    case "free":
    default:
      return "bg-warn-soft text-warn";
  }
}

// ============================================================
// Filtrado de features por profile_type (vertical de práctica)
// ============================================================
// Estos helpers NO bloquean acceso — solo ocultan elementos del
// sidebar/dashboard que no son relevantes para ese perfil. El tier
// sigue siendo lo que autoriza el USO real de cada feature.

export function shouldShowOdontograma(p: ProfileType | null | undefined): boolean {
  if (!p || p === "sin_definir") return true; // todavía no eligieron, mostrar todo
  // Hospital queda fuera: opera multi-departamental, los dentistas
  // dentro de un hospital trabajan con cuenta individual de dentista.
  return p === "dentista";
}

export function shouldShowDiferencial(p: ProfileType | null | undefined): boolean {
  if (!p || p === "sin_definir") return true;
  return p === "medico_general" || p === "hospital";
}

export function shouldShowCerebro(_p: ProfileType | null | undefined): boolean {
  return true; // todos los perfiles se benefician del cerebro clínico
}

export function shouldShowRecetas(_p: ProfileType | null | undefined): boolean {
  return true; // todos prescriben
}

export function shouldShowAgenda(_p: ProfileType | null | undefined): boolean {
  return true; // todos agendan
}

export function shouldShowPacientes(_p: ProfileType | null | undefined): boolean {
  return true; // todos tienen padrón
}

export function shouldShowRcm(p: ProfileType | null | undefined): boolean {
  if (!p || p === "sin_definir") return true;
  return p === "hospital";
}

export function shouldShowScribe(p: ProfileType | null | undefined): boolean {
  if (!p || p === "sin_definir") return true;
  // Hospital: Scribe es feature personal de cada médico. La cuenta
  // admin del hospital no graba consultas, los médicos individuales sí.
  return p === "medico_general" || p === "dentista";
}

/**
 * "Mis consultas" — feature personal del médico (notas SOAP propias).
 * Hospital usa los boards por departamento, no la lista personal.
 */
export function shouldShowMisConsultas(
  p: ProfileType | null | undefined,
): boolean {
  if (!p || p === "sin_definir") return true;
  return p === "medico_general" || p === "dentista";
}

/**
 * Áreas críticas (Urgencias / UCI / Quirófano) — solo aplican al
 * médico general/especialista o al hospital. Un dentista en consultorio
 * privado no las usa.
 */
export function shouldShowAreasCriticas(
  p: ProfileType | null | undefined,
): boolean {
  if (!p || p === "sin_definir") return true;
  return p === "medico_general" || p === "hospital";
}

/**
 * Apoyo diagnóstico (Laboratorio / Radiología) — pertinente para
 * médico general/especialista y hospital. El dentista usa imágenes
 * dentales propias, no estos módulos.
 */
export function shouldShowApoyoDiagnostico(
  p: ProfileType | null | undefined,
): boolean {
  if (!p || p === "sin_definir") return true;
  return p === "medico_general" || p === "hospital";
}

/**
 * Departamentos por especialidad médica (Cardio / Neuro / Onco /
 * Endocrino). Solo aplican a médicos generales/especialistas y
 * hospitales. Un dentista no los usa.
 */
export function shouldShowEspecialidadesMedicas(
  p: ProfileType | null | undefined,
): boolean {
  if (!p || p === "sin_definir") return true;
  return p === "medico_general" || p === "hospital";
}

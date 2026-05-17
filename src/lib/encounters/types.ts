import type { ModuloHospital } from "../modulos-eventos";

export type EncounterModulo =
  | ModuloHospital
  | "hospitalizacion"
  | "ambulatorio";

export type EncounterStatus = "activo" | "alta" | "transferido" | "fallecido" | "lwbs";

export type EncounterSeveridad = "verde" | "amarillo" | "naranja" | "rojo" | "azul";

export type EncounterDisposition =
  | "alta_domicilio"
  | "alta_voluntaria"
  | "hospitalizacion"
  | "uci"
  | "quirofano"
  | "traslado_externo"
  | "fallecido"
  | "lwbs";

export interface EncounterRow {
  id: string;
  user_id: string;
  paciente_id: string | null;
  modulo: EncounterModulo;
  tipo: string;
  status: EncounterStatus;
  severidad: EncounterSeveridad | null;
  admitted_at: string;
  discharged_at: string | null;
  disposition: EncounterDisposition | null;
  motivo_admision: string | null;
  bed_label: string | null;
  attending_doctor: string | null;
  los_minutes: number | null;
  datos: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type EncounterPhase = "activo" | "alta_reciente" | "historico";

export interface EncounterCensus {
  activos: number;
  altaReciente: number;
  historico: number;
  porModulo: Partial<Record<EncounterModulo, { activos: number; altaReciente: number }>>;
}

export const MODULO_LABEL_ENCOUNTER: Record<EncounterModulo, string> = {
  urgencias: "Urgencias",
  quirofano: "Quirófano",
  uci: "UCI",
  laboratorio: "Laboratorio",
  radiologia: "Radiología",
  cardiologia: "Cardiología",
  neurologia: "Neurología",
  oncologia: "Oncología",
  endocrinologia: "Endocrinología",
  hospitalizacion: "Hospitalización",
  ambulatorio: "Ambulatorio",
};

export const DISPOSITION_LABEL: Record<EncounterDisposition, string> = {
  alta_domicilio: "Alta a domicilio",
  alta_voluntaria: "Alta voluntaria",
  hospitalizacion: "Hospitalización",
  uci: "Ingreso a UCI",
  quirofano: "Pase a quirófano",
  traslado_externo: "Traslado externo",
  fallecido: "Defunción",
  lwbs: "Salió sin ser visto",
};

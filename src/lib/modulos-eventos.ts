export type ModuloHospital =
  | "urgencias"
  | "quirofano"
  | "uci"
  | "laboratorio"
  | "radiologia"
  | "cardiologia"
  | "neurologia"
  | "oncologia"
  | "endocrinologia";

export type EventoStatus = "activo" | "completado" | "cancelado";

export type EventoModulo = {
  id: string;
  user_id: string;
  paciente_id: string | null;
  modulo: ModuloHospital;
  tipo: string;
  datos: Record<string, unknown>;
  status: EventoStatus;
  metricas: Record<string, unknown>;
  notas: string | null;
  created_at: string;
  completed_at: string | null;
};

export const MODULO_LABELS: Record<ModuloHospital, string> = {
  urgencias: "Urgencias",
  quirofano: "Quirófano",
  uci: "UCI",
  laboratorio: "Laboratorio",
  radiologia: "Radiología",
  cardiologia: "Cardiología",
  neurologia: "Neurología",
  oncologia: "Oncología",
  endocrinologia: "Endocrinología",
};

export const CARDIOLOGIA_TIPOS = {
  heart_score: "heart_score",
  grace: "grace",
  chads_vasc: "chads_vasc",
} as const;

export const NEUROLOGIA_TIPOS = {
  nihss: "nihss",
  glasgow: "glasgow",
  mini_mental: "mini_mental",
} as const;

export const ONCOLOGIA_TIPOS = {
  ecog: "ecog",
  karnofsky: "karnofsky",
} as const;

export const ENDOCRINOLOGIA_TIPOS = {
  hba1c_control: "hba1c_control",
  framingham_dm: "framingham_dm",
} as const;

export const URGENCIAS_TIPOS = {
  triage: "triage",
  sepsis_bundle: "sepsis_bundle",
  codigo_stroke: "codigo_stroke",
  codigo_iam: "codigo_iam",
  dka_protocolo: "dka_protocolo",
} as const;

export const QUIROFANO_TIPOS = {
  pre_quirurgico: "pre_quirurgico",
  time_out: "time_out",
  intra_op: "intra_op",
  post_op: "post_op",
} as const;

export const UCI_TIPOS = {
  sofa: "sofa",
  apache_ii: "apache_ii",
  ventilacion: "ventilacion",
  vasoactivos: "vasoactivos",
  fast_hug: "fast_hug",
} as const;

export const LABORATORIO_TIPOS = {
  peticion: "peticion",
  resultado: "resultado",
} as const;

export const RADIOLOGIA_TIPOS = {
  peticion: "peticion",
  reporte: "reporte",
} as const;

export type TriageNivel = "rojo" | "naranja" | "amarillo" | "verde" | "azul";

export const TRIAGE_NIVELES: Record<
  TriageNivel,
  { label: string; tiempoMax: string; color: string }
> = {
  rojo: {
    label: "Rojo — atención inmediata",
    tiempoMax: "0 min",
    color: "text-rose font-semibold",
  },
  naranja: {
    label: "Naranja — muy urgente",
    tiempoMax: "10 min",
    color: "text-warn font-semibold",
  },
  amarillo: {
    label: "Amarillo — urgente",
    tiempoMax: "60 min",
    color: "text-warn",
  },
  verde: {
    label: "Verde — menos urgente",
    tiempoMax: "120 min",
    color: "text-validation",
  },
  azul: {
    label: "Azul — no urgente",
    tiempoMax: "240 min",
    color: "text-ink-quiet",
  },
};

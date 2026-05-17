/**
 * Synthea FHIR Bundle importer.
 *
 * Synthea (synthetichealth/synthea) genera pacientes ficticios con
 * expediente clínico completo en formato HL7 FHIR R4. Este módulo
 * parsea esos bundles y los mapea al schema actual de LitienGuard.
 *
 * Uso:
 *   1. Generar pacientes con Synthea: `./run_synthea --exporter.fhir.export=true`
 *   2. Synthea produce un directorio output/fhir/ con JSON por paciente
 *   3. CLI: `node scripts/import-synthea.mjs path/to/output/fhir/`
 *
 * Mapeo FHIR → LitienGuard:
 *   - Patient        → pacientes (nombre, apellidos, fecha_nacimiento, sexo)
 *   - Condition      → diagnóstico activo del paciente (matched a DiseaseId)
 *   - Observation    → resultado de lab (LabTest enum) o signo vital
 *   - MedicationRequest → recetas + recetas_items
 *   - Encounter      → consultas
 *
 * Branding: el médico que use Demo Mode ve "Motor LitienGuard ·
 * Cohorte Demo" — sin mencionar Synthea. La fuente del dataset es
 * interna (atribución legal en NOTICES.md fuera de UI).
 *
 * Función pura — sin Supabase ni I/O. La invocación a BD ocurre
 * desde un server action o script CLI.
 */

import type { LabTest } from "../scores-lab";
import type { DiseaseId } from "../inference/types";

// ===================================================================
// Tipos FHIR mínimos (sólo los que usamos)
// ===================================================================

interface FhirCoding {
  system?: string;
  code?: string;
  display?: string;
}

interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

interface FhirReference {
  reference?: string;
  display?: string;
}

interface FhirPatient {
  resourceType: "Patient";
  id?: string;
  name?: Array<{
    use?: string;
    family?: string;
    given?: string[];
    prefix?: string[];
  }>;
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: string;
  telecom?: Array<{ system?: string; value?: string }>;
}

interface FhirCondition {
  resourceType: "Condition";
  id?: string;
  clinicalStatus?: FhirCodeableConcept;
  code?: FhirCodeableConcept;
  subject?: FhirReference;
  onsetDateTime?: string;
}

interface FhirObservation {
  resourceType: "Observation";
  id?: string;
  status?: string;
  code?: FhirCodeableConcept;
  subject?: FhirReference;
  effectiveDateTime?: string;
  valueQuantity?: {
    value?: number;
    unit?: string;
    code?: string;
  };
}

interface FhirMedicationRequest {
  resourceType: "MedicationRequest";
  id?: string;
  status?: string;
  medicationCodeableConcept?: FhirCodeableConcept;
  subject?: FhirReference;
  authoredOn?: string;
  dosageInstruction?: Array<{
    text?: string;
  }>;
}

interface FhirEncounter {
  resourceType: "Encounter";
  id?: string;
  status?: string;
  type?: FhirCodeableConcept[];
  subject?: FhirReference;
  period?: {
    start?: string;
    end?: string;
  };
  reasonCode?: FhirCodeableConcept[];
}

type FhirResource =
  | FhirPatient
  | FhirCondition
  | FhirObservation
  | FhirMedicationRequest
  | FhirEncounter
  | { resourceType: string };

interface FhirBundleEntry {
  resource?: FhirResource;
}

export interface FhirBundle {
  resourceType: "Bundle";
  type?: string;
  entry?: FhirBundleEntry[];
}

// ===================================================================
// Tipos de salida — schema LitienGuard
// ===================================================================

export interface ImportedPatient {
  /** Inicial Synthea (UUID FHIR id) — se conserva en notas_internas */
  syntheaId: string;
  nombre: string;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  fechaNacimiento: string | null; // ISO date YYYY-MM-DD
  sexo: "M" | "F" | "O" | null;
  email: string | null;
  telefono: string | null;
}

export interface ImportedCondition {
  pacienteSyntheaId: string;
  /** SNOMED CT code original */
  snomedCode: string | null;
  /** Texto del display de la condición */
  textoLibre: string;
  /** Mapeado a DiseaseId del cerebro si match exitoso */
  diseaseId: DiseaseId | null;
  activa: boolean;
  onsetIso: string | null;
}

export interface ImportedObservation {
  pacienteSyntheaId: string;
  /** LOINC code */
  loincCode: string | null;
  /** Display del lab */
  textoLibre: string;
  /** Mapeado a nuestro LabTest enum si reconocido */
  labTest: LabTest | null;
  valor: number | null;
  unidad: string | null;
  fechaIso: string | null;
}

export interface ImportedMedicationRequest {
  pacienteSyntheaId: string;
  /** Nombre del medicamento (display o code) */
  medicamento: string;
  /** RxNorm code */
  rxnormCode: string | null;
  /** Dosis textual */
  dosis: string | null;
  fechaIso: string | null;
}

export interface ImportedEncounter {
  pacienteSyntheaId: string;
  /** "consulta_externa", "urgencias", "hospitalización", etc. */
  tipo: string;
  motivo: string | null;
  inicioIso: string | null;
  finIso: string | null;
}

export interface SyntheaImportResult {
  patient: ImportedPatient;
  conditions: ImportedCondition[];
  observations: ImportedObservation[];
  medications: ImportedMedicationRequest[];
  encounters: ImportedEncounter[];
}

// ===================================================================
// Mapeo SNOMED CT → DiseaseId del cerebro
// ===================================================================

/**
 * Tabla de equivalencias entre SNOMED CT codes (que usa Synthea)
 * y los DiseaseId internos del cerebro de LitienGuard.
 *
 * Solo incluimos los DiseaseId que existen en knowledge-base.ts.
 * Si Synthea trae un SNOMED no mapeado, queda como condición sin
 * vincular al motor bayesiano (pero sigue en el expediente del
 * paciente).
 */
const SNOMED_TO_DISEASE: Record<string, DiseaseId> = {
  // Diabetes
  "44054006": "dm2-typical",
  "73211009": "dm2-typical",
  "237599002": "prediabetes",
  "190407009": "lada",
  "11687002": "dm-gestational",
  "420422005": "dka",
  // Cardio
  "84114007": "hfref",
  "42343007": "hfref",
  "194828000": "ischemic-cm",
  "703272007": "hfpef-idiopathic",
  "414545008": "ischemic-cm",
  "84644000": "ischemic-cm",
  // Stroke
  "422504002": "ischemic-stroke-acute",
  "21454007": "sah",
  "230690007": "ischemic-stroke-acute",
  // HTA
  "38341003": "hypertensive-hd",
  "59621000": "hypertensive-hd",
  // Tiroides
  "40930008": "hypothyroidism",
  "34486009": "hyperthyroidism",
  // Migraña
  "4473006": "migraine-aura",
  "37796009": "migraine-without-aura",
  // Epilepsia
  "84757009": "epilepsy",
  // Demencia
  "26929004": "alzheimer-dementia",
  "429998004": "vascular-dementia",
  // Sepsis / infecto
  "91302008": "sepsis",
  "56819008": "endocarditis",
  "385093006": "cap-pneumonia",
  "56717001": "tuberculosis-active",
  "192642005": "bacterial-meningitis",
  // Onco
  "254837009": "breast-cancer",
  "363354003": "ovarian-cancer",
  "363406005": "cervical-cancer",
  "188152007": "endometrial-cancer",
};

// ===================================================================
// Mapeo LOINC → LabTest enum
// ===================================================================

const LOINC_TO_LAB: Record<string, LabTest> = {
  "2339-0": "glucosa", // Glucose [Mass/volume] in Blood
  "2345-7": "glucosa", // Glucose [Mass/volume] in Serum or Plasma
  "2823-3": "potasio",
  "6298-4": "potasio",
  "2951-2": "sodio",
  "2947-0": "sodio",
  "17861-6": "calcio", // Calcium total
  "2160-0": "creatinina",
  "718-7": "hemoglobina",
  "777-3": "plaquetas",
  "6690-2": "leucocitos",
  "5895-7": "inr",
  "10839-9": "troponina",
  "2524-7": "lactato",
  "2744-1": "ph_arterial",
  "2019-8": "pco2",
  "2703-7": "po2",
  "3016-3": "tsh",
  "4548-4": "hba1c",
};

// ===================================================================
// Helpers
// ===================================================================

function extractRefId(ref: FhirReference | undefined): string | null {
  if (!ref?.reference) return null;
  const parts = ref.reference.split(":");
  const last = parts[parts.length - 1];
  if (!last) return null;
  return last.replace(/^urn:uuid:/, "");
}

function findSnomedCode(concept: FhirCodeableConcept | undefined): string | null {
  if (!concept?.coding) return null;
  const snomed = concept.coding.find(
    (c) => c.system === "http://snomed.info/sct",
  );
  return snomed?.code ?? null;
}

function findLoincCode(concept: FhirCodeableConcept | undefined): string | null {
  if (!concept?.coding) return null;
  const loinc = concept.coding.find((c) => c.system === "http://loinc.org");
  return loinc?.code ?? null;
}

function findRxnormCode(concept: FhirCodeableConcept | undefined): string | null {
  if (!concept?.coding) return null;
  const rx = concept.coding.find(
    (c) => c.system === "http://www.nlm.nih.gov/research/umls/rxnorm",
  );
  return rx?.code ?? null;
}

function getDisplay(concept: FhirCodeableConcept | undefined): string {
  if (!concept) return "Sin descripción";
  if (concept.text) return concept.text;
  const firstDisplay = concept.coding?.find((c) => c.display)?.display;
  return firstDisplay ?? "Sin descripción";
}

function fhirGenderToSexo(g: FhirPatient["gender"]): "M" | "F" | "O" | null {
  if (g === "male") return "M";
  if (g === "female") return "F";
  if (g === "other") return "O";
  return null;
}

// ===================================================================
// Parser principal
// ===================================================================

/**
 * Parsea un FHIR Bundle de Synthea y devuelve los datos mapeados al
 * schema de LitienGuard. Función pura — sin I/O.
 *
 * Si el bundle no contiene Patient resource, devuelve null.
 */
export function parseSyntheaBundle(bundle: FhirBundle): SyntheaImportResult | null {
  if (bundle.resourceType !== "Bundle" || !bundle.entry) return null;

  let patient: FhirPatient | null = null;
  const conditions: FhirCondition[] = [];
  const observations: FhirObservation[] = [];
  const medications: FhirMedicationRequest[] = [];
  const encounters: FhirEncounter[] = [];

  for (const entry of bundle.entry) {
    if (!entry.resource) continue;
    switch (entry.resource.resourceType) {
      case "Patient":
        patient = entry.resource as FhirPatient;
        break;
      case "Condition":
        conditions.push(entry.resource as FhirCondition);
        break;
      case "Observation":
        observations.push(entry.resource as FhirObservation);
        break;
      case "MedicationRequest":
        medications.push(entry.resource as FhirMedicationRequest);
        break;
      case "Encounter":
        encounters.push(entry.resource as FhirEncounter);
        break;
      default:
        break;
    }
  }

  if (!patient) return null;

  const syntheaId = patient.id ?? "unknown";
  const name = patient.name?.find((n) => n.use === "official") ?? patient.name?.[0];
  const given = name?.given?.[0] ?? "Sin nombre";
  const family = name?.family ?? null;
  const family2 = name?.given?.[1] ?? null; // Synthea pone segundo nombre como given[1]

  const emailTel = patient.telecom?.find((t) => t.system === "email")?.value ?? null;
  const phone = patient.telecom?.find((t) => t.system === "phone")?.value ?? null;

  const mappedPatient: ImportedPatient = {
    syntheaId,
    nombre: given,
    apellidoPaterno: family,
    apellidoMaterno: family2,
    fechaNacimiento: patient.birthDate ?? null,
    sexo: fhirGenderToSexo(patient.gender),
    email: emailTel,
    telefono: phone,
  };

  const mappedConditions: ImportedCondition[] = conditions.map((c) => {
    const snomed = findSnomedCode(c.code);
    return {
      pacienteSyntheaId: extractRefId(c.subject) ?? syntheaId,
      snomedCode: snomed,
      textoLibre: getDisplay(c.code),
      diseaseId: snomed ? (SNOMED_TO_DISEASE[snomed] ?? null) : null,
      activa: c.clinicalStatus?.coding?.[0]?.code !== "resolved",
      onsetIso: c.onsetDateTime ?? null,
    };
  });

  const mappedObservations: ImportedObservation[] = observations
    .filter((o) => o.valueQuantity?.value !== undefined)
    .map((o) => {
      const loinc = findLoincCode(o.code);
      return {
        pacienteSyntheaId: extractRefId(o.subject) ?? syntheaId,
        loincCode: loinc,
        textoLibre: getDisplay(o.code),
        labTest: loinc ? (LOINC_TO_LAB[loinc] ?? null) : null,
        valor: o.valueQuantity?.value ?? null,
        unidad: o.valueQuantity?.unit ?? null,
        fechaIso: o.effectiveDateTime ?? null,
      };
    });

  const mappedMedications: ImportedMedicationRequest[] = medications.map((m) => ({
    pacienteSyntheaId: extractRefId(m.subject) ?? syntheaId,
    medicamento: getDisplay(m.medicationCodeableConcept),
    rxnormCode: findRxnormCode(m.medicationCodeableConcept),
    dosis: m.dosageInstruction?.[0]?.text ?? null,
    fechaIso: m.authoredOn ?? null,
  }));

  const mappedEncounters: ImportedEncounter[] = encounters.map((e) => {
    const typeText = e.type?.[0] ? getDisplay(e.type[0]) : "Consulta";
    const reasonText = e.reasonCode?.[0] ? getDisplay(e.reasonCode[0]) : null;
    return {
      pacienteSyntheaId: extractRefId(e.subject) ?? syntheaId,
      tipo: typeText,
      motivo: reasonText,
      inicioIso: e.period?.start ?? null,
      finIso: e.period?.end ?? null,
    };
  });

  return {
    patient: mappedPatient,
    conditions: mappedConditions,
    observations: mappedObservations,
    medications: mappedMedications,
    encounters: mappedEncounters,
  };
}

// ===================================================================
// Helpers de inspección — útiles para test suite
// ===================================================================

/** Cuántas conditions del bundle se mapearon exitosamente a DiseaseId */
export function getMappingStats(result: SyntheaImportResult): {
  conditionsMatched: number;
  conditionsTotal: number;
  observationsMatched: number;
  observationsTotal: number;
} {
  return {
    conditionsMatched: result.conditions.filter((c) => c.diseaseId !== null).length,
    conditionsTotal: result.conditions.length,
    observationsMatched: result.observations.filter((o) => o.labTest !== null)
      .length,
    observationsTotal: result.observations.length,
  };
}

/** Lista de DiseaseIds activos para este paciente (útil para correr detector cruces) */
export function getActiveDiseaseIds(
  result: SyntheaImportResult,
): DiseaseId[] {
  const ids = new Set<DiseaseId>();
  for (const c of result.conditions) {
    if (c.activa && c.diseaseId) ids.add(c.diseaseId);
  }
  return Array.from(ids);
}

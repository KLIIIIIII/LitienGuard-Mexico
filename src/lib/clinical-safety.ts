/**
 * Clinical safety helpers — AMIA error prevention + ISMP guidelines.
 *
 * Dos funciones core:
 *   - detectCriticalValues(text): detecta valores críticos en texto libre
 *     de resultados lab/imagen. Heurística basada en literatura ACR + AHRQ.
 *   - matchAllergyConflicts(meds, allergies): cross-check sintáctico
 *     simple para hard-stop pre-firma de receta. NO sustituye sistema
 *     completo de drug-drug/drug-allergy interaction (Lexicomp, First DataBank)
 *     pero captura las alergias por nombre directo + clase farmacológica.
 */

/* ============================================================
   Detección de valores críticos en texto libre
   ============================================================ */

export type CriticalFinding = {
  /** Etiqueta breve del hallazgo (ej. "Lactato alto") */
  label: string;
  /** Severidad clínica */
  severity: "critical" | "warning";
  /** Texto del match para auditoría */
  match: string;
};

/**
 * Patrones de valores críticos basados en:
 * - ACR Critical Findings Communication Guidelines
 * - AHRQ Critical Value Reporting
 * - ASCO criteria (oncology critical findings)
 * - Joint Commission National Patient Safety Goal 02.03.01
 */
const CRITICAL_PATTERNS: Array<{
  label: string;
  severity: "critical" | "warning";
  regex: RegExp;
}> = [
  // Texto explícito de alerta
  { label: "Valor crítico declarado", severity: "critical", regex: /\b(CRIT(ICAL)?|cr[íi]tico|grave|alerta|alarma|emergencia|urgente)\b/i },

  // Hallazgos imagen
  { label: "Hemorragia / sangrado", severity: "critical", regex: /\b(hemorragia|sangrado activo|hematoma\s*(intracraneal|subdural|epidural|cerebral))\b/i },
  { label: "Neumotórax", severity: "critical", regex: /\b(neumot[óo]rax(\s*a\s*tensi[óo]n)?)\b/i },
  { label: "Embolia pulmonar", severity: "critical", regex: /\b(tromboembolia\s*pulmonar|TEP\s*confirmad|embolia\s*pulmonar)\b/i },
  { label: "Disección aórtica", severity: "critical", regex: /\b(disecci[óo]n\s*a[óo]rtica)\b/i },
  { label: "Masa / nódulo sospechoso", severity: "warning", regex: /\b(masa\s*sospechosa|n[óo]dulo\s*sospechoso|tumor\s*maligno|metast[áa]sis)\b/i },
  { label: "Fractura", severity: "warning", regex: /\b(fractura\s*(desplazada|expuesta|inestable|de\s*cadera))\b/i },
  { label: "Stroke / EVC", severity: "critical", regex: /\b(EVC\s*isqu[ée]mico|infarto\s*cerebral|stroke\s*agudo|isquemia\s*cerebral)\b/i },
  { label: "Apendicitis", severity: "warning", regex: /\b(apendicitis\s*(aguda|complicada|perforada))\b/i },

  // Valores de laboratorio
  // Lactato
  { label: "Lactato elevado (>4 = shock séptico)", severity: "critical", regex: /lactato\s*[:\s]*([4-9]|[1-9]\d)(\.\d+)?\s*(mmol\/?l|mmol)/i },
  // Potasio
  { label: "Hiperkalemia severa", severity: "critical", regex: /\b(K|potasio)\s*[:\s]*([6-9]|[1-9]\d)(\.\d+)?\s*(meq|mmol)/i },
  { label: "Hipokalemia severa", severity: "critical", regex: /\b(K|potasio)\s*[:\s]*([0-2])(\.\d+)?\s*(meq|mmol)/i },
  // Sodio
  { label: "Hiponatremia severa", severity: "critical", regex: /\b(Na|sodio)\s*[:\s]*(11\d|1[0-1]\d|1[0-2][0-5])\s*(meq|mmol)/i },
  { label: "Hipernatremia severa", severity: "critical", regex: /\b(Na|sodio)\s*[:\s]*(16\d|17\d|18\d)\s*(meq|mmol)/i },
  // Glucosa
  { label: "Hipoglucemia severa", severity: "critical", regex: /(glucosa|glicemia|gluc)\s*[:\s]*([0-3]\d|40)\s*(mg|mg\/dl)/i },
  { label: "Hiperglucemia (sospecha DKA/HHS)", severity: "warning", regex: /(glucosa|glicemia|gluc)\s*[:\s]*([4-9]\d{2}|1\d{3})\s*(mg|mg\/dl)/i },
  // Plaquetas
  { label: "Trombocitopenia severa (<20k)", severity: "critical", regex: /(plaquetas|plt)\s*[:\s]*(\d{1,2}|1\d)\s*(\.|\s|$|×|x)/i },
  // Hemoglobina
  { label: "Anemia severa (<7 g/dL)", severity: "warning", regex: /(hb|hemoglobina|hemoglobin)\s*[:\s]*([0-6])(\.\d+)?\s*(g\/?dl|g)/i },
  // INR
  { label: "INR elevado (>5)", severity: "critical", regex: /\bINR\s*[:\s]*([5-9]|[1-9]\d)(\.\d+)?\b/i },
  // Troponina alta
  { label: "Troponina elevada (sospecha IAM)", severity: "critical", regex: /troponina\s*(I|T)?\s*[:\s]*(>?\s*\d+\.?\d*)\s*(ng|pg)/i },
  // Creatinina
  { label: "Insuficiencia renal aguda", severity: "warning", regex: /(creatinina|crea)\s*[:\s]*([3-9]|1\d)(\.\d+)?\s*(mg|mg\/dl)/i },
  // pH
  { label: "Acidosis severa (pH<7.2)", severity: "critical", regex: /\bpH\s*[:\s]*(6\.\d{1,2}|7\.[01]\d|7\.[01])\b/i },
  // SatO2
  { label: "Hipoxemia severa (SatO₂<88%)", severity: "critical", regex: /(sato2|sat\s*o2|saturaci[óo]n)\s*[:\s]*([4-8]\d|[1-9])\s*%?/i },
  // PCR muy elevada
  { label: "PCR muy elevada (>150)", severity: "warning", regex: /\b(PCR|prote[íi]na\s*c\s*reactiva)\s*[:\s]*([1-9]\d{2,}|[2-9]\d{2})\s*(mg)/i },
  // Bilirrubina
  { label: "Hiperbilirrubinemia severa", severity: "warning", regex: /(bilirrubina|bili)\s*(total)?\s*[:\s]*([1-9]\d|[2-9]\d)(\.\d+)?\s*(mg)/i },
];

/**
 * Detecta valores críticos en texto libre. Devuelve hallazgos únicos por
 * label (no duplica el mismo hallazgo). El primer match gana.
 */
export function detectCriticalValues(text: string | null | undefined): CriticalFinding[] {
  if (!text || text.trim().length < 3) return [];
  const seen = new Set<string>();
  const out: CriticalFinding[] = [];
  for (const pat of CRITICAL_PATTERNS) {
    if (seen.has(pat.label)) continue;
    const m = text.match(pat.regex);
    if (m && m[0]) {
      seen.add(pat.label);
      out.push({
        label: pat.label,
        severity: pat.severity,
        match: m[0].trim().slice(0, 80),
      });
    }
  }
  return out;
}

/**
 * Resume severidad global del set de hallazgos. Si hay al menos uno
 * critical → critical. Sino warning. Sino null.
 */
export function summarizeSeverity(
  findings: CriticalFinding[],
): "critical" | "warning" | null {
  if (findings.some((f) => f.severity === "critical")) return "critical";
  if (findings.length > 0) return "warning";
  return null;
}

/* ============================================================
   Allergy hard-stop matching (cross-check sintáctico)
   ============================================================ */

export type AllergyConflict = {
  /** Medicamento prescrito que conflicta */
  medication: string;
  /** Alergia documentada del paciente */
  allergy: string;
  /** Tipo de match: exact (mismo nombre), class (clase farmacológica conocida) */
  matchType: "exact" | "class";
  /** Texto descriptivo */
  reason: string;
};

/**
 * Clases farmacológicas conocidas. Cross-reactividad documentada en
 * literatura — ISMP + Lexicomp + IBM Micromedex.
 *
 * NOTA IMPORTANTE: esta lista es SUBSET de las cross-reactividades más
 * comunes. NO es comprehensiva. NO sustituye sistema profesional de
 * drug-allergy interaction (Lexicomp, First DataBank). Es un hard-stop
 * preventivo de primer orden que captura las alergias más comunes y
 * peligrosas en MX.
 */
const ALLERGY_CLASSES: Array<{
  /** Cómo se llama típicamente la alergia documentada */
  allergyAlias: string[];
  /** Patrones de medicamentos que conflictan con esa alergia */
  medPatterns: RegExp[];
  /** Descripción del conflicto */
  reason: string;
}> = [
  {
    allergyAlias: ["penicilina", "penicilinas", "betalactam", "betalactámicos", "amoxicilina"],
    medPatterns: [
      /\b(penicilina|amoxicilina|ampicilina|piperacilina|dicloxacilina|cloxacilina|carbenicilina|nafcilina|oxacilina)\b/i,
      /\b(amox.?clav|augmentin|piperacilina.?tazobactam|tazocin)\b/i,
      /\b(cefa[a-zñ]+|ceftri|cefur|cefaz|cefta|cefepime|cefoxitin|cefuroxima|ceftriaxona|cefepima|ceftazidima)\b/i,
      /\b(imipenem|meropenem|ertapenem|doripenem|carbapenem)\b/i,
    ],
    reason: "Alergia a betalactámicos — riesgo de reacción cruzada con cefalosporinas y carbapenems",
  },
  {
    allergyAlias: ["sulfa", "sulfas", "sulfamida", "sulfamidas", "trimetoprim", "bactrim"],
    medPatterns: [
      /\b(sulfa|sulfame|sulfas|trimet|bactrim|cotrimoxazol|tmp.?smx|sulfadiacina|sulfasalacina)\b/i,
      /\b(furosemida|hidroclorotiazida|clortalidona|indapamida)\b/i,
      /\b(glibenclamida|glimepirida|gliclazida|tolbutamida|sulfonilurea)\b/i,
    ],
    reason: "Alergia a sulfamidas — riesgo de reacción cruzada con sulfonamidas, tiazidas y sulfonilureas",
  },
  {
    allergyAlias: ["aine", "aines", "ibuprofeno", "ketoprofeno", "naproxeno", "aspirina"],
    medPatterns: [
      /\b(ibuprofeno|ketoprofeno|naproxeno|diclofenaco|ketorolac|indometacina|piroxicam|meloxicam|celecoxib|etoricoxib)\b/i,
      /\b(aspirina|asa|ácido acetilsalicílico|acido acetilsalicilico)\b/i,
    ],
    reason: "Alergia a AINEs / aspirina — riesgo de broncoespasmo / angioedema / Samter triad",
  },
  {
    allergyAlias: ["aspirina", "asa", "salicilato"],
    medPatterns: [
      /\b(aspirina|asa\b|ácido acetilsalicílico|acido acetilsalicilico|salicilato)\b/i,
    ],
    reason: "Alergia a aspirina — usar paracetamol o evitar AINEs",
  },
  {
    allergyAlias: ["yodo", "contraste", "contrastes yodados", "medio de contraste"],
    medPatterns: [
      /\b(contraste\s*(iv|yodado|hidrosoluble)|iohexol|iopamidol|iodixanol|ioversol|amidotrizoato)\b/i,
      /\b(amiodarona|levotiroxina)\b/i,
    ],
    reason: "Alergia a yodo / contrastes — premedicar o evitar contraste yodado",
  },
  {
    allergyAlias: ["macrolido", "macrólido", "macrolidos", "macrólidos", "eritromicina", "azitromicina", "claritromicina"],
    medPatterns: [
      /\b(eritromicina|azitromicina|claritromicina|telitromicina|roxitromicina|josamicina)\b/i,
    ],
    reason: "Alergia a macrólidos — usar otra clase de antibiótico",
  },
  {
    allergyAlias: ["quinolona", "quinolonas", "fluoroquinolona", "fluoroquinolonas", "ciprofloxacino", "levofloxacino"],
    medPatterns: [
      /\b(ciprofloxac|levofloxac|moxifloxac|norfloxac|ofloxac|gemifloxac|gatifloxac)\b/i,
    ],
    reason: "Alergia a quinolonas — usar otra clase de antibiótico",
  },
  {
    allergyAlias: ["tetraciclina", "tetraciclinas", "doxiciclina", "minociclina"],
    medPatterns: [
      /\b(tetraciclin|doxicicl|minocicl|tigecicl)\b/i,
    ],
    reason: "Alergia a tetraciclinas — usar otra clase de antibiótico",
  },
  {
    allergyAlias: ["latex", "látex"],
    medPatterns: [/\blátex|latex\b/i],
    reason: "Alergia a látex — verificar dispositivos médicos sin látex",
  },
];

/**
 * Cross-check alergias del paciente contra medicamentos prescritos.
 *
 * @param meds Lista de medicamentos (string) — típicamente nombres de
 *   los items de receta.
 * @param allergies Lista de alergias documentadas del paciente.
 * @returns Lista de conflictos detectados. Vacía = no hay conflictos.
 */
export function matchAllergyConflicts(
  meds: string[],
  allergies: string[],
): AllergyConflict[] {
  if (!allergies || allergies.length === 0) return [];
  if (!meds || meds.length === 0) return [];

  const conflicts: AllergyConflict[] = [];
  const seen = new Set<string>(); // dedupe por medicamento+alergia

  for (const med of meds) {
    if (!med || med.trim().length < 2) continue;
    const medLower = med.toLowerCase();

    for (const allergy of allergies) {
      if (!allergy || allergy.trim().length < 2) continue;
      const allergyLower = allergy.toLowerCase().trim();

      // 1. Exact match (substring directo en ambas direcciones)
      if (
        medLower.includes(allergyLower) ||
        allergyLower.includes(medLower.split(/\s+/)[0] ?? "")
      ) {
        const key = `${med}::${allergy}::exact`;
        if (seen.has(key)) continue;
        seen.add(key);
        conflicts.push({
          medication: med,
          allergy,
          matchType: "exact",
          reason: `El medicamento "${med}" coincide con la alergia documentada "${allergy}"`,
        });
        continue;
      }

      // 2. Class match
      for (const cls of ALLERGY_CLASSES) {
        const isAllergyInClass = cls.allergyAlias.some((a) =>
          allergyLower.includes(a),
        );
        if (!isAllergyInClass) continue;

        const isMedInClass = cls.medPatterns.some((p) => p.test(medLower));
        if (!isMedInClass) continue;

        const key = `${med}::${allergy}::class`;
        if (seen.has(key)) continue;
        seen.add(key);
        conflicts.push({
          medication: med,
          allergy,
          matchType: "class",
          reason: cls.reason,
        });
      }
    }
  }

  return conflicts;
}

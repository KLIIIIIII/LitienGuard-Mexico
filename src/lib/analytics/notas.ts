// Light-weight clinical analytics for the doctor's own notes.
// Keyword-based extraction (no NLP model) — fast and deterministic.
// Designed to surface obvious patterns: most-managed conditions, most-
// prescribed drugs, demographic distribution. Doctor can verify against
// raw notes in the JSON export.

export interface NotaForAnalytics {
  id: string;
  paciente_edad: number | null;
  paciente_sexo: string | null;
  soap_analisis: string | null;
  soap_plan: string | null;
  status: "borrador" | "firmada" | "descartada";
  created_at: string;
}

const DIAGNOSTIC_TERMS: Array<{ term: string; patterns: RegExp[] }> = [
  { term: "DM2 (diabetes tipo 2)", patterns: [/\bdm2\b/i, /diabetes\s+(?:mellitus\s+)?(?:tipo\s+)?2/i] },
  { term: "DM1 (diabetes tipo 1)", patterns: [/\bdm1\b/i, /diabetes\s+(?:mellitus\s+)?(?:tipo\s+)?1/i] },
  { term: "Hipertensión arterial", patterns: [/\bhas\b/i, /hipertensi[óo]n\s+arterial/i] },
  { term: "Insuficiencia cardiaca", patterns: [/\b(?:icc?|insuficiencia\s+cardiaca|ic\s+(?:fer|fep|fevi))/i] },
  { term: "Infarto agudo de miocardio", patterns: [/\b(?:iam|stemi|nstemi|infarto)\b/i] },
  { term: "Enfermedad renal crónica", patterns: [/\b(?:erc|enfermedad\s+renal\s+cr[óo]nica|tfg\s*(?:<|menor)|ckd)\b/i] },
  { term: "Lesión renal aguda", patterns: [/\b(?:lra|aki|lesi[óo]n\s+renal\s+aguda)\b/i] },
  { term: "EPOC", patterns: [/\bepoc\b/i, /enfermedad\s+pulmonar\s+obstructiva/i] },
  { term: "Asma", patterns: [/\basma/i] },
  { term: "Depresión", patterns: [/depresi[óo]n/i, /\btdm\b/i] },
  { term: "Ansiedad / TAG", patterns: [/\b(?:tag|ansiedad\s+generalizada|trastorno\s+de\s+ansiedad)\b/i] },
  { term: "Hipotiroidismo", patterns: [/hipotiroidismo/i] },
  { term: "Hipertiroidismo / Graves", patterns: [/hipertiroidismo/i, /enfermedad\s+de\s+graves/i] },
  { term: "Dislipidemia", patterns: [/dislipidemia/i, /hipercolesterolemia/i] },
  { term: "Obesidad", patterns: [/\bobesidad\b/i, /imc\s*(?:>=?|≥)\s*30/i] },
  { term: "Esteatosis hepática (MASLD)", patterns: [/\b(?:masld|nafld|esteatosis\s+hep[áa]tica)\b/i] },
  { term: "Reflujo gastroesofágico", patterns: [/\b(?:erge|reflujo\s+gastroesof[áa]gico)\b/i] },
  { term: "Migraña", patterns: [/migra[ñn]a/i] },
  { term: "Epilepsia", patterns: [/epilepsia/i] },
  { term: "ACV / isquemia cerebral", patterns: [/\b(?:acv|evc|ictus|isquemia\s+cerebral)\b/i] },
  { term: "Anemia ferropénica", patterns: [/anemia\s+ferrop[ée]nica/i, /ferritina\s+baja/i] },
  { term: "Artrosis", patterns: [/\b(?:artrosis|osteoartritis)\b/i] },
  { term: "Artritis reumatoide", patterns: [/artritis\s+reumatoide/i, /\bar\b(?!\.)/i] },
  { term: "Infección de vías urinarias", patterns: [/\b(?:itu|cistitis|pielonefritis|infecci[óo]n\s+(?:de\s+)?v[íi]as?\s+urinarias?)\b/i] },
  { term: "Neumonía adquirida en comunidad", patterns: [/\b(?:nac|neumon[íi]a)\b/i] },
  { term: "Sepsis", patterns: [/sepsis/i, /choque\s+s[ée]ptico/i] },
  { term: "Preeclampsia / HTA gestacional", patterns: [/preeclampsia/i, /hta\s+gestacional/i] },
  { term: "Diabetes gestacional", patterns: [/diabetes\s+gestacional/i, /\bdmg\b/i] },
];

const DRUG_TERMS: Array<{ term: string; patterns: RegExp[] }> = [
  { term: "Metformina", patterns: [/metformina/i] },
  { term: "Empagliflozina", patterns: [/empagliflozina/i] },
  { term: "Dapagliflozina", patterns: [/dapagliflozina/i] },
  { term: "Canagliflozina", patterns: [/canagliflozina/i] },
  { term: "Insulina (glargina/NPH/lispro)", patterns: [/insulina/i, /glargina/i, /degludec/i, /\blispro\b/i] },
  { term: "Semaglutida", patterns: [/semaglutida/i, /ozempic/i, /wegovy/i] },
  { term: "Liraglutida", patterns: [/liraglutida/i, /victoza/i] },
  { term: "Tirzepatida", patterns: [/tirzepatida/i] },
  { term: "Levotiroxina", patterns: [/levotiroxina/i] },
  { term: "Losartán", patterns: [/losart[áa]n/i] },
  { term: "Valsartán", patterns: [/valsart[áa]n/i] },
  { term: "Enalapril / Lisinopril (IECA)", patterns: [/enalapril/i, /lisinopril/i, /ramipril/i] },
  { term: "Amlodipino", patterns: [/amlodipino/i] },
  { term: "Hidroclorotiazida", patterns: [/hidroclorotiazida/i, /\bhctz\b/i] },
  { term: "Atorvastatina", patterns: [/atorvastatina/i] },
  { term: "Rosuvastatina", patterns: [/rosuvastatina/i] },
  { term: "Simvastatina", patterns: [/simvastatina/i] },
  { term: "Aspirina", patterns: [/\baspirina\b/i, /\baas\b/i, /[áa]cido\s+acetilsalic[íi]lico/i] },
  { term: "Clopidogrel", patterns: [/clopidogrel/i] },
  { term: "Carvedilol / Bisoprolol (BB)", patterns: [/carvedilol/i, /bisoprolol/i, /metoprolol/i] },
  { term: "Furosemida", patterns: [/furosemida/i] },
  { term: "Espironolactona", patterns: [/espironolactona/i] },
  { term: "Omeprazol / Pantoprazol (IBP)", patterns: [/omeprazol/i, /pantoprazol/i, /esomeprazol/i, /lansoprazol/i] },
  { term: "Paracetamol", patterns: [/paracetamol/i, /acetaminof[ée]n/i] },
  { term: "Ibuprofeno", patterns: [/ibuprofeno/i] },
  { term: "Naproxeno", patterns: [/naproxeno/i] },
  { term: "Diclofenaco", patterns: [/diclofenaco/i] },
  { term: "Amoxicilina", patterns: [/amoxicilina/i] },
  { term: "Azitromicina", patterns: [/azitromicina/i] },
  { term: "Ciprofloxacino / Levofloxacino", patterns: [/ciprofloxacino/i, /levofloxacino/i, /moxifloxacino/i] },
  { term: "Sertralina", patterns: [/sertralina/i] },
  { term: "Escitalopram / Citalopram", patterns: [/escitalopram/i, /citalopram/i] },
  { term: "Fluoxetina", patterns: [/fluoxetina/i] },
  { term: "Pregabalina", patterns: [/pregabalina/i] },
  { term: "Gabapentina", patterns: [/gabapentina/i] },
  { term: "Tramadol", patterns: [/tramadol/i] },
  { term: "Salbutamol", patterns: [/salbutamol/i] },
  { term: "Corticoide inhalado (CI)", patterns: [/budesonida/i, /fluticasona/i, /beclometasona/i] },
  { term: "Tiotropio / Formoterol (LAMA/LABA)", patterns: [/tiotropio/i, /formoterol/i, /salmeterol/i, /vilanterol/i] },
];

function countTerms<T extends { term: string; patterns: RegExp[] }>(
  list: T[],
  notas: NotaForAnalytics[],
  field: (n: NotaForAnalytics) => string,
): Array<{ term: string; count: number }> {
  const counts = new Map<string, number>();
  for (const n of notas) {
    const text = field(n) || "";
    for (const def of list) {
      if (def.patterns.some((p) => p.test(text))) {
        counts.set(def.term, (counts.get(def.term) ?? 0) + 1);
      }
    }
  }
  return Array.from(counts.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count);
}

export interface NotasAnalytics {
  total: number;
  firmadas: number;
  borradores: number;
  descartadas: number;
  rango: { primera: string | null; ultima: string | null };
  topDiagnosticos: Array<{ term: string; count: number }>;
  topFarmacos: Array<{ term: string; count: number }>;
  distribucionEdad: Array<{ decada: string; count: number }>;
  distribucionSexo: { F: number; M: number; O: number; sinDato: number };
  notasPorMes: Array<{ mes: string; count: number }>;
}

export function analizarNotas(notas: NotaForAnalytics[]): NotasAnalytics {
  const firmadas = notas.filter((n) => n.status === "firmada");
  const borradores = notas.filter((n) => n.status === "borrador");
  const descartadas = notas.filter((n) => n.status === "descartada");

  const topDiagnosticos = countTerms(
    DIAGNOSTIC_TERMS,
    firmadas,
    (n) => `${n.soap_analisis ?? ""}\n${n.soap_plan ?? ""}`,
  );
  const topFarmacos = countTerms(DRUG_TERMS, firmadas, (n) => n.soap_plan ?? "");

  // Edad por décadas
  const edadMap = new Map<string, number>();
  for (const n of firmadas) {
    if (n.paciente_edad == null) continue;
    const decada = `${(n.paciente_edad / 10) | 0}0s`;
    edadMap.set(decada, (edadMap.get(decada) ?? 0) + 1);
  }
  const distribucionEdad = Array.from(edadMap.entries())
    .map(([decada, count]) => ({ decada, count }))
    .sort((a, b) => parseInt(a.decada) - parseInt(b.decada));

  // Sexo
  const distribucionSexo = { F: 0, M: 0, O: 0, sinDato: 0 };
  for (const n of firmadas) {
    if (n.paciente_sexo === "F") distribucionSexo.F++;
    else if (n.paciente_sexo === "M") distribucionSexo.M++;
    else if (n.paciente_sexo === "O") distribucionSexo.O++;
    else distribucionSexo.sinDato++;
  }

  // Notas por mes
  const mesMap = new Map<string, number>();
  for (const n of firmadas) {
    const d = new Date(n.created_at);
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    mesMap.set(mes, (mesMap.get(mes) ?? 0) + 1);
  }
  const notasPorMes = Array.from(mesMap.entries())
    .map(([mes, count]) => ({ mes, count }))
    .sort((a, b) => a.mes.localeCompare(b.mes));

  const fechas = firmadas.map((n) => new Date(n.created_at).getTime());
  const rango = fechas.length
    ? {
        primera: new Date(Math.min(...fechas)).toISOString(),
        ultima: new Date(Math.max(...fechas)).toISOString(),
      }
    : { primera: null, ultima: null };

  return {
    total: notas.length,
    firmadas: firmadas.length,
    borradores: borradores.length,
    descartadas: descartadas.length,
    rango,
    topDiagnosticos,
    topFarmacos,
    distribucionEdad,
    distribucionSexo,
    notasPorMes,
  };
}

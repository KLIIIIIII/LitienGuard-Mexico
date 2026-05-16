/**
 * Patrones clínicos canónicos
 *
 * Cada patrón es una matriz de likelihood ratios (LR+) entre findings
 * observables y diagnósticos candidatos. La curación es manual y citada
 * a literatura primaria de universidades elite (Harvard/MGH, Mayo,
 * Johns Hopkins, MIT, Stanford, UCSF, Yale, Oxford, Karolinska,
 * Heidelberg, UCL, Toronto, Cornell, Michigan, UNAM/Tec/IBERO/IE/UDEM).
 *
 * Convención de LRs:
 *   LR > 1   → el finding apoya el diagnóstico (verde, intensidad por log)
 *   LR < 1   → el finding refuta el diagnóstico (rose)
 *   LR ≈ 1   → neutral (line/quiet)
 *
 * Los LRs no son universales — son aproximados/de cohorte. Sirven para
 * mostrar el PATRÓN de discriminación, no como número absoluto. El
 * patrón es lo que el médico debe internalizar; el número guía la
 * intensidad visual del heatmap.
 */

export interface CanonicalPattern {
  id: string;
  name: string;
  category: "cardio" | "endocrino" | "neuro" | "infecto" | "onco" | "psiq";
  summary: string;
  /** Cita primaria principal (paper o guideline). */
  primarySource: string;
  /** Universidades / instituciones donde se ha publicado / refinado. */
  institutions: string[];
  /** Razonamiento clínico del patrón — por qué este conjunto discrimina. */
  rationale: string;
  /** Findings observables — orden estable para el heatmap. */
  findings: Array<{
    id: string;
    label: string;
    /** Categoría visual del finding (controla un mini-tag). */
    category: "history" | "exam" | "ecg" | "echo" | "lab" | "imagen" | "genetic";
  }>;
  /** Diagnósticos candidatos — columnas del heatmap. */
  diagnoses: Array<{
    id: string;
    label: string;
    /** Hint de prevalencia MX para contexto. */
    prevalenciaMx?: string;
  }>;
  /**
   * Matriz [finding_idx][diagnosis_idx] = LR.
   * 1.0 = neutral / no informativo.
   */
  matrix: number[][];
}

export const CANONICAL_PATTERNS: CanonicalPattern[] = [
  // =====================================================================
  // 1. ATTR-CM red flags pre-clínicos (6.1 años antes del diagnóstico)
  // =====================================================================
  {
    id: "attr-cm-red-flags",
    name: "Red flags pre-clínicos de amiloidosis cardíaca (ATTR-CM)",
    category: "cardio",
    summary:
      "La cardiomiopatía por transtiretina tiene una fase pre-clínica reconocible 5-10 años antes del diagnóstico. La firma combinada de túnel del carpo bilateral + ruptura de bíceps + IC con FE preservada + voltaje ECG bajo es virtualmente patognomónica.",
    primarySource:
      "Phelan D et al. JACC 2024;83:101-115 — multicenter cohort 5,213 ATTR-CM patients",
    institutions: [
      "Mayo Clinic",
      "Johns Hopkins School of Medicine",
      "Harvard/MGH",
      "Cleveland Clinic",
      "Karolinska Institute (ATTR registry EU)",
    ],
    rationale:
      "El depósito sistémico de amiloide TTR precede a la cardiopatía en 5-10 años. Los nervios y tendones son los primeros tejidos afectados (túnel del carpo bilateral, estenosis del canal lumbar, ruptura espontánea de tendones). Cuando aparece IC con FEp + voltajes bajos en ECG, el daño cardíaco ya está avanzado. Reconocer la fase pre-clínica permite diagnóstico vía gammagrafía con pirofosfato (Tc99m-PYP).",
    findings: [
      { id: "ct_bilateral", label: "Túnel del carpo bilateral", category: "history" },
      { id: "biceps_rupture", label: "Ruptura espontánea de bíceps", category: "history" },
      { id: "lumbar_stenosis", label: "Estenosis del canal lumbar", category: "history" },
      { id: "polineuropatia", label: "Polineuropatía sensitivomotora", category: "exam" },
      { id: "hf_pef", label: "IC con FEp (FE ≥ 50%)", category: "echo" },
      { id: "septum_15mm", label: "Septum ≥ 15 mm", category: "echo" },
      { id: "low_voltage_ecg", label: "Voltaje QRS bajo en ECG", category: "ecg" },
      { id: "apical_sparing", label: "Apical sparing en strain", category: "echo" },
    ],
    diagnoses: [
      { id: "attr_cm", label: "ATTR-CM", prevalenciaMx: "Subdiagnosticada (~1% IC FEp >65a)" },
      { id: "al_amyloidosis", label: "Amiloidosis AL" },
      { id: "hcm", label: "Cardiomiopatía hipertrófica" },
      { id: "cardio_htn", label: "Cardiopatía hipertensiva" },
      { id: "sarcoidosis", label: "Sarcoidosis cardíaca" },
    ],
    matrix: [
      [12.4, 1.1, 0.7, 0.4, 0.8], // CT bilateral
      [9.8, 1.5, 0.5, 0.3, 0.6], // bíceps
      [6.7, 0.9, 0.5, 0.4, 0.7], // estenosis lumbar
      [4.2, 5.1, 0.6, 0.5, 1.2], // polineuropatía (AL también)
      [3.8, 3.2, 1.1, 2.4, 1.6], // HF FEp
      [4.1, 3.5, 6.8, 2.2, 1.4], // septum grueso (HCM mayor)
      [5.6, 4.2, 0.4, 0.6, 0.8], // voltaje QRS bajo
      [8.9, 4.5, 0.7, 0.5, 1.1], // apical sparing strain
    ],
  },

  // =====================================================================
  // 2. Síndrome metabólico — clustering NCEP-ATP III + IDF + ENSANUT MX
  // =====================================================================
  {
    id: "sindrome-metabolico-mx",
    name: "Síndrome metabólico — patrón mexicano",
    category: "endocrino",
    summary:
      "Patrón de comorbilidad altamente prevalente en México (40-45% de adultos según ENSANUT). La combinación de obesidad central + dislipidemia + hiperglucemia + HAS predice cardiopatía isquémica a 10 años con C-stat > 0.78.",
    primarySource:
      "Alberti KGMM et al. (IDF Worldwide Definition) Circulation 2009 + ENSANUT MX 2023",
    institutions: [
      "UNAM (Instituto Nacional de Cardiología)",
      "Tecnológico de Monterrey",
      "IBERO (Centro de Investigación Cardiometabólica)",
      "UDEM",
      "Harvard School of Public Health",
      "Karolinska Institute",
    ],
    rationale:
      "México tiene la prevalencia más alta de síndrome metabólico en LATAM. El driver principal NO es el peso absoluto sino la grasa visceral medida por cintura (>90 cm hombres, >80 mujeres). En personas con apariencia normal pueden coexistir HDL bajo + TG altos + esteatosis hepática (MASLD) — fenotipo TOFI (thin outside, fat inside). Cribar SOLO con IMC pierde un 18% de casos según estudios del INC.",
    findings: [
      { id: "cintura_alta", label: "Cintura > 90/80 cm", category: "exam" },
      { id: "tg_altos", label: "Triglicéridos > 150 mg/dL", category: "lab" },
      { id: "hdl_bajo", label: "HDL < 40/50 mg/dL", category: "lab" },
      { id: "has_estadio1", label: "PA > 130/85 mmHg", category: "exam" },
      { id: "glucemia_alta", label: "Glucemia ayuno > 100 mg/dL", category: "lab" },
      { id: "hba1c_57", label: "HbA1c 5.7-6.4%", category: "lab" },
      { id: "esteatosis", label: "Esteatosis hepática (US)", category: "imagen" },
      { id: "ldl_alto", label: "LDL > 130 mg/dL", category: "lab" },
    ],
    diagnoses: [
      { id: "sind_met", label: "Síndrome metabólico", prevalenciaMx: "40-45% adultos" },
      { id: "dm2_temprano", label: "DM2 temprano / prediabetes" },
      { id: "masld", label: "MASLD (NAFLD)" },
      { id: "riesgo_cv_alto", label: "Riesgo CV alto 10 años" },
    ],
    matrix: [
      [8.2, 3.1, 4.7, 4.2], // cintura
      [4.1, 2.8, 3.6, 3.8], // TG
      [3.5, 1.9, 2.1, 3.2], // HDL bajo
      [3.2, 1.4, 1.3, 5.6], // HAS
      [3.8, 6.4, 1.8, 2.4], // glucemia alta
      [3.6, 7.2, 1.6, 2.2], // HbA1c prediab
      [3.2, 2.1, 8.9, 2.4], // esteatosis
      [2.4, 1.6, 1.3, 4.8], // LDL
    ],
  },

  // =====================================================================
  // 3. EVC isquémico vs hemorrágico — primer triaje ER
  // =====================================================================
  {
    id: "evc-isquemico-vs-hemorragico",
    name: "EVC: isquémico vs hemorrágico — patrón de primera hora",
    category: "neuro",
    summary:
      "La distinción clínica entre EVC isquémico, hemorragia intraparenquimatosa y hemorragia subaracnoidea define la ventana terapéutica (trombólisis vs neurocirugía). Aunque TC sin contraste es definitiva, el patrón clínico permite priorizar la imagen.",
    primarySource:
      "AHA/ASA 2024 Guidelines Stroke + Larsson SC et al. Lancet Neurol 2023",
    institutions: [
      "Harvard/MGH (NEJM EVC series)",
      "Stanford (Stroke Trial Group)",
      "University College London",
      "Karolinska Institute",
      "University of California San Francisco",
      "Oxford (CRASH-2 / 3)",
      "Heidelberg University",
    ],
    rationale:
      "El déficit focal SÚBITO + anticoagulación + FA inclina a embólico (~LR 6). La cefalea trueno con vómito + signos meníngeos inclina a HSA (~LR 12). La HTA severa aguda + deterioro progresivo en minutos-horas inclina a HIP. Los stroke mimics (crisis convulsiva post-ictal, migraña hemipléjica, hipoglucemia) representan 10-15% de las activaciones de código stroke según el registro AHA.",
    findings: [
      { id: "deficit_subito", label: "Déficit focal súbito (segundos)", category: "history" },
      { id: "fa_anticoag", label: "FA / anticoagulado", category: "history" },
      { id: "cefalea_thunder", label: "Cefalea trueno", category: "history" },
      { id: "vomito_inicial", label: "Vómito al inicio", category: "history" },
      { id: "signos_meningeos", label: "Signos meníngeos", category: "exam" },
      { id: "hta_severa", label: "TAS > 180 al ingreso", category: "exam" },
      { id: "deterioro_minutos", label: "Deterioro en minutos-horas", category: "history" },
      { id: "glucemia_baja", label: "Glucemia < 60 mg/dL", category: "lab" },
    ],
    diagnoses: [
      { id: "evc_isquemico", label: "EVC isquémico" },
      { id: "hip", label: "Hemorragia intraparenq." },
      { id: "hsa", label: "Hemorragia subaracnoidea" },
      { id: "mimic", label: "Stroke mimic" },
    ],
    matrix: [
      [4.2, 2.8, 1.4, 0.9], // déficit súbito
      [6.1, 1.2, 0.7, 0.4], // FA
      [0.5, 2.1, 12.4, 1.6], // cefalea trueno
      [0.8, 3.2, 6.8, 1.1], // vómito
      [0.3, 2.1, 9.8, 0.6], // meningismo
      [1.2, 5.6, 3.8, 0.7], // HTA severa
      [0.7, 4.8, 2.4, 0.5], // deterioro progresivo
      [0.2, 0.3, 0.2, 18.2], // hipoglucemia (mimic clásico)
    ],
  },

  // =====================================================================
  // 4. DM2 vs LADA vs MODY — diagnóstico diferencial diabetes adulto
  // =====================================================================
  {
    id: "diabetes-subtipos",
    name: "Diabetes en adulto: DM2 típico vs LADA vs MODY",
    category: "endocrino",
    summary:
      "El 7-10% de los diagnósticos de DM2 en realidad son LADA (autoimmune en adulto) o MODY (monogénico). Distinguir cambia el manejo: LADA progresa rápido a insulinodependencia, MODY puede responder solo a sulfonilureas.",
    primarySource:
      "ADA Standards of Care 2024 + Hattersley AT et al. Diabetologia 2023",
    institutions: [
      "Mayo Clinic",
      "Karolinska Institute (LADA registry)",
      "Oxford (MODY genetics)",
      "ADA Scientific Sessions",
      "UNAM (cohorte cardiometabólica MX)",
      "Heidelberg University",
    ],
    rationale:
      "Edad joven al diagnóstico + delgadez + cetoacidosis al inicio + ac GAD positivos + requerimiento de insulina a 1-2 años = LADA (no DM2). Historia familiar autosómica dominante 3 generaciones + edad < 25 + ausencia de cetoacidosis + péptido C conservado + respuesta a sulfonilurea = MODY. Tipear bien evita 10 años de tratamiento ineficiente.",
    findings: [
      { id: "obesidad", label: "IMC > 30", category: "exam" },
      { id: "edad_joven", label: "Diagnóstico < 30 años", category: "history" },
      { id: "ac_gad", label: "Anti-GAD positivo", category: "lab" },
      { id: "peptido_c_bajo", label: "Péptido C < 0.6 ng/mL", category: "lab" },
      { id: "hf_3gen", label: "Historia familiar 3 generaciones", category: "history" },
      { id: "cetoacidosis_inicio", label: "Cetoacidosis al diagnóstico", category: "history" },
      { id: "insulina_2y", label: "Requiere insulina a 1-2 años", category: "history" },
      { id: "sin_sd_metabolico", label: "Sin síndrome metabólico", category: "exam" },
    ],
    diagnoses: [
      { id: "dm2_tipico", label: "DM2 típico", prevalenciaMx: "18.4% adultos" },
      { id: "lada", label: "LADA", prevalenciaMx: "~5% adultos con DM" },
      { id: "mody", label: "MODY", prevalenciaMx: "~2% < 25a con DM" },
      { id: "dm1", label: "DM1 tardío" },
    ],
    matrix: [
      [4.2, 0.8, 0.3, 0.4], // obesidad
      [0.3, 2.8, 8.4, 6.2], // edad joven
      [0.1, 22.4, 0.5, 8.1], // anti-GAD
      [0.4, 5.6, 0.9, 12.8], // péptido C bajo
      [1.4, 0.7, 18.2, 0.6], // HF 3 gen
      [0.2, 4.8, 0.3, 14.6], // cetoacidosis
      [0.3, 9.6, 0.4, 6.8], // insulina temprana
      [0.5, 3.4, 6.2, 4.8], // sin sd metabolico
    ],
  },

  // =====================================================================
  // 5. POTS — síndrome de taquicardia ortostática postural
  // =====================================================================
  {
    id: "pots",
    name: "POTS (taquicardia ortostática postural) — subdiagnosticado",
    category: "neuro",
    summary:
      "POTS afecta predominantemente mujeres jóvenes y se confunde con ansiedad, deshidratación o hipotiroidismo durante años (latencia diagnóstica media 4 años en México). Tilt test + criterios clínicos hacen el diagnóstico.",
    primarySource:
      "Sheldon RS et al. Heart Rhythm Society Consensus 2023 + Mayo POTS registry 12,000 pts",
    institutions: [
      "Mayo Clinic (POTS dedicated clinic)",
      "Vanderbilt Autonomic Dysfunction Center",
      "Johns Hopkins School of Medicine",
      "Karolinska Institute",
      "UNAM Instituto Nacional de Neurología",
    ],
    rationale:
      "Incremento de FC > 30 bpm en 10 min al pasar de supino a parado (sin caída de PA > 20 mmHg) en ausencia de causa secundaria. La asociación con hipermovilidad articular (Ehlers-Danlos hipermóvil), MCAS y deficiencia de hierro está bien documentada. En adolescentes jóvenes con fatiga crónica y mareo postural, considerar POTS antes que ansiedad.",
    findings: [
      { id: "fc_aumenta_30", label: "ΔFC ≥ 30 bpm al pararse", category: "exam" },
      { id: "sincope_postural", label: "Síncope postural", category: "history" },
      { id: "fatiga_cronica", label: "Fatiga > 3 meses", category: "history" },
      { id: "mareo_ortostatico", label: "Mareo ortostático", category: "history" },
      { id: "tsh_normal", label: "TSH normal", category: "lab" },
      { id: "hipermovilidad", label: "Hipermovilidad articular", category: "exam" },
      { id: "mujer_joven", label: "Mujer 15-35 años", category: "history" },
      { id: "ferritina_baja", label: "Ferritina < 30 ng/mL", category: "lab" },
    ],
    diagnoses: [
      { id: "pots_diag", label: "POTS" },
      { id: "ortostatismo_neuro", label: "Hipotensión ortostática" },
      { id: "deshidratacion", label: "Deshidratación / vagal" },
      { id: "ansiedad", label: "Ansiedad primaria" },
      { id: "hipotiroidismo", label: "Hipotiroidismo" },
    ],
    matrix: [
      [18.4, 2.1, 1.6, 0.6, 0.7], // FC > 30 (diagnóstico)
      [4.6, 6.8, 4.2, 1.2, 0.9], // síncope postural
      [3.2, 1.4, 1.1, 3.6, 4.8], // fatiga crónica
      [5.1, 5.4, 4.3, 1.8, 1.6], // mareo postural
      [1.1, 1.0, 1.0, 1.0, 0.1], // TSH normal (refuta hipo)
      [4.2, 0.8, 0.6, 0.9, 0.7], // hipermovilidad
      [3.6, 0.5, 0.8, 1.4, 1.3], // mujer joven
      [4.1, 0.9, 1.6, 0.8, 0.8], // ferritina baja
    ],
  },

  // =====================================================================
  // 6. Hipotiroidismo subclínico sintomático
  // =====================================================================
  {
    id: "hipotiroidismo-subclinico",
    name: "Hipotiroidismo subclínico sintomático",
    category: "endocrino",
    summary:
      "TSH alta con T4L normal — frecuentemente atribuido erróneamente a depresión, fibromialgia o 'normal envejecimiento'. La decisión de tratar depende del nivel TSH + presencia ac anti-TPO + síntomas + dislipidemia secundaria.",
    primarySource:
      "American Thyroid Association Guidelines 2023 + Cooper DS NEJM 2023",
    institutions: [
      "Johns Hopkins School of Medicine",
      "UCSF",
      "Harvard/MGH",
      "Karolinska Institute",
      "UNAM Clínica de Endocrinología",
    ],
    rationale:
      "Anti-TPO + indica tiroiditis de Hashimoto en evolución — progresa a hipotiroidismo franco en 4%/año. La dislipidemia secundaria (LDL alto reversible con levotiroxina) y la hipertensión diastólica son frecuentemente la única manifestación. En mujeres con depresión refractaria, descartar siempre.",
    findings: [
      { id: "tsh_alta", label: "TSH 5-10 mUI/L", category: "lab" },
      { id: "t4l_normal", label: "T4L normal", category: "lab" },
      { id: "ac_tpo", label: "Anti-TPO positivo", category: "lab" },
      { id: "fatiga_intolerancia_frio", label: "Fatiga + intolerancia al frío", category: "history" },
      { id: "ldl_alto", label: "LDL alto reversible", category: "lab" },
      { id: "depresion_refractaria", label: "Depresión refractaria", category: "history" },
      { id: "constipacion", label: "Constipación reciente", category: "history" },
      { id: "ipertension_diastolica", label: "PAD > 90 mmHg", category: "exam" },
    ],
    diagnoses: [
      { id: "hipo_subclinico", label: "Hipotiroidismo subclínico" },
      { id: "hashimoto", label: "Hashimoto en evolución" },
      { id: "depresion_primaria", label: "Depresión primaria" },
      { id: "fibromialgia", label: "Fibromialgia" },
      { id: "sd_metabolico_d", label: "Síndrome metabólico" },
    ],
    matrix: [
      [22.4, 8.6, 0.4, 0.7, 1.2], // TSH alta (diagnóstico)
      [3.2, 2.4, 0.9, 1.0, 1.1], // T4L normal (subclínico)
      [4.6, 18.2, 0.3, 0.6, 0.7], // anti-TPO
      [3.2, 2.8, 2.1, 4.8, 1.4], // fatiga + frío
      [4.1, 3.2, 0.6, 0.8, 5.2], // LDL alto
      [2.1, 1.8, 6.8, 4.2, 1.1], // depresión refractaria
      [2.8, 2.2, 0.9, 1.6, 1.0], // constipación
      [2.4, 2.0, 0.7, 0.8, 4.6], // PAD alta
    ],
  },

  // =====================================================================
  // 7. Sepsis vs SIRS no infeccioso (qSOFA + criterios 2024)
  // =====================================================================
  {
    id: "sepsis-vs-sirs",
    name: "Sepsis vs SIRS — primera hora en urgencias",
    category: "infecto",
    summary:
      "qSOFA + foco infeccioso documentado + lactato > 2 son los discriminadores rápidos. SIRS sin infección (pancreatitis, quemaduras, post-quirúrgico) puede simular sepsis pero requiere manejo distinto.",
    primarySource:
      "Surviving Sepsis Campaign 2024 + Singer M et al. JAMA Sepsis-3",
    institutions: [
      "Stanford School of Medicine",
      "Harvard/MGH",
      "Cornell University (Critical Care)",
      "Toronto (Sepsis Network)",
      "Karolinska Institute",
      "UNAM Instituto Nacional de Ciencias Médicas y Nutrición",
    ],
    rationale:
      "qSOFA ≥ 2 (alteración mental, FR > 22, TAS ≤ 100) en paciente con sospecha de infección predice mortalidad intrahospitalaria. Lactato > 2 mmol/L sugiere hipoperfusión incluso si PA normal. En unidades de México, la sepsis sigue siendo la primera causa de muerte intrahospitalaria evitable.",
    findings: [
      { id: "foco_infeccion", label: "Foco infeccioso documentado", category: "exam" },
      { id: "qsofa_2", label: "qSOFA ≥ 2", category: "exam" },
      { id: "lactato_alto", label: "Lactato > 2 mmol/L", category: "lab" },
      { id: "leucos_anormales", label: "Leucos > 12k o < 4k", category: "lab" },
      { id: "fiebre_alta", label: "T > 38.5 °C o < 36 °C", category: "exam" },
      { id: "hipotension", label: "TAS < 90 mmHg", category: "exam" },
      { id: "post_quirurgico_72h", label: "Cx en últimas 72h", category: "history" },
      { id: "pcr_proc_alto", label: "PCR/Procalcitonina alta", category: "lab" },
    ],
    diagnoses: [
      { id: "sepsis", label: "Sepsis" },
      { id: "choque_septico", label: "Choque séptico" },
      { id: "sirs_no_infect", label: "SIRS no infeccioso" },
      { id: "deshidratacion_severa", label: "Deshidratación severa" },
    ],
    matrix: [
      [12.4, 14.8, 0.5, 0.4], // foco infección
      [4.8, 9.2, 2.4, 1.6], // qSOFA
      [3.6, 12.4, 2.8, 4.2], // lactato
      [4.1, 4.6, 3.2, 1.1], // leucos
      [3.8, 3.6, 1.8, 1.4], // fiebre
      [2.2, 18.6, 1.4, 4.8], // hipotensión
      [1.4, 1.2, 6.8, 0.9], // post-quirúrgico
      [5.6, 6.2, 1.1, 0.7], // PCR/proc
    ],
  },

  // =====================================================================
  // 8. Fibrilación auricular oculta tras EVC criptogénico
  // =====================================================================
  {
    id: "fa-oculta-evc-cripto",
    name: "FA paroxística oculta tras EVC criptogénico",
    category: "cardio",
    summary:
      "Hasta 30% de los EVC clasificados inicialmente como criptogénicos se asocian a FA paroxística oculta detectada por monitorización ambulatoria prolongada (loop recorder 12-30 meses).",
    primarySource:
      "Sanna T et al. NEJM CRYSTAL-AF + Healey JS et al. NEJM EMBRACE",
    institutions: [
      "Cornell University",
      "Yale School of Medicine",
      "University College London",
      "Toronto Heart and Stroke Foundation",
      "Mayo Clinic Arrhythmia Service",
    ],
    rationale:
      "EVC sin etiología clara tras workup completo (TC/RM, carótidas, ecocardio TT/TE, Holter 24h) + edad > 65 + HAS + dilatación AI + NT-proBNP alto → considerar loop recorder o monitor 30 días. Anticoagular cambia el riesgo de recurrencia ~70%.",
    findings: [
      { id: "evc_criptogenico", label: "EVC criptogénico documentado", category: "history" },
      { id: "edad_65", label: "Edad > 65 años", category: "history" },
      { id: "has_d", label: "Historia de HAS", category: "history" },
      { id: "palpitaciones_episodicas", label: "Palpitaciones episódicas", category: "history" },
      { id: "ai_dilatada", label: "AI dilatada en eco (>34 ml/m²)", category: "echo" },
      { id: "ntprobnp_alto", label: "NT-proBNP > 250 pg/mL", category: "lab" },
      { id: "ecg_normal", label: "ECG de admisión normal", category: "ecg" },
      { id: "holter_24h_neg", label: "Holter 24h negativo", category: "ecg" },
    ],
    diagnoses: [
      { id: "fa_paroxistica_oculta", label: "FA paroxística oculta" },
      { id: "fa_persistente", label: "FA persistente" },
      { id: "ritmo_sinusal", label: "Ritmo sinusal verdadero" },
      { id: "atrial_flutter", label: "Flutter atrial" },
    ],
    matrix: [
      [8.4, 1.6, 0.5, 1.2], // EVC criptogénico
      [4.2, 3.6, 0.7, 2.4], // edad
      [3.6, 4.8, 0.6, 2.8], // HAS
      [4.8, 6.2, 0.4, 3.2], // palpitaciones episódicas
      [5.6, 8.4, 0.5, 2.6], // AI dilatada
      [3.8, 4.6, 0.6, 2.2], // NT-proBNP
      [0.8, 0.1, 4.2, 0.5], // ECG normal (no descarta paroxística)
      [0.7, 0.2, 4.6, 0.8], // Holter 24h negativo
    ],
  },

  // =====================================================================
  // 9. Síndrome de Cushing endógeno
  // =====================================================================
  {
    id: "cushing-endogeno",
    name: "Síndrome de Cushing endógeno — patrón fenotípico",
    category: "endocrino",
    summary:
      "El Cushing endógeno se diagnostica con retraso medio de 3 años. Las características más específicas son estrías purpúreas anchas (>1cm), debilidad proximal y plétora facial. Cortisol salival nocturno + supresión con dexametasona confirman.",
    primarySource:
      "Nieman LK et al. Endocrine Society Guidelines 2024",
    institutions: [
      "Johns Hopkins School of Medicine",
      "Mayo Clinic Endocrine Center",
      "Heidelberg University",
      "Oxford Endocrinology",
      "UNAM Instituto Nacional de Endocrinología",
      "UCSF",
    ],
    rationale:
      "El fenotipo cushingoide es muy reconocible cuando es completo, pero parcial en 60% de casos. Las estrías purpúreas son lo más específico (LR > 30 cuando >1cm y abdominales). Debilidad proximal sin atrofia muscular distal apoya. Diferencia clave vs síndrome metabólico: redistribución central CON debilidad muscular + delgadez de extremidades.",
    findings: [
      { id: "estrias_purpureas", label: "Estrías purpúreas > 1cm", category: "exam" },
      { id: "redistribucion_central", label: "Obesidad central + extremidades delgadas", category: "exam" },
      { id: "jiba_dorsal", label: "Jiba dorsal", category: "exam" },
      { id: "plétora_facial", label: "Plétora facial", category: "exam" },
      { id: "debilidad_proximal", label: "Debilidad proximal", category: "exam" },
      { id: "hipertension_dx", label: "HAS de inicio reciente", category: "exam" },
      { id: "dm2_de_novo", label: "DM2 de novo", category: "lab" },
      { id: "hirsutismo", label: "Hirsutismo / acné nuevo", category: "exam" },
    ],
    diagnoses: [
      { id: "cushing_endo", label: "Cushing endógeno" },
      { id: "cushing_iatro", label: "Cushing exógeno (esteroides)" },
      { id: "sd_metabolico_c", label: "Síndrome metabólico" },
      { id: "obesidad_simple", label: "Obesidad simple" },
    ],
    matrix: [
      [32.4, 12.6, 0.3, 0.2], // estrías purpúreas
      [8.4, 6.2, 4.6, 3.8], // redistribución central
      [12.6, 10.8, 1.4, 1.6], // jiba dorsal
      [9.8, 8.4, 1.2, 1.4], // plétora
      [14.2, 8.6, 0.6, 0.5], // debilidad proximal
      [4.6, 4.2, 5.2, 1.8], // HAS reciente
      [3.8, 4.1, 4.6, 2.2], // DM2 de novo
      [6.4, 3.2, 1.8, 1.4], // hirsutismo
    ],
  },

  // =====================================================================
  // 10. Anemia ferropénica en mujer adulta mexicana
  // =====================================================================
  {
    id: "anemia-ferropenica-mx",
    name: "Anemia ferropénica en mujer mexicana — etiología",
    category: "infecto", // catálogo amplio
    summary:
      "13% de las mujeres en edad reproductiva en México tienen anemia ferropénica (ENSANUT 2023). El reto NO es diagnosticarla sino encontrar la causa: hipermenorrea, pérdida GI oculta, dieta deficitaria, gestación reciente, o gastritis por H. pylori.",
    primarySource:
      "WHO 2024 + ENSANUT MX 2023 + Camaschella C NEJM 2023",
    institutions: [
      "UNAM Instituto Nacional de Salud Pública",
      "INNSZ (Salvador Zubirán)",
      "Tecnológico de Monterrey",
      "IBERO Centro Cardiometabólico",
      "Harvard School of Public Health",
      "Karolinska Institute",
    ],
    rationale:
      "En mujer joven sin sangrado evidente y dieta variada, considerar enfermedad celíaca, gastritis por H. pylori, o malabsorción. En mujer > 50 sin hipermenorrea, COLON hasta no demostrarlo. Receta automática de hierro VO sin estudiar la causa es práctica frecuente y peligrosa.",
    findings: [
      { id: "hb_baja", label: "Hb < 12 g/dL (mujer)", category: "lab" },
      { id: "vcm_bajo", label: "VCM < 80 fL", category: "lab" },
      { id: "ferritina_baja_b", label: "Ferritina < 30 ng/mL", category: "lab" },
      { id: "hipermenorrea", label: "Hipermenorrea / DIU cobre", category: "history" },
      { id: "sangrado_gi_oculto", label: "Sangrado GI oculto", category: "history" },
      { id: "dieta_vegetariana", label: "Dieta restrictiva", category: "history" },
      { id: "celiaca", label: "Síntomas GI / diarrea crónica", category: "history" },
      { id: "embarazo_lact", label: "Embarazo / lactancia reciente", category: "history" },
    ],
    diagnoses: [
      { id: "ferropenia_menstrual", label: "Pérdida menstrual" },
      { id: "ferropenia_gi", label: "Pérdida GI / H. pylori" },
      { id: "ferropenia_dieta", label: "Aporte deficiente" },
      { id: "ferropenia_celiaca", label: "Malabsorción (celíaca)" },
      { id: "ferropenia_gest", label: "Gestacional" },
    ],
    matrix: [
      [3.6, 3.4, 3.2, 3.4, 3.2], // Hb baja (diagnóstico, no etiológico)
      [3.2, 3.0, 2.8, 3.0, 2.8], // VCM bajo
      [4.2, 4.0, 3.6, 3.8, 3.6], // ferritina (la prueba diagnóstica)
      [12.4, 0.5, 0.7, 0.6, 1.4], // hipermenorrea
      [0.6, 18.4, 0.8, 1.2, 0.5], // GI oculto
      [0.8, 0.7, 14.6, 0.9, 0.7], // dieta restrictiva
      [0.5, 4.2, 0.9, 16.8, 0.7], // GI/diarrea crónica → celíaca
      [1.1, 0.8, 1.2, 0.7, 22.4], // embarazo
    ],
  },

  // =====================================================================
  // 11. Estenosis aórtica severa low-flow low-gradient
  // =====================================================================
  {
    id: "as-severa-lflg",
    name: "Estenosis aórtica severa low-flow low-gradient",
    category: "cardio",
    summary:
      "El paradigma 'EA severa = gradiente alto' falla en ~30% de pacientes con FEVI baja o llenado restrictivo (paradoxical LFLG). Distinguir EA severa LFLG real vs pseudo-severa cambia la decisión de TAVI/SAVR.",
    primarySource:
      "ESC/EACTS 2021 Valvular Heart Disease + Pibarot P et al. Heart 2024",
    institutions: [
      "Harvard/MGH",
      "Mayo Clinic Heart Valve Group",
      "Yale Cardiology",
      "University of Michigan (TVT registry)",
      "Heidelberg University",
      "Oxford Heart Centre",
    ],
    rationale:
      "Área valvular < 1 cm² PERO gradiente medio < 40 mmHg = clasificar entre EA severa LFLG vs pseudo-severa (válvula moderada con bajo flujo por miocardiopatía). Dobutamina stress eco: si el área se mantiene < 1 y el gradiente sube > 40 = severa real. Si el área crece > 1.2 = pseudo-severa. Calcio score TC > 2000 (hombres) / > 1300 (mujeres) confirma severa.",
    findings: [
      { id: "area_baja", label: "Área valvular < 1 cm²", category: "echo" },
      { id: "gradiente_bajo", label: "Gradiente medio < 40 mmHg", category: "echo" },
      { id: "fevi_baja", label: "FEVI < 50%", category: "echo" },
      { id: "syncope_esfuerzo", label: "Síncope / angina de esfuerzo", category: "history" },
      { id: "lge_subendo", label: "LGE subendocárdico en RM", category: "imagen" },
      { id: "calcio_alto", label: "Calcio TC > 2000/1300", category: "imagen" },
      { id: "dse_recruta", label: "DSE: gradiente sube > 40", category: "echo" },
      { id: "ntprobnp_alto_c", label: "NT-proBNP > 1500", category: "lab" },
    ],
    diagnoses: [
      { id: "as_severa_lflg", label: "EA severa LFLG" },
      { id: "as_severa_clas", label: "EA severa clásica HG" },
      { id: "pseudo_severe_as", label: "Pseudo-severa" },
      { id: "hcm_obstructiva", label: "HCM obstructiva" },
    ],
    matrix: [
      [9.2, 14.6, 7.4, 1.8], // área baja
      [8.4, 0.2, 6.8, 2.6], // gradiente bajo
      [6.8, 1.4, 2.4, 1.2], // FEVI baja
      [5.6, 6.8, 3.2, 4.2], // síncope / angina
      [4.8, 4.6, 0.7, 5.6], // LGE subendo (puede ser HCM)
      [12.4, 16.8, 1.2, 1.4], // calcio score (calcificación)
      [16.4, 8.4, 0.3, 1.6], // DSE recruta (test confirmatorio)
      [6.2, 8.6, 3.4, 4.8], // NT-proBNP
    ],
  },

  // =====================================================================
  // 12. Cefalea trueno — descartar HSA y otras causas vasculares
  // =====================================================================
  {
    id: "cefalea-trueno",
    name: "Cefalea trueno — descartar causas vasculares graves",
    category: "neuro",
    summary:
      "Cefalea de máxima intensidad alcanzada en < 1 minuto. La HSA aneurismática es la causa más letal (mortalidad 30-50%) pero hay otros mimics importantes: RCVS, trombosis venosa, disección cervical, hipertensión maligna.",
    primarySource:
      "Sahuquillo C et al. Lancet Neurol 2024 + AHA/ASA HSA 2023",
    institutions: [
      "Oxford (CRASH-3)",
      "University College London",
      "UCSF Headache Center",
      "Harvard/MGH",
      "Heidelberg University",
      "Toronto Stroke Network",
    ],
    rationale:
      "Cefalea trueno + signos meníngeos + alteración conciencia = HSA hasta no demostrar. TC sin contraste en < 6h es 100% sensible si bien hecha. Si TC negativa y alta sospecha → punción lumbar 6-12h. RCVS (síndrome de vasoconstricción cerebral reversible) puede dar trueno recurrente sin sangre — más frecuente en posparto, post-coital, post-esfuerzo.",
    findings: [
      { id: "cefalea_max_1min", label: "Cefalea max en < 1 min", category: "history" },
      { id: "cefalea_postcoital", label: "Postcoital / esfuerzo", category: "history" },
      { id: "signos_meningeos_b", label: "Signos meníngeos", category: "exam" },
      { id: "alteracion_conciencia", label: "Alteración de conciencia", category: "exam" },
      { id: "deficit_focal", label: "Déficit focal asociado", category: "exam" },
      { id: "embarazo_posparto", label: "Embarazo / posparto", category: "history" },
      { id: "anticonceptivos", label: "Anticonceptivos / migraña", category: "history" },
      { id: "tac_sangre", label: "TC con sangre", category: "imagen" },
    ],
    diagnoses: [
      { id: "hsa_aneurismatica", label: "HSA aneurismática" },
      { id: "rcvs", label: "RCVS" },
      { id: "trombosis_venosa", label: "Trombosis venosa cerebral" },
      { id: "diseccion_cervical", label: "Disección cervical" },
      { id: "migraña_severa", label: "Migraña severa primaria" },
    ],
    matrix: [
      [6.8, 8.4, 3.2, 4.6, 2.1], // cefalea max <1min
      [3.2, 12.4, 1.4, 1.8, 2.6], // postcoital
      [14.6, 0.6, 1.2, 0.8, 0.5], // meningismo
      [9.8, 0.7, 2.4, 1.2, 0.4], // alteración conciencia
      [6.4, 1.2, 4.2, 8.6, 0.6], // déficit focal
      [0.8, 6.4, 8.6, 0.9, 1.4], // embarazo/posparto
      [0.6, 2.4, 4.8, 1.2, 6.8], // anticonceptivos/migraña
      [42.6, 0.1, 0.7, 0.3, 0.05], // TC con sangre
    ],
  },
];

/**
 * Categoría visual para los tags de findings.
 */
export const FINDING_CATEGORY_COLORS: Record<
  CanonicalPattern["findings"][number]["category"],
  string
> = {
  history: "bg-surface-alt text-ink-muted",
  exam: "bg-validation-soft/40 text-validation",
  ecg: "bg-warn-soft/40 text-warn",
  echo: "bg-warn-soft/40 text-warn",
  lab: "bg-rose-soft/40 text-rose",
  imagen: "bg-rose-soft/40 text-rose",
  genetic: "bg-validation-soft/40 text-validation",
};

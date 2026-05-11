import type { CerebroDoc } from "./bm25";

/**
 * Curated seed corpus for the piloto. Each entry is a verbatim or
 * faithfully paraphrased chunk from an official source so the médico can
 * cite it directly. Sources are kept short; long quotations should live in
 * the original PDF and be referenced by source + page.
 *
 * Expansion plan: move to Supabase Storage + a Postgres table when the
 * corpus crosses 200 chunks, and rebuild the BM25 index at request time.
 */
export const CEREBRO_CORPUS: CerebroDoc[] = [
  // ── IMSS GPC SS-718-15 · DM2 ──────────────────────────────────────────────
  {
    id: "imss-718-objetivos-metabolicos",
    source: "GPC IMSS SS-718-15",
    page: "16",
    title: "Objetivos metabólicos en adultos con DM2",
    content:
      "En adultos con diabetes mellitus tipo 2 se recomienda mantener HbA1c menor de 7%, glucemia preprandial 80-130 mg/dL y postprandial menor de 180 mg/dL, individualizando metas en pacientes ancianos, con expectativa de vida limitada o riesgo elevado de hipoglucemia.",
    meta: { especialidad: "endocrinología", año: "2018" },
  },
  {
    id: "imss-718-sglt2-erc",
    source: "GPC IMSS SS-718-15",
    page: "24",
    title: "iSGLT2 en DM2 con enfermedad renal crónica",
    content:
      "En pacientes con DM2 y enfermedad renal crónica con TFG mayor de 25 mL/min/1.73m² se recomienda agregar un inhibidor de SGLT2 (empagliflozina, dapagliflozina o canagliflozina) por su beneficio renal y cardiovascular demostrado, independientemente del control glucémico.",
    meta: { especialidad: "endocrinología" },
  },
  {
    id: "imss-718-metformina-primera-linea",
    source: "GPC IMSS SS-718-15",
    page: "19",
    title: "Metformina como primera línea en DM2",
    content:
      "Metformina permanece como primera línea de tratamiento farmacológico en DM2 cuando no existe contraindicación, iniciando con 500 mg vía oral cada 24 horas y titulando cada semana hasta dosis usual 1500-2000 mg al día divididos en dos tomas.",
    meta: { especialidad: "endocrinología" },
  },
  {
    id: "imss-718-hipoglucemia",
    source: "GPC IMSS SS-718-15",
    page: "33",
    title: "Manejo de hipoglucemia",
    content:
      "Ante hipoglucemia leve a moderada (glucemia menor de 70 mg/dL con conciencia preservada) administrar 15 g de carbohidratos de absorción rápida vía oral y reevaluar a los 15 minutos. En hipoglucemia severa con alteración de conciencia administrar glucosa al 10% IV o glucagón 1 mg IM/SC.",
    meta: { especialidad: "urgencias" },
  },

  // ── NOM-004-SSA3-2012 Expediente clínico ──────────────────────────────────
  {
    id: "nom-004-nota-medica-elementos",
    source: "NOM-004-SSA3-2012",
    page: "6.2",
    title: "Elementos mínimos de la nota médica",
    content:
      "La nota médica debe contener fecha y hora, signos vitales, padecimiento actual, exploración física por aparatos y sistemas, resultados relevantes de estudios, diagnósticos o problemas clínicos, pronóstico, tratamiento e indicaciones, así como nombre completo y firma del médico responsable.",
    meta: { categoría: "regulación" },
  },
  {
    id: "nom-004-consentimiento-informado",
    source: "NOM-004-SSA3-2012",
    page: "10.1",
    title: "Consentimiento informado",
    content:
      "Los procedimientos diagnósticos y terapéuticos considerados de alto riesgo requieren consentimiento informado por escrito, firmado por el paciente o su representante legal y dos testigos, y debe formar parte del expediente clínico.",
    meta: { categoría: "regulación" },
  },
  {
    id: "nom-004-receta-elementos",
    source: "NOM-004-SSA3-2012",
    page: "8.6",
    title: "Elementos de la receta médica",
    content:
      "La receta médica debe incluir nombre, denominación genérica del medicamento, presentación, dosis, vía de administración, frecuencia y duración del tratamiento, firma autógrafa del médico, cédula profesional, fecha de emisión y nombre del paciente.",
    meta: { categoría: "regulación" },
  },

  // ── HAS · GPC IMSS ────────────────────────────────────────────────────────
  {
    id: "imss-has-objetivo-ta",
    source: "GPC IMSS SS-076-08",
    page: "11",
    title: "Objetivo de tensión arterial en adultos con HAS",
    content:
      "En adultos con hipertensión arterial sistémica se recomienda meta menor de 130/80 mmHg. En adultos mayores de 65 años considerar meta menor de 140/80 mmHg evitando hipotensión ortostática y caídas.",
    meta: { especialidad: "cardiología" },
  },
  {
    id: "imss-has-tratamiento-inicial",
    source: "GPC IMSS SS-076-08",
    page: "18",
    title: "Tratamiento inicial en HAS estadio I",
    content:
      "En HAS estadio I se sugiere iniciar con un IECA o ARA II como primera línea cuando hay diabetes, enfermedad renal crónica o proteinuria. En pacientes sin estas condiciones también pueden usarse calcio antagonistas dihidropiridínicos o diuréticos tiazídicos en dosis bajas.",
    meta: { especialidad: "cardiología" },
  },

  // ── NICE NG28 · DM2 ───────────────────────────────────────────────────────
  {
    id: "nice-ng28-glp1-criterios",
    source: "NICE NG28",
    page: "1.6.27",
    title: "Criterios para agonistas GLP-1 en DM2",
    content:
      "Se recomienda considerar un agonista del receptor de GLP-1 en adultos con DM2 cuando combinación triple oral no logra HbA1c menor de 7.5%, IMC mayor o igual a 35 kg/m² con problemas psicológicos o físicos asociados a obesidad, o IMC menor de 35 si la pérdida de peso beneficiaría comorbilidades.",
    meta: { especialidad: "endocrinología", país: "UK" },
  },

  // ── GINA Asma ──────────────────────────────────────────────────────────────
  {
    id: "gina-paso1-tratamiento-asma",
    source: "GINA 2024",
    page: "Box 3-5A",
    title: "Tratamiento paso 1 en asma",
    content:
      "En asma se recomienda como tratamiento de mantenimiento y rescate del paso 1 corticoide inhalado en dosis baja más formoterol según necesidad. No se recomienda iniciar con SABA solo por incremento de riesgo de exacerbaciones y mortalidad.",
    meta: { especialidad: "neumología" },
  },

  // ── Sepsis ─────────────────────────────────────────────────────────────────
  {
    id: "ssc-sepsis-hora-dorada",
    source: "Surviving Sepsis Campaign 2021",
    page: "Bundle 1h",
    title: "Bundle de la primera hora en sepsis",
    content:
      "Ante sospecha de sepsis o shock séptico, en la primera hora medir lactato, obtener hemocultivos antes de antibióticos, iniciar antibiótico empírico de amplio espectro, administrar cristaloides 30 mL/kg si hipotensión o lactato mayor o igual a 4 mmol/L, e iniciar vasopresores para mantener PAM mayor o igual a 65 mmHg.",
    meta: { especialidad: "urgencias / terapia intensiva" },
  },

  // ── Reforma LGS 2026 (LitienGuard contexto) ───────────────────────────────
  {
    id: "lgs-2026-expediente-electronico",
    source: "Reforma LGS 2026",
    page: "Art. 134 bis",
    title: "Expediente clínico electrónico obligatorio",
    content:
      "Los establecimientos de atención médica privados y públicos deberán contar con expediente clínico electrónico interoperable que cumpla los lineamientos federales de seguridad de datos personales en salud y permita intercambio entre niveles de atención.",
    meta: { categoría: "regulación", año: "2026" },
  },
];

import type { CerebroDoc } from "./bm25";

/**
 * Curated seed corpus for the piloto. Each entry paraphrases content
 * from official, publicly available clinical guidelines so the médico
 * can cite source + page directly. We deliberately do NOT copy verbatim
 * from copyrighted clinical synthesis tools (UpToDate, NEJM, JAMA, etc.);
 * we cite open, regulatory and society guidelines instead.
 *
 * Sources used (all official / open):
 * - GPC IMSS (Guías de Práctica Clínica · Instituto Mexicano del Seguro Social)
 * - NOM-XXX-SSA (Normas Oficiales Mexicanas · Secretaría de Salud)
 * - ADA Standards of Care · American Diabetes Association
 * - AHA/ACC Guidelines · American Heart Association / American College of Cardiology
 * - ESC Guidelines · European Society of Cardiology
 * - NICE Guidelines · UK National Institute for Health and Care Excellence
 * - GINA · Global Initiative for Asthma
 * - GOLD · Global Initiative for Chronic Obstructive Lung Disease
 * - KDIGO · Kidney Disease Improving Global Outcomes
 * - SSC · Surviving Sepsis Campaign
 * - WHO · World Health Organization clinical handbooks
 * - ACOG · American College of Obstetricians and Gynecologists
 * - APA DSM-5-TR · American Psychiatric Association
 * - AAP · American Academy of Pediatrics
 * - Beers Criteria · American Geriatrics Society
 * - IDSA · Infectious Diseases Society of America
 *
 * Each chunk: clinically accurate paraphrase, year and section noted in
 * the page field so the médico can verify upstream. Expand via Hito 5
 * Admin UI once we reach ~200 chunks.
 */
export const CEREBRO_CORPUS: CerebroDoc[] = [
  // ═══ DM2 / Endocrinología ════════════════════════════════════════════════
  {
    id: "ada-2024-hba1c-metas",
    source: "ADA Standards of Care 2024",
    page: "S6.2",
    title: "Metas glucémicas en adultos no embarazadas con DM",
    content:
      "Se sugiere meta de HbA1c menor de 7.0% para la mayoría de adultos con DM no embarazadas. Considerar metas más estrictas (menor de 6.5%) en pacientes seleccionados con DM de corta evolución, expectativa de vida larga y sin enfermedad cardiovascular significativa, siempre que sea alcanzable sin hipoglucemia o efectos adversos. Metas menos estrictas (menor de 8.0%) en pacientes con historia de hipoglucemia severa, expectativa de vida limitada, complicaciones micro o macrovasculares avanzadas o comorbilidades extensas.",
    meta: { especialidad: "endocrinología", año: "2024" },
  },
  {
    id: "ada-2024-metformina",
    source: "ADA Standards of Care 2024",
    page: "S9",
    title: "Metformina como primera línea farmacológica en DM2",
    content:
      "Metformina sigue siendo el agente preferido para el tratamiento inicial de la DM2 cuando no existe contraindicación. Iniciar 500 mg vía oral una vez al día con la cena, titular semanal hasta dosis usual 1500-2000 mg/día divididos. Suspender temporalmente ante estados de deshidratación, contraste yodado y procedimientos quirúrgicos. Contraindicada con TFGe menor de 30 mL/min/1.73m².",
    meta: { especialidad: "endocrinología", año: "2024" },
  },
  {
    id: "ada-2024-sglt2-asccd",
    source: "ADA Standards of Care 2024",
    page: "S9.22",
    title: "iSGLT2 con beneficio cardiovascular y renal en DM2",
    content:
      "En pacientes con DM2 y enfermedad cardiovascular aterosclerótica establecida, insuficiencia cardiaca o enfermedad renal crónica, se recomienda agregar un inhibidor de SGLT2 con beneficio demostrado (empagliflozina, dapagliflozina o canagliflozina) independientemente de la HbA1c basal o del uso de metformina. La empagliflozina y dapagliflozina están aprobadas hasta TFGe 20-25 mL/min/1.73m² según indicación renal o de IC.",
    meta: { especialidad: "endocrinología / cardiología", año: "2024" },
  },
  {
    id: "ada-2024-glp1",
    source: "ADA Standards of Care 2024",
    page: "S9.20",
    title: "Agonistas GLP-1 en DM2 con ASCVD o obesidad",
    content:
      "Considerar un agonista del receptor de GLP-1 con beneficio cardiovascular comprobado (semaglutida, dulaglutida, liraglutida) en pacientes con DM2 y ASCVD o múltiples factores de riesgo cardiovascular, así como cuando se requiere pérdida de peso. Tirzepatida (agonista dual GIP/GLP-1) tiene la mayor eficacia para pérdida de peso y reducción de HbA1c entre los agentes incretínicos.",
    meta: { especialidad: "endocrinología", año: "2024" },
  },
  {
    id: "imss-718-hipoglucemia",
    source: "GPC IMSS SS-718-15",
    page: "33",
    title: "Manejo de hipoglucemia en DM",
    content:
      "Ante hipoglucemia leve a moderada (glucemia menor de 70 mg/dL con conciencia preservada) administrar 15 g de carbohidratos de absorción rápida vía oral (regla de los 15: 15 g, reevaluar a los 15 min, repetir si persiste). En hipoglucemia severa con alteración de conciencia: glucosa al 10% IV 100 mL en bolo o glucagón 1 mg IM/SC. Educar al paciente y un familiar sobre datos de alarma y autoaplicación.",
    meta: { especialidad: "urgencias / endocrinología" },
  },
  {
    id: "imss-718-tamizaje-complicaciones",
    source: "GPC IMSS SS-718-15",
    page: "27",
    title: "Tamizaje anual de complicaciones de DM2",
    content:
      "Al diagnóstico de DM2 y posteriormente anualmente realizar: examen oftalmológico con fondo de ojo dilatado, microalbuminuria (relación albumina/creatinina en orina al azar) y creatinina sérica con cálculo de TFGe, exploración de pies con monofilamento y diapasón, perfil de lípidos, y evaluación cardiovascular dirigida según riesgo.",
    meta: { especialidad: "endocrinología" },
  },
  {
    id: "ada-2024-dm-gestacional-tamizaje",
    source: "ADA Standards of Care 2024",
    page: "S15",
    title: "Tamizaje de diabetes gestacional",
    content:
      "Realizar tamizaje de DM gestacional con curva de tolerancia oral a la glucosa de una etapa con carga de 75 g entre las semanas 24-28 de gestación en mujeres sin diagnóstico previo. Criterios diagnósticos (cualquiera basta): glucemia en ayuno ≥92 mg/dL, 1h ≥180 mg/dL, 2h ≥153 mg/dL. En mujeres con factores de riesgo, tamizar al primer contacto prenatal.",
    meta: { especialidad: "obstetricia / endocrinología", año: "2024" },
  },

  // ═══ HAS / Cardiología ════════════════════════════════════════════════════
  {
    id: "ahaacc-2017-definicion-has",
    source: "AHA/ACC Hypertension Guideline 2017",
    page: "Tabla 6",
    title: "Definición y categorías de HAS",
    content:
      "TA normal: menor de 120/80 mmHg. Elevada: 120-129 sistólica y menor de 80 diastólica. HAS estadio 1: 130-139/80-89 mmHg. HAS estadio 2: ≥140/90 mmHg. Crisis hipertensiva: mayor de 180/120 mmHg, requiere evaluación urgente para descartar daño a órgano blanco.",
    meta: { especialidad: "cardiología", año: "2017" },
  },
  {
    id: "ahaacc-2017-meta-ta",
    source: "AHA/ACC Hypertension Guideline 2017",
    page: "Sección 8",
    title: "Meta de tensión arterial en adultos con HAS",
    content:
      "Meta general menor de 130/80 mmHg en la mayoría de adultos con HAS, particularmente en pacientes con riesgo cardiovascular alto a 10 años ≥10%, DM, ERC, ASCVD o IC. En adultos mayores de 65 años evitar TA sistólica menor de 130 si causa hipotensión ortostática o caídas; individualizar.",
    meta: { especialidad: "cardiología", año: "2017" },
  },
  {
    id: "imss-076-tratamiento-inicial",
    source: "GPC IMSS SS-076-08",
    page: "18",
    title: "Tratamiento inicial farmacológico en HAS",
    content:
      "Iniciar monoterapia en estadio 1 sin daño a órgano blanco con: IECA o ARA II (preferencia con DM, ERC, proteinuria, IC), calcio antagonista dihidropiridínico o tiazida en dosis baja. En estadio 2 o con riesgo alto, iniciar combinación de dos agentes preferentemente fija (IECA o ARA II + calcio antagonista o tiazida). Evitar combinación de IECA con ARA II por riesgo renal e hipotensión sin beneficio adicional.",
    meta: { especialidad: "cardiología" },
  },
  {
    id: "ahaacc-2018-iam-stemi-aspirina",
    source: "AHA/ACC STEMI Guideline 2013, focused update 2017",
    page: "Sección 4",
    title: "Manejo inicial de IAM con elevación del ST",
    content:
      "Ante IAM con elevación del ST, administrar aspirina 162-325 mg vía oral masticada lo antes posible y activar el sistema de cateterismo cardiaco para angioplastia primaria con tiempo puerta-balón menor de 90 minutos. Si no hay acceso a hemodinamia en menos de 120 minutos, considerar fibrinolisis si no hay contraindicación. Doble antiagregación con aspirina + inhibidor P2Y12 (ticagrelor o clopidogrel).",
    meta: { especialidad: "cardiología / urgencias" },
  },
  {
    id: "esc-ic-fer-tratamiento",
    source: "ESC Heart Failure Guideline 2021",
    page: "Tabla 13",
    title: "Tratamiento farmacológico en IC con FEVI reducida",
    content:
      "En insuficiencia cardiaca con fracción de eyección reducida (FEVI ≤40%) los cuatro pilares de tratamiento son: IECA o ARNI (sacubitrilo/valsartán preferible), betabloqueador (carvedilol, bisoprolol o metoprolol succinato), antagonista del receptor mineralocorticoide (espironolactona o eplerenona) e inhibidor SGLT2 (dapagliflozina o empagliflozina). Titular cada agente hasta la dosis máxima tolerada.",
    meta: { especialidad: "cardiología", año: "2021" },
  },
  {
    id: "aha-acv-ventana-trombolisis",
    source: "AHA/ASA Acute Ischemic Stroke 2019",
    page: "Tabla 6",
    title: "Trombolisis IV en ACV isquémico agudo",
    content:
      "Alteplasa IV 0.9 mg/kg (máximo 90 mg) está indicada en ACV isquémico agudo dentro de las primeras 4.5 horas del inicio de síntomas en pacientes seleccionados sin contraindicaciones. La trombectomía mecánica está indicada en oclusión de arteria grande hasta 24 horas en pacientes con tejido cerebral salvable evaluado por imagen. Tiempo es cerebro: cada minuto sin reperfusión se pierden aproximadamente 1.9 millones de neuronas.",
    meta: { especialidad: "neurología / urgencias", año: "2019" },
  },

  // ═══ Neumología ═══════════════════════════════════════════════════════════
  {
    id: "gina-2024-paso1-asma",
    source: "GINA 2024",
    page: "Box 3-5A",
    title: "Tratamiento del asma en pasos 1-2",
    content:
      "En adultos y adolescentes con asma se recomienda como tratamiento de mantenimiento y rescate del paso 1-2 corticoide inhalado en dosis baja más formoterol según necesidad (estrategia MART/AIR). NO se recomienda iniciar con beta-2 agonista de acción corta (SABA) solo, por incremento de exacerbaciones, hospitalizaciones y mortalidad asociado al uso aislado de SABA.",
    meta: { especialidad: "neumología", año: "2024" },
  },
  {
    id: "gina-2024-exacerbacion-grave",
    source: "GINA 2024",
    page: "Box 4-3",
    title: "Tratamiento de exacerbación grave de asma en urgencias",
    content:
      "Ante exacerbación grave (FEV1 menor de 50% o SpO2 menor de 92% en aire ambiente, dificultad para hablar) administrar salbutamol nebulizado 5 mg cada 20 min por una hora, ipratropio nebulizado 0.5 mg cada 20 min por una hora, oxígeno suplementario para SpO2 ≥93-95%, prednisona 40-50 mg vía oral o hidrocortisona 200 mg IV, considerar magnesio sulfato 2 g IV en casos refractarios. Reevaluar a los 60 minutos.",
    meta: { especialidad: "neumología / urgencias", año: "2024" },
  },
  {
    id: "gold-2024-categorias",
    source: "GOLD 2024",
    page: "Tabla 4.1",
    title: "Categorización ABE de EPOC y tratamiento inicial",
    content:
      "GOLD 2024 simplificó la clasificación a tres grupos: A (0-1 exacerbación leve, mMRC 0-1 / CAT menor de 10), B (0-1 exacerbación leve, mMRC ≥2 / CAT ≥10), y E (≥2 exacerbaciones moderadas o ≥1 hospitalización). Tratamiento inicial: A: broncodilatador (LABA o LAMA); B: LABA + LAMA combinación; E: LABA + LAMA, considerar agregar corticoide inhalado si eosinófilos ≥300 cél/μL.",
    meta: { especialidad: "neumología", año: "2024" },
  },
  {
    id: "nice-tep-puntaje-wells",
    source: "NICE NG158",
    page: "1.1",
    title: "Probabilidad clínica de tromboembolia pulmonar",
    content:
      "Ante sospecha de TEP calcular escala de Wells de dos niveles. Probabilidad alta (Wells mayor de 4): solicitar angio-TC pulmonar inmediato; iniciar anticoagulación con HBPM mientras espera resultado si no hay contraindicación. Probabilidad baja (Wells ≤4): solicitar dímero-D; si negativo descarta TEP, si positivo continuar con angio-TC. En embarazadas considerar gammagrafía V/Q.",
    meta: { especialidad: "neumología / urgencias" },
  },

  // ═══ Urgencias / Cuidados intensivos ══════════════════════════════════════
  {
    id: "ssc-sepsis-hora-dorada",
    source: "Surviving Sepsis Campaign 2021",
    page: "Bundle 1h",
    title: "Bundle de la primera hora en sepsis y shock séptico",
    content:
      "Ante sospecha de sepsis o shock séptico, en la primera hora medir lactato sérico, obtener hemocultivos antes de antibióticos, iniciar antibiótico empírico de amplio espectro guiado por sospecha de foco, administrar cristaloides 30 mL/kg si hipotensión o lactato ≥4 mmol/L, e iniciar vasopresores (norepinefrina como primera línea) para mantener PAM ≥65 mmHg si la hipotensión persiste tras volumen.",
    meta: { especialidad: "urgencias / terapia intensiva", año: "2021" },
  },
  {
    id: "ssc-norepinefrina-primera",
    source: "Surviving Sepsis Campaign 2021",
    page: "Rec. 25",
    title: "Vasopresor inicial en shock séptico",
    content:
      "Norepinefrina es el vasopresor de primera línea en shock séptico, iniciar 0.05-0.1 mcg/kg/min y titular para PAM ≥65 mmHg. Si la respuesta es inadecuada agregar vasopresina 0.03 U/min como segundo agente. Considerar epinefrina como tercer agente. La dopamina ya NO se recomienda excepto en bradicardia con bajo riesgo de taquiarritmia.",
    meta: { especialidad: "terapia intensiva", año: "2021" },
  },
  {
    id: "aha-acls-paro-cardiaco",
    source: "AHA ACLS 2020",
    page: "Algoritmo 1",
    title: "Algoritmo de paro cardiorrespiratorio en adulto",
    content:
      "Iniciar RCP de alta calidad (100-120 compresiones/min, profundidad 5-6 cm, descompresión completa, minimizar interrupciones). Si ritmo desfibrilable (FV/TV sin pulso): desfibrilar 200 J bifásico, continuar RCP 2 min, epinefrina 1 mg IV cada 3-5 min tras la segunda descarga, considerar amiodarona 300 mg IV bolo. Si ritmo no desfibrilable (asistolia/AESP): RCP, epinefrina 1 mg IV cada 3-5 min, buscar y tratar causas reversibles (5H y 5T).",
    meta: { especialidad: "urgencias / cardiología", año: "2020" },
  },
  {
    id: "atls-trauma-abcde",
    source: "ATLS 10ª edición",
    page: "Cap 1",
    title: "Evaluación inicial en trauma — ABCDE",
    content:
      "Aproximación primaria sistemática: A (vía aérea con control de columna cervical), B (ventilación: oxígeno suplementario, descartar neumotórax a tensión y hemotórax masivo), C (circulación con control de hemorragia: presión, torniquete, accesos vasculares y reposición con volumen y/o hemoderivados según escenario), D (déficit neurológico: Glasgow, pupilas), E (exposición y prevención de hipotermia). Reevaluar continuamente; no avanzar al siguiente paso sin resolver el anterior.",
    meta: { especialidad: "urgencias / trauma" },
  },
  {
    id: "ssc-niños-sepsis",
    source: "Surviving Sepsis Pediatric 2020",
    page: "Bundle",
    title: "Bundle de sepsis pediátrica primera hora",
    content:
      "En sepsis pediátrica con shock administrar cristaloides isotónicos en bolos de 10-20 mL/kg (hasta 40-60 mL/kg en la primera hora) si no hay datos de sobrecarga, iniciar antibiótico empírico en la primera hora, considerar epinefrina periférica si la hipotensión persiste tras 40 mL/kg de volumen, transfundir si hemoglobina menor de 7 g/dL en pacientes hemodinámicamente estables.",
    meta: { especialidad: "pediatría / urgencias", año: "2020" },
  },

  // ═══ Nefrología ═══════════════════════════════════════════════════════════
  {
    id: "kdigo-2024-erc-etapas",
    source: "KDIGO ERC 2024",
    page: "Tabla 2.1",
    title: "Clasificación de enfermedad renal crónica",
    content:
      "La ERC se estadifica por TFGe (G1 ≥90, G2 60-89, G3a 45-59, G3b 30-44, G4 15-29, G5 menor de 15 mL/min/1.73m²) Y por albuminuria (A1 menor de 30, A2 30-300, A3 mayor de 300 mg/g de creatinina urinaria). El pronóstico empeora conforme baja TFGe y/o sube albuminuria. ERC se confirma con persistencia mayor de 3 meses.",
    meta: { especialidad: "nefrología", año: "2024" },
  },
  {
    id: "kdigo-2024-erc-tratamiento",
    source: "KDIGO ERC 2024",
    page: "Cap. 3",
    title: "Pilares de tratamiento en ERC",
    content:
      "Cuatro pilares conservadores en ERC: control de TA con IECA o ARA II (meta menor de 120/80 según evidencia reciente en algunos pacientes seleccionados, individualizar), inhibidor de SGLT2 si TFGe ≥20 mL/min/1.73m² (independientemente de DM), restricción de sodio menor de 2 g/día y estatina en mayores de 50 años. Finerenona en ERC con DM2 y albuminuria persistente.",
    meta: { especialidad: "nefrología", año: "2024" },
  },

  // ═══ Hepatología / Gastro ═════════════════════════════════════════════════
  {
    id: "aasld-hgnoa-tamizaje",
    source: "AASLD MASLD 2023",
    page: "Sección 4",
    title: "Tamizaje de esteatosis hepática metabólica (MASLD)",
    content:
      "En pacientes con DM2, obesidad o síndrome metabólico realizar tamizaje con FIB-4 (índice basado en edad, AST, ALT y plaquetas). FIB-4 menor de 1.3 descarta fibrosis avanzada en mayoría de pacientes; FIB-4 mayor de 2.67 sugiere fibrosis avanzada y amerita referencia a hepatología o evaluación con FibroScan / elastografía. Pérdida de peso 5-10% mejora histología hepática significativamente.",
    meta: { especialidad: "hepatología", año: "2023" },
  },
  {
    id: "aga-erge-tratamiento",
    source: "AGA Clinical Practice Update on GERD 2022",
    page: "Sección 3",
    title: "Tratamiento del reflujo gastroesofágico",
    content:
      "Iniciar inhibidor de bomba de protones (omeprazol, pantoprazol, esomeprazol) una vez al día 30 minutos antes del desayuno por 8 semanas en ERGE con síntomas típicos. Si no hay respuesta, considerar dos tomas al día por 4-8 semanas adicionales. Endoscopia con biopsia si datos de alarma (disfagia, sangrado, pérdida de peso, anemia, mayor de 50 años con síntomas nuevos). Reducir dosis al mínimo eficaz a largo plazo.",
    meta: { especialidad: "gastroenterología", año: "2022" },
  },

  // ═══ Obstetricia / Ginecología ════════════════════════════════════════════
  {
    id: "acog-preeclampsia",
    source: "ACOG Practice Bulletin 222",
    page: "Sección 3",
    title: "Criterios diagnósticos de preeclampsia",
    content:
      "Diagnóstico de preeclampsia: TA ≥140/90 mmHg en dos ocasiones separadas por al menos 4 horas, después de la semana 20 en mujer previamente normotensa, MÁS proteinuria ≥300 mg en orina de 24h o relación proteína/creatinina ≥0.3 o tira reactiva ≥2+. En ausencia de proteinuria, diagnóstico se confirma con cualquier hallazgo grave: trombocitopenia, elevación de enzimas hepáticas, insuficiencia renal, edema pulmonar, síntomas neurológicos o visuales.",
    meta: { especialidad: "obstetricia" },
  },
  {
    id: "imss-control-prenatal",
    source: "GPC IMSS Control Prenatal",
    page: "Tabla 2",
    title: "Esquema de control prenatal en embarazo de bajo riesgo",
    content:
      "Mínimo 5 consultas prenatales en embarazo de bajo riesgo: primera consulta antes de las 13 semanas, segunda entre 22-24, tercera entre 27-29, cuarta entre 33-35, quinta entre 38-40. En cada consulta: peso, TA, fondo uterino, frecuencia cardiaca fetal, movimientos fetales, signos de alarma, valoración nutricional y emocional. Suplementación con ácido fólico 400 mcg/día y hierro elemental 30-60 mg/día desde primera consulta.",
    meta: { especialidad: "obstetricia" },
  },

  // ═══ Pediatría ════════════════════════════════════════════════════════════
  {
    id: "aap-bronquiolitis",
    source: "AAP Bronchiolitis Guideline 2014",
    page: "Sección 3",
    title: "Manejo de bronquiolitis aguda en lactante",
    content:
      "Bronquiolitis aguda en menores de 24 meses se diagnostica clínicamente; NO se recomienda solicitar radiografía de tórax, hemograma o virología de rutina. NO se recomienda usar broncodilatadores (salbutamol), corticoides, epinefrina nebulizada ni antibióticos de rutina. Pilares: oxígeno si SpO2 menor de 90%, hidratación oral o enteral, lavados nasales con solución salina. Considerar hospitalización si dificultad respiratoria moderada-grave o pobre tolerancia oral.",
    meta: { especialidad: "pediatría", año: "2014" },
  },
  {
    id: "aap-fiebre-sin-foco",
    source: "AAP Febrile Infant 2021",
    page: "Tabla 3",
    title: "Evaluación de fiebre sin foco en lactante menor de 60 días",
    content:
      "En lactante menor de 21 días con fiebre ≥38°C realizar evaluación completa: hemocultivo, urocultivo, citoquímico y cultivo de LCR, iniciar antibiótico empírico (ampicilina + cefotaxima o gentamicina) y hospitalizar. En 22-28 días considerar evaluación selectiva guiada por procalcitonina menor de 0.5 ng/mL y biomarcadores. En 29-60 días con apariencia tóxica también evaluación completa; en apariencia bien estratificar con biomarcadores.",
    meta: { especialidad: "pediatría", año: "2021" },
  },

  // ═══ Salud mental ═════════════════════════════════════════════════════════
  {
    id: "dsm5tr-depresion-criterios",
    source: "DSM-5-TR (APA 2022)",
    page: "Cap. Depresión",
    title: "Criterios diagnósticos de trastorno depresivo mayor",
    content:
      "Cinco o más de los siguientes síntomas durante al menos dos semanas, con al menos uno de los dos primeros: 1) ánimo deprimido la mayor parte del día casi todos los días; 2) marcada disminución de interés o placer (anhedonia); 3) cambio significativo de peso/apetito; 4) insomnio o hipersomnia; 5) agitación o enlentecimiento psicomotor; 6) fatiga o pérdida de energía; 7) sentimientos de inutilidad o culpa excesiva; 8) disminución de concentración; 9) pensamientos recurrentes de muerte o ideación suicida. Causan deterioro funcional significativo y no son explicados por otra condición.",
    meta: { especialidad: "psiquiatría", año: "2022" },
  },
  {
    id: "nice-depresion-tratamiento",
    source: "NICE NG222 Depression in adults",
    page: "1.4",
    title: "Tratamiento inicial de depresión en adulto",
    content:
      "En depresión leve a moderada considerar TCC, terapia de resolución de problemas o activación conductual como primera línea. En depresión moderada a grave ofrecer combinación de psicoterapia más antidepresivo: ISRS de primera línea (sertralina, escitalopram, fluoxetina); evaluar respuesta a las 4 semanas. NO usar benzodiacepinas como tratamiento de fondo. Evaluar riesgo suicida en cada consulta inicialmente. Continuar tratamiento al menos 6 meses tras remisión.",
    meta: { especialidad: "psiquiatría", año: "2022" },
  },
  {
    id: "phq9-tamizaje",
    source: "USPSTF/PHQ-9",
    page: "Instrumento",
    title: "Tamizaje de depresión con PHQ-9",
    content:
      "PHQ-9 es instrumento validado en español para tamizaje de depresión en atención primaria. Puntaje 0-4: mínimo o ninguno; 5-9: depresión leve; 10-14: moderada; 15-19: moderadamente severa; 20-27: severa. Punto de corte ≥10 con sensibilidad 88% y especificidad 88% para depresión mayor. La pregunta 9 evalúa ideación suicida y requiere intervención inmediata si responde 1, 2 o 3.",
    meta: { especialidad: "psiquiatría / atención primaria" },
  },

  // ═══ Infectología ═════════════════════════════════════════════════════════
  {
    id: "idsa-nac-tratamiento",
    source: "ATS/IDSA NAC 2019",
    page: "Sección 5",
    title: "Tratamiento empírico de neumonía adquirida en comunidad ambulatoria",
    content:
      "En NAC ambulatoria sin comorbilidades ni factores de riesgo de resistencia: amoxicilina 1 g cada 8 horas vía oral o doxiciclina 100 mg cada 12 horas o azitromicina 500 mg el día 1, luego 250 mg días 2-5. En NAC ambulatoria con comorbilidades (EPOC, DM, IC, ERC, neoplasia): beta-lactámico (amoxicilina-clavulánico 875/125 mg c/12h o cefuroxima 500 mg c/12h) MÁS macrólido (azitromicina) o monoterapia con fluoroquinolona respiratoria (levofloxacino o moxifloxacino).",
    meta: { especialidad: "infectología / neumología", año: "2019" },
  },
  {
    id: "who-tuberculosis-tratamiento",
    source: "WHO TB Guidelines 2022",
    page: "Cap. 4",
    title: "Tratamiento de tuberculosis pulmonar sensible",
    content:
      "Esquema estándar de 6 meses para TB pulmonar sensible: fase intensiva de 2 meses con isoniazida, rifampicina, pirazinamida y etambutol (HRZE) seguida de fase de continuación de 4 meses con isoniazida y rifampicina (HR). Recientemente WHO recomienda esquema corto alternativo de 4 meses con rifapentina, isoniazida, pirazinamida y moxifloxacino en pacientes seleccionados ≥12 años. Tratamiento siempre supervisado (DOT/DOTS).",
    meta: { especialidad: "infectología", año: "2022" },
  },
  {
    id: "cdc-prep-vih",
    source: "CDC PrEP Clinical Practice Guideline 2021",
    page: "Sección 3",
    title: "Profilaxis pre-exposición para VIH (PrEP)",
    content:
      "PrEP indicada en adultos sexualmente activos con VIH negativo y riesgo sustancial de adquisición. Opciones: TDF/FTC (Truvada) 1 tableta diaria, TAF/FTC (Descovy) 1 tableta diaria en HSH o mujeres trans, o cabotegravir inyectable cada 2 meses. Confirmar VIH negativo antes del inicio y cada 3 meses durante uso. Función renal y screening de ITS cada 3-6 meses. PrEP reduce el riesgo de transmisión sexual de VIH en 99% cuando se toma según lo prescrito.",
    meta: { especialidad: "infectología", año: "2021" },
  },

  // ═══ Geriatría ════════════════════════════════════════════════════════════
  {
    id: "beers-2023-anticolinergicos",
    source: "AGS Beers Criteria 2023",
    page: "Tabla 2",
    title: "Medicamentos potencialmente inadecuados en adulto mayor",
    content:
      "Evitar en adultos ≥65 años por riesgo elevado de eventos adversos: antihistamínicos de primera generación (difenhidramina, hidroxizina) por efecto anticolinérgico; benzodiacepinas (excepto situaciones específicas) por caídas y deterioro cognitivo; AINEs no selectivos crónicos por riesgo GI y renal; amitriptilina por carga anticolinérgica; sulfonilureas de larga duración (glibenclamida) por hipoglucemia prolongada; relajantes musculares centrales (ciclobenzaprina) por sedación y caídas.",
    meta: { especialidad: "geriatría", año: "2023" },
  },
  {
    id: "nice-caidas-adulto-mayor",
    source: "NICE CG161",
    page: "1.2",
    title: "Evaluación y prevención de caídas en adulto mayor",
    content:
      "En adulto ≥65 años indagar antecedente de caídas en el último año en cada consulta. En quienes refieren al menos una caída, dificultades de equilibrio o marcha: evaluación multifactorial con prueba Get-Up-and-Go cronometrada (mayor de 12 segundos es anormal), evaluación visual, polifarmacia, ortostatismo, calzado, hipoglucemia, ECG si sospecha de síncope. Intervenciones eficaces: ejercicio de fuerza y equilibrio (Tai Chi, Otago), revisión farmacológica, ajuste domiciliario.",
    meta: { especialidad: "geriatría" },
  },

  // ═══ Hematología básica ═══════════════════════════════════════════════════
  {
    id: "asco-anemia-ferropenica",
    source: "ASH/ACOG Iron Deficiency",
    page: "Recomendaciones",
    title: "Diagnóstico y tratamiento de anemia ferropénica",
    content:
      "Diagnóstico: hemoglobina menor de 12 g/dL en mujeres no embarazadas y menor de 13 g/dL en hombres, con ferritina menor de 30 ng/mL. En embarazo umbral hemoglobina menor de 11 g/dL en primer y tercer trimestre, menor de 10.5 g/dL en segundo trimestre. Tratamiento oral: sulfato ferroso 60-120 mg de hierro elemental cada 24-48 horas (mejor absorción que diario) lejos de alimentos y calcio. Hierro IV (carboximaltosa férrica, sacarosa férrica) si intolerancia oral, sangrado GI activo, malabsorción o tercer trimestre con anemia significativa.",
    meta: { especialidad: "hematología" },
  },

  // ═══ Reumatología ═════════════════════════════════════════════════════════
  {
    id: "acr-ar-tratamiento",
    source: "ACR Rheumatoid Arthritis 2021",
    page: "Recomendaciones",
    title: "Tratamiento inicial de artritis reumatoide",
    content:
      "Iniciar metotrexato monoterapia 7.5-15 mg vía oral semanal con ácido fólico 1 mg/día (suplemento), titular hasta 25 mg semanal en 2-3 meses. Si DAS28 mayor de 3.2 a los 3-6 meses agregar un segundo DMARD convencional (sulfasalazina, leflunomida, hidroxicloroquina) o un biológico (inhibidor de TNF, abatacept, rituximab) o inhibidor de JAK. Evaluar respuesta cada 3 meses. Vigilar pruebas hepáticas, hematológicas y signos de infección.",
    meta: { especialidad: "reumatología", año: "2021" },
  },

  // ═══ Regulación mexicana ══════════════════════════════════════════════════
  {
    id: "nom-004-nota-medica-elementos",
    source: "NOM-004-SSA3-2012",
    page: "6.2",
    title: "Elementos mínimos de la nota médica",
    content:
      "La nota médica debe contener fecha y hora, signos vitales, padecimiento actual, exploración física por aparatos y sistemas, resultados relevantes de estudios, diagnósticos o problemas clínicos, pronóstico, tratamiento e indicaciones, así como nombre completo y firma del médico responsable. La nota de evolución incluye también valoración del estado actual y plan terapéutico actualizado.",
    meta: { categoría: "regulación" },
  },
  {
    id: "nom-004-consentimiento-informado",
    source: "NOM-004-SSA3-2012",
    page: "10.1",
    title: "Consentimiento informado",
    content:
      "Los procedimientos diagnósticos y terapéuticos considerados de alto riesgo requieren consentimiento informado por escrito, firmado por el paciente o su representante legal y dos testigos. Debe contener nombre del establecimiento, nombre y firma del paciente, acto autorizado, riesgos y beneficios, alternativas y nombre y firma del médico. Forma parte del expediente clínico.",
    meta: { categoría: "regulación" },
  },
  {
    id: "nom-004-receta-elementos",
    source: "NOM-004-SSA3-2012",
    page: "8.6",
    title: "Elementos de la receta médica",
    content:
      "La receta médica debe incluir nombre, denominación genérica del medicamento, presentación, dosis, vía de administración, frecuencia y duración del tratamiento, firma autógrafa del médico, cédula profesional, fecha de emisión y nombre del paciente. Para estupefacientes y psicotrópicos se requiere receta especial con código de barras (recetario oficial).",
    meta: { categoría: "regulación" },
  },
  {
    id: "nom-015-dm-control",
    source: "NOM-015-SSA2-2010",
    page: "8.2",
    title: "Control metabólico en diabetes según NOM mexicana",
    content:
      "Metas de control glucémico en DM2 según NOM-015 ajustadas a contexto mexicano: HbA1c menor de 7%, glucemia en ayuno 70-130 mg/dL, glucemia postprandial menor de 140 mg/dL, TA menor de 130/80 mmHg, LDL menor de 100 mg/dL (menor de 70 mg/dL si ASCVD), triglicéridos menor de 150 mg/dL, IMC menor de 25 kg/m². Evaluación trimestral de control, anual de complicaciones.",
    meta: { categoría: "regulación" },
  },
  {
    id: "nom-030-has-clasificacion",
    source: "NOM-030-SSA2-2009",
    page: "Tabla 1",
    title: "Clasificación de HAS según NOM mexicana",
    content:
      "Clasificación de la NOM-030 vigente: TA óptima menor de 120/80 mmHg; normal alta 130-139/85-89 mmHg; HAS estadio 1: 140-159/90-99; HAS estadio 2: 160-179/100-109; HAS estadio 3: ≥180/110 mmHg. Diagnóstico requiere TA elevada en dos o más visitas, en al menos dos mediciones por consulta. Considera AHA/ACC 2017 más estricta cuando aplique a juicio clínico.",
    meta: { categoría: "regulación" },
  },
  {
    id: "nom-024-interoperabilidad",
    source: "NOM-024-SSA3-2012",
    page: "Cap. 6",
    title: "Sistemas de información en salud — interoperabilidad",
    content:
      "Los establecimientos de salud deben usar sistemas de información que cumplan con: interoperabilidad mediante mensajes HL7, identificadores únicos del paciente (CURP), confidencialidad por roles, respaldo automatizado, trazabilidad de accesos, almacenamiento mínimo de 5 años para adultos y hasta la mayoría de edad más 5 años en menores.",
    meta: { categoría: "regulación" },
  },
  {
    id: "nom-220-farmacovigilancia",
    source: "NOM-220-SSA1-2016",
    page: "Cap. 5",
    title: "Reporte de sospecha de reacción adversa a medicamentos",
    content:
      "Todo profesional de la salud debe reportar a Farmacovigilancia COFEPRIS sospechas de reacciones adversas medicamentosas graves (que requieran hospitalización, prolonguen estancia, ocasionen incapacidad o muerte) en máximo 15 días naturales. Reacciones no graves: en máximo 30 días. Formato electrónico vía e-Reporting o formulario oficial. Identificar paciente con iniciales, edad y sexo (sin datos identificables completos).",
    meta: { categoría: "regulación" },
  },
  {
    id: "lgs-2026-expediente-electronico",
    source: "Reforma LGS 2026",
    page: "Art. 134 bis",
    title: "Expediente clínico electrónico obligatorio",
    content:
      "Los establecimientos de atención médica privados y públicos deberán contar con expediente clínico electrónico interoperable que cumpla los lineamientos federales de seguridad de datos personales en salud y permita intercambio entre niveles de atención. Plazo escalonado: 2026 hospitales segundo y tercer nivel; 2027 primer nivel y consultorios privados con más de 3 médicos; 2028 todos.",
    meta: { categoría: "regulación", año: "2026" },
  },

  // ═══ Tamizajes y prevención ═══════════════════════════════════════════════
  {
    id: "uspstf-cancer-mama-tamizaje",
    source: "USPSTF Mamografía 2024",
    page: "Recomendación B",
    title: "Tamizaje de cáncer de mama",
    content:
      "Mamografía cada 2 años en mujeres de 40 a 74 años con riesgo promedio (recomendación B, actualizada en 2024 que bajó la edad inicial de 50 a 40 años). En mujeres con riesgo elevado (antecedente familiar primer grado, BRCA, radiación torácica) considerar inicio temprano y/o resonancia magnética complementaria. Educar sobre densidad mamaria y limitaciones de mamografía en mamas densas.",
    meta: { especialidad: "ginecología / prevención", año: "2024" },
  },
  {
    id: "uspstf-cancer-colon-tamizaje",
    source: "USPSTF Cáncer colorrectal 2021",
    page: "Recomendación B",
    title: "Tamizaje de cáncer colorrectal",
    content:
      "Tamizaje de cáncer colorrectal en todos los adultos entre 45 y 75 años con riesgo promedio. Opciones: sangre oculta en heces inmunoquímica (FIT) anual, FIT-DNA cada 1-3 años, sigmoidoscopia cada 5 años, colonoscopia cada 10 años, colonoscopia virtual cada 5 años. La colonoscopia sigue siendo gold standard. En 76-85 años decisión individualizada con paciente.",
    meta: { especialidad: "gastroenterología / prevención", año: "2021" },
  },
  {
    id: "imss-tamizaje-cacu",
    source: "GPC IMSS Cáncer Cervicouterino",
    page: "Recomendación 4",
    title: "Tamizaje de cáncer cervicouterino",
    content:
      "Citología cervical anual en mujeres de 25 a 64 años. Si dos citologías anuales consecutivas son negativas, continuar cada 3 años. Alternativa: prueba de VPH cada 5 años en mayores de 30 años. Vacunación contra VPH en niñas y niños de 11 años (esquema 2 dosis menor de 15 años, 3 dosis ≥15 años). Coinfección VIH requiere tamizaje más frecuente.",
    meta: { especialidad: "ginecología / prevención" },
  },

  // ═══ Salud sexual y reproductiva ══════════════════════════════════════════
  {
    id: "who-anticoncepcion-emergencia",
    source: "WHO Family Planning 2022",
    page: "Cap. 7",
    title: "Anticoncepción de emergencia",
    content:
      "Levonorgestrel 1.5 mg vía oral dosis única dentro de las primeras 72 horas tras relación sin protección (eficacia decrece con el tiempo, mejor en primeras 12 h). Acetato de ulipristal 30 mg hasta 120 horas post-coito (más eficaz que levonorgestrel después de 72 h). DIU de cobre insertado dentro de 5 días post-coito es el método más eficaz (>99%) y deja anticoncepción a largo plazo. NO es abortiva: actúa previniendo o retrasando la ovulación.",
    meta: { especialidad: "ginecología", año: "2022" },
  },

  // ═══ Vacunación adultos ══════════════════════════════════════════════════
  {
    id: "ssa-mx-vacunas-adulto",
    source: "Esquema Nacional de Vacunación Adulto MX 2024",
    page: "Tabla",
    title: "Vacunación recomendada en adultos en México",
    content:
      "Adultos en México deben tener: Td (tétanos/difteria) refuerzo cada 10 años, hepatitis B en grupos de riesgo, SR/SRP en mujeres en edad fértil susceptibles, influenza anual estacional (especialmente ≥60 años, embarazadas, comorbilidades), neumococo (PCV13 + PPSV23 con esquema secuencial en ≥60 años o factores de riesgo), Tdpa en cada embarazo (semana 27-36), VPH si menor de 26 años, herpes zóster recombinante en ≥50 años, COVID-19 según recomendación vigente.",
    meta: { especialidad: "prevención", año: "2024" },
  },
];

/**
 * Priors mexicanos calibrados — capa LATAM del motor bayesiano.
 *
 * Por qué existe:
 *   El catálogo `DISEASES.prior` está calibrado a cohortes clínicas
 *   internacionales (HFpEF de US, sepsis ICU multicéntrica, etc.). En la
 *   práctica de un médico mexicano la prevalencia esperada de cada
 *   diagnóstico cambia — TB activa es 2-4× más común que en US, DM2 es
 *   18.4% de adultos vs 11% US, sarcoidosis es menos prevalente, ATTR-CM
 *   está subdiagnosticada por falta de gammagrafía Tc-PYP disponible.
 *
 *   Este archivo aporta una capa de override que el motor bayesiano
 *   consume vía `inferDifferential(observations, diseases, lrs, { priors })`.
 *
 * Naturaleza de los números:
 *   Las cifras NO son prevalencia poblacional general (eso no aplica para
 *   diferencial diagnóstico — un médico no parte de "20% de la población
 *   tiene DM2"). Son **prevalencia esperada en consulta ambulatoria de
 *   especialidad o medicina interna en hospital privado MX**, derivada de:
 *
 *   · ENSANUT 2023 (prevalencia poblacional como ancla superior)
 *   · Anuario de Morbilidad SSA (incidencia anual reportada)
 *   · Boletines epidemiológicos SSA (incidencia activa)
 *   · CONACYT / INSP estudios cohorte
 *   · Literatura clínica peer-reviewed mexicana
 *
 *   Cuando la fuente local es débil, usamos benchmark internacional con
 *   ajuste cualitativo documentado en el comentario adyacente al prior.
 *
 * Estructura conservadora:
 *   Los priors aquí están sub-ajustados al alza para enfermedades raras
 *   (preferimos sobreestimar y dejar que el LR corrija que infraestimar y
 *   nunca considerar). Para enfermedades comunes con alta prevalencia MX
 *   (DM2, HAS, IC, EPOC, TB) ajustamos al alza vs cohortes US.
 */

import type { DiseaseId } from "./types";

/**
 * Priors esperados en consulta ambulatoria de especialidad MX.
 * El motor bayesiano normaliza el vector multinomial al final, así que
 * los valores absolutos importan menos que las relaciones entre ellos.
 */
export const MX_NATIONAL_PRIORS: Record<DiseaseId, number> = {
  // ============================================================
  // Cardiomiopatías y restrictivo
  // ============================================================

  // ATTR-CM — subdiagnosticada en MX por falta de gammagrafía Tc-PYP
  // accesible. En cohorte HFpEF >65 años en hospital privado, prevalencia
  // estimada 8-12% (vs 13% reportado en cohortes US — un poco menor por
  // demografía más joven). Anuario SSA no la captura aún.
  "attr-cm": 0.04,

  // AL amyloid — prevalencia similar a US, ~3-5/millón anual incidencia.
  // En cohorte clínica seleccionada (sospecha amiloide) 8-12% del total.
  "al-amyloid": 0.018,

  // HFpEF idiopática — alta prevalencia en MX por epidemia DM2/HAS sin
  // control adecuado. ENSANUT 2023 reporta 30% adultos con HAS y 18.4% DM2,
  // que son drivers principales. En cohorte cardiología especializada MX,
  // HFpEF representa ~25-35% de IC crónica.
  "hfpef-idiopathic": 0.22,

  // Cardiopatía hipertensiva con LVH — muy alta en MX por HAS prevalente
  // y no controlada. INC reporta hasta 40% adultos con HAS desarrolla LVH.
  "hypertensive-hd": 0.16,

  // HCM sarcomérica — prevalencia poblacional 1:500 = 0.2%, en cohorte
  // cardiología 2-4%. Similar entre LATAM y US.
  "hcm": 0.025,

  // Sarcoidosis cardíaca — menos prevalente en mexicanos vs población
  // afroamericana de US donde es 3× más común. Subdiagnosticada por
  // falta de PET-FDG en sector público.
  "cardiac-sarcoid": 0.008,

  // Enfermedad de Fabry cardíaca — rara, similar a internacional.
  // Subdiagnosticada por falta de tamizaje en familias afectadas.
  "fabry": 0.004,

  // Miocarditis aguda — incidencia comparable, posible cluster post-COVID.
  // En cohorte cardiología aguda 4-7%.
  "myocarditis-acute": 0.03,

  // Takotsubo — similar prevalencia internacional. Más en mujeres post-
  // menopáusicas con estresor agudo.
  "takotsubo": 0.018,

  // Pericarditis constrictiva — en MX hay sub-cohorte por TB previa que
  // eleva ligeramente vs US (TB latente reactivada → constrictiva tardía).
  "constrictive-pericarditis": 0.018,

  // ARVC — similar a internacional, rara.
  "arvc": 0.01,

  // Otras cardiomiopatías / restrictivo
  "other-cardio": 0.03,

  // --- Cardio extendido B1 ---
  // HFrEF — alta prevalencia MX por epidemia DM2/HAS no controlada
  // (drivers principales de cardiomiopatía isquémica). En cohorte cardio
  // especializada MX, HFrEF representa 35-45% de las IC.
  "hfref": 0.14,

  // HFmrEF — categoría ESC 2021, ~8-12% del total de IC.
  "hfmref": 0.07,

  // IC aguda descompensada — en urgencias hospital privado MX 4-7%
  // de ingresos cardiológicos.
  "adhf-acute": 0.06,

  // SCAD — rara, similar a US (~0.5% IAMs). Subdiagnosticada en MX
  // por falta de coronariografía con OCT/IVUS rutinaria.
  "scad": 0.008,

  // Estenosis aórtica severa — alta prevalencia >70 años; en cohorte
  // cardio adulto mayor MX 8-12%, ambulatorio general 2-3%.
  "severe-as": 0.025,

  // Cardiopatía isquémica crónica — primera causa de mortalidad
  // cardiovascular en MX. En cohorte cardio especializada 18-25%.
  "ischemic-cm": 0.13,

  // ============================================================
  // Endocrino
  // ============================================================

  // Hipotiroidismo primario — prevalencia MX 4-9% adultos (ENSANUT 2018).
  // En consulta endo o medicina interna sub-cohorte 8-12%.
  "hypothyroidism": 0.08,

  // Hipertiroidismo — más común en MX que algunos países por consumo
  // crónico de yodo y disrupción tiroidea autoinmune. ~2-3% en consulta.
  "hyperthyroidism": 0.028,

  // Síndrome de Cushing endógeno — incidencia ~2-3/millón anual.
  // En cohorte de sospecha endocrina 0.5-1%.
  "cushing": 0.007,

  // Addison — incidencia ~5/millón, en cohorte de sospecha 0.4-0.8%.
  "addison": 0.006,

  // Feocromocitoma — incidencia ~2/millón anual. En cohorte de HAS
  // resistente o paroxismos hipertensivos 0.3-0.6%.
  "pheochromocytoma": 0.004,

  // Hiperaldosteronismo primario — más prevalente de lo que se sospechaba.
  // En cohorte HAS resistente puede llegar a 10-20%, pero en consulta
  // general endo es 1-2%.
  "primary-hyperaldosteronism": 0.018,

  // ============================================================
  // Neuro
  // ============================================================

  // ACV isquémico agudo — primera causa de incapacidad en MX adultos.
  // En cohorte urgencias neurológica 6-10%. En ambulatorio post-evento
  // se ven secuelas.
  "ischemic-stroke-acute": 0.07,

  // HSA — incidencia anual ~10/100,000, en cohorte urgencias con cefalea
  // aguda 1-3%.
  "sah": 0.012,

  // Esclerosis múltiple — prevalencia MX 11-15/100,000, menor que en
  // países nórdicos. En cohorte neurología joven con síntomas 0.6-1%.
  "multiple-sclerosis": 0.008,

  // Migraña con aura — alta prevalencia poblacional, en cohorte cefalea
  // primaria 25-35% son migraña, de las cuales 20-30% son con aura.
  "migraine-aura": 0.09,

  // Parkinson — prevalencia adultos >65 años en MX 1-2%. En cohorte
  // neurología trastornos del movimiento 12-18%.
  "parkinsons": 0.035,

  // ============================================================
  // Infecto
  // ============================================================

  // Sepsis — primera causa de muerte intrahospitalaria evitable en MX.
  // En urgencias 8-12% son cuadros sépticos.
  "sepsis": 0.08,

  // Endocarditis infecciosa — incidencia 3-7/100,000 anual. En cohorte
  // de fiebre sin foco prolongada 2-4%.
  "endocarditis": 0.018,

  // Neumonía adquirida en la comunidad — muy alta prevalencia MX,
  // primera causa de infección respiratoria baja. En urgencias 8-14%.
  "cap-pneumonia": 0.11,

  // Meningitis bacteriana aguda — incidencia ~1-2/100,000 anual. En
  // cohorte cefalea + fiebre aguda 1.5-3%.
  "bacterial-meningitis": 0.012,

  // TB pulmonar activa — incidencia MX ~25/100,000 anual (vs ~3 US).
  // En cohorte tos prolongada + síntomas constitucionales 3-6%. Mucho
  // más alta que el catálogo US-calibrated.
  "tuberculosis-active": 0.035,
};

/**
 * Última actualización del set de priors. Útil para mostrar al médico
 * que la calibración es viva y se actualiza con nuevos datos epidemio.
 */
export const MX_PRIORS_REVISION = "2026-05-16";

/**
 * Etiqueta humana de la fuente principal. NO incluye nombres específicos
 * de papers o estudios para no exponer en bundle público.
 */
export const MX_PRIORS_LABEL =
  "Calibración mexicana — ENSANUT, Anuario SSA y literatura clínica peer-reviewed";

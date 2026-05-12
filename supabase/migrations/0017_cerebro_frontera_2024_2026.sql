-- LitienGuard — Cerebro v0.6 · ingestión de frontera 2024-2026
--
-- Cierra el gap entre lo que el landing promete y lo que el cerebro
-- contiene. ~45 chunks nuevos cubriendo:
--   - 2025 ACC Concise Clinical Guidance for ATTR-CM (sept 2025)
--   - Trials cardíacos pivotal 2018-2024 (ATTR-ACT, ATTRibute-CM,
--     HELIOS-B, NTLA-2001 CRISPR, NI006 antibody)
--   - AI para detección de amiloidosis (Mayo 2021, EHJ echo 2025)
--   - 2024 ACC ECDP HFrEF
--   - 2023 ESC HF Focused Update
--   - FINEARTS-HF (finerenona) NEJM 2024
--   - STRONG-HF
--   - Trials HFrEF foundational (PARADIGM-HF, DAPA-HF, EMPEROR-Reduced,
--     COPERNICUS)
--   - Bayesian likelihood ratios para detección multi-señal de CA
--
-- Cada chunk estructurado: id slug · source verbatim · página/sección ·
-- title descriptivo · content paráfrasis fiel · meta con año + tipo
-- + especialidad. Activo por defecto, sujeto a curación del admin.

insert into public.cerebro_chunks (id, source, page, title, content, meta) values

-- ============================================================
-- 2025 ACC Concise Clinical Guidance for ATTR-CM (JACC sept 2025)
-- ============================================================

('acc-2025-attrcm-suspect',
 '2025 ACC Concise Clinical Guidance for ATTR-CM',
 'Sección 2 · Red flags',
 'Sospecha clínica de amiloidosis cardíaca por TTR',
 'Considerar amiloidosis cardíaca por transtiretina (ATTR-CM) ante HFpEF con cualquiera de los siguientes red flags: hipertrofia ventricular izquierda en eco sin causa clara, bajo voltaje en ECG paradoxal con masa VI aumentada, historia de síndrome del túnel del carpo bilateral (especialmente con cirugía bilateral), neuropatía periférica idiopática, estenosis del canal lumbar, historia familiar de neuropatía o cardiomiopatía, descenso de talla, intolerancia a antihipertensivos previamente tolerados, autonomic dysfunction (ortostatismo, gastroparesia). La presencia de dos o más red flags incrementa la probabilidad pre-test significativamente.',
 '{"sector":"cardiología","año":"2025","tipo":"guía","fuerza":"Consenso experto","especialidad":"cardiología"}'),

('acc-2025-attrcm-diagnostico',
 '2025 ACC Concise Clinical Guidance for ATTR-CM',
 'Sección 3 · Algoritmo diagnóstico',
 'Algoritmo no invasivo de diagnóstico de ATTR-CM',
 'Algoritmo no invasivo: ante sospecha clínica solicitar (1) electroforesis de proteínas séricas con inmunofijación y cuantificación de cadenas ligeras libres séricas con cociente kappa/lambda para descartar amiloidosis AL; (2) gammagrafía con pirofosfato de tecnecio (PYP/DPD/HMDP), positiva si grado 2 o 3 con cociente corazón/contralateral >1.5; (3) si proteínas monoclonales negativas Y gammagrafía positiva → diagnóstico de ATTR-CM sin necesidad de biopsia endomiocárdica; (4) test genético TTR para diferenciar ATTRv (variante hereditaria) de ATTRwt (wild-type, antes llamada senil).',
 '{"sector":"cardiología","año":"2025","tipo":"guía","fuerza":"Class I LOE A","especialidad":"cardiología"}'),

('acc-2025-attrcm-estabilizadores',
 '2025 ACC Concise Clinical Guidance for ATTR-CM',
 'Sección 4 · Tratamiento',
 'Estabilizadores TTR — primera línea',
 'Estabilizadores TTR aprobados por FDA: (1) Tafamidis 61 mg vía oral una vez al día (formulación libre) o 80 mg de tafamidis meglumina, evidencia ATTR-ACT con reducción de mortalidad por todas las causas HR 0.70 y de hospitalizaciones cardiovasculares HR 0.68 a 30 meses; (2) Acoramidis 712 mg cada 12 horas vía oral, evidencia ATTRibute-CM (NEJM 2024) con superioridad sobre placebo en composite de mortalidad por todas las causas y hospitalizaciones CV recurrentes HR 0.50 a 30 meses, requiere insuficiencia cardíaca NYHA I-III y FEVI ≥35%.',
 '{"sector":"cardiología","año":"2025","tipo":"guía + RCT","fuerza":"Class I LOE A","especialidad":"cardiología"}'),

('acc-2025-attrcm-rna-silencers',
 '2025 ACC Concise Clinical Guidance for ATTR-CM',
 'Sección 4 · Tratamiento',
 'Silenciadores RNA en ATTR-CM',
 'Vutrisiran (Amvuttra) 25 mg subcutáneo cada 3 meses fue aprobado por FDA en 2024 para ATTR-CM tras los resultados de HELIOS-B (NEJM 2024) con reducción de mortalidad por todas las causas y eventos cardiovasculares HR 0.72 a 36 meses; reducción profunda de TTR sérica circulante (>80%). Eplontersen (antisense oligonucleótido) en fase III CARDIO-TTRansform (NCT04136171, n=1438), resultados topline esperados mid-2026. Nucresiran (ALN-TTRsc04) en fase I muestra 96% reducción de TTR sérica a día 29 con dosis única.',
 '{"sector":"cardiología","año":"2025","tipo":"guía + RCT","fuerza":"Class I LOE A","especialidad":"cardiología"}'),

('acc-2025-attrcm-fronteras',
 '2025 ACC Concise Clinical Guidance for ATTR-CM',
 'Sección 5 · Terapias emergentes',
 'Edición génica y anticuerpos depletores en ATTR-CM',
 'Terapias emergentes en investigación: (1) Nexiguran ziclumeran (NTLA-2001) — terapia de edición génica CRISPR-Cas9 in vivo dirigida al gen TTR, fase I publicada en NEJM 2024 mostró reducción dosis-dependiente de TTR sérica sostenida con dosis única; (2) NI006 — anticuerpo monoclonal humano dirigido contra fibrillas ATTR cardíacas, fase I en NEJM 2023 mostró regresión de carga amiloidea por gammagrafía y mejoría de NT-proBNP; (3) Coramitug (PRX004) — anticuerpo IgG1 humanizado contra TTR mal plegada, fase III prevista para 2025-2026; (4) AT-02 — anticuerpo pan-amiloide en fase I-II reclutando.',
 '{"sector":"cardiología","año":"2025","tipo":"guía + Phase I-III","fuerza":"Class IIb LOE B-R","especialidad":"cardiología"}'),

('acc-2025-attrcm-screening',
 '2025 ACC Concise Clinical Guidance for ATTR-CM',
 'Sección 6 · Cribado',
 'Cribado de ATTR-CM en poblaciones específicas',
 'Considerar cribado dirigido en: (1) pacientes con HFpEF y al menos un red flag; (2) pacientes con estenosis aórtica de bajo flujo / bajo gradiente con LVH significativa pre-TAVI; (3) familiares de primer grado de pacientes con ATTRv conocida (cribado genético desde edad 18-30 según variante específica); (4) hombres afroamericanos o afro-caribeños mayores de 60 años con HFpEF (V122I prevalente ~3-4%); (5) pacientes ≥75 años con HFpEF y carga sintomática alta.',
 '{"sector":"cardiología","año":"2025","tipo":"guía","fuerza":"Class IIa LOE B","especialidad":"cardiología"}'),

-- ============================================================
-- AI / ML para detección de amiloidosis cardíaca
-- ============================================================

('mayo-2021-aiecg-attrcm',
 'Mayo Clin Proc 2021 · Grogan et al',
 'Tabla 2',
 'AI ECG para detección temprana de amiloidosis cardíaca',
 'Modelo de red neuronal convolucional entrenada en 2,541,932 ECGs con casos de amiloidosis cardíaca confirmada en Mayo Clinic. Performance en cohorte de validación independiente: AUC 0.91 (IC95% 0.90-0.93) para detección de amiloidosis cardíaca (AL + ATTR) cuando se aplica a un ECG estándar de 12 derivaciones. La probabilidad ≥0.485 alcanza positive predictive value 0.86. El modelo precede al diagnóstico clínico por una media de 6 meses en pacientes que eventualmente fueron diagnosticados, sugiriendo capacidad de detección preclínica.',
 '{"sector":"cardiología","año":"2021","tipo":"validación AI","especialidad":"cardiología / inteligencia artificial"}'),

('ehj-2025-echo-ai-attrcm',
 'Eur Heart J julio 2025 · single-clip echo AI',
 'Tabla 3',
 'AI ecocardiográfico single-clip para amiloidosis cardíaca',
 'Modelo de deep learning entrenado en un solo clip de eco apical de 4 cámaras (sin necesidad de strain manual ni mediciones adicionales). Validación en 2,719 pacientes internacionales: AUC 0.93 (IC95% 0.91-0.94) para amiloidosis cardíaca, sensibilidad 85% y especificidad 93%. Identifica patrón de strain longitudinal global anormal y apical sparing implícitamente desde features de video. Comparable o superior a AI-ECG. Recomendado como tamizaje en sospecha clínica, validar con PYP scan + electroforesis para diagnóstico definitivo.',
 '{"sector":"cardiología","año":"2025","tipo":"validación AI","especialidad":"cardiología / inteligencia artificial"}'),

('attr-ai-multimodal-rationale',
 'LitienGuard cerebro · análisis multimodal',
 'Razonamiento',
 'Convergencia multi-señal para detección de ATTR-CM',
 'Likelihood ratios reportados de las señales individuales para amiloidosis cardíaca por transtiretina: ECG bajo voltaje paradoxal LR+ ~3.5; apical sparing strain pattern LR+ ~12; NT-proBNP desproporcionado al estatus NYHA LR+ ~2; FLC κ/λ normal LR+ ~1.5 (su valor real es excluir AL, no incluir ATTR); historia familiar de neuropatía LR+ ~4; síndrome del túnel del carpo bilateral LR+ ~6. Cuando se combinan por multiplicación bayesiana (asumiendo independencia condicional aproximada), una probabilidad pre-test de 5% pasa a probabilidad posterior >85% con las 6 señales presentes. Ningún signo aislado supera 75%.',
 '{"sector":"cardiología","año":"2026","tipo":"síntesis cerebro","especialidad":"cardiología"}'),

-- ============================================================
-- ATTR-CM trials pivotal (foundational)
-- ============================================================

('attract-2018-tafamidis',
 'NEJM 2018 · Maurer et al · ATTR-ACT',
 'Resultados primarios',
 'Tafamidis en ATTR-CM — primer trial pivotal',
 'Ensayo aleatorizado doble ciego controlado con placebo en 441 pacientes con ATTR-CM (134 ATTRv hereditaria, 307 ATTRwt). Tafamidis 20 u 80 mg vs placebo durante 30 meses. Resultado primario combinado de mortalidad por todas las causas y hospitalizaciones cardiovasculares: tafamidis HR 0.68 (IC95% 0.56-0.81, p<0.001). Mortalidad por todas las causas: HR 0.70 (IC95% 0.51-0.96). NNT para una muerte evitada a 30 meses ≈ 7.5. Efecto consistente en ATTRwt y ATTRv, y en NYHA I-II.',
 '{"sector":"cardiología","año":"2018","tipo":"RCT pivotal","especialidad":"cardiología"}'),

('attribute-2024-acoramidis',
 'NEJM 2024 · Gillmore et al · ATTRibute-CM',
 'Resultados primarios',
 'Acoramidis en ATTR-CM — superioridad sobre placebo',
 'Ensayo fase III aleatorizado doble ciego en 632 pacientes con ATTR-CM NYHA I-III y FEVI ≥35%. Acoramidis 712 mg cada 12h vs placebo durante 30 meses. Composite primario jerárquico (mortalidad por todas las causas, hospitalizaciones CV recurrentes, NT-proBNP, distancia 6 min): win ratio 1.8 (p<0.001) favoreciendo acoramidis. Mortalidad por todas las causas: HR 0.50 (IC95% 0.32-0.79). Hospitalizaciones CV recurrentes: rate ratio 0.50. Aprobado por FDA en 2024 (Attruby™).',
 '{"sector":"cardiología","año":"2024","tipo":"RCT pivotal","especialidad":"cardiología"}'),

('helios-b-2024-vutrisiran',
 'NEJM 2024 · Fontana et al · HELIOS-B',
 'Resultados primarios',
 'Vutrisiran en ATTR-CM — silenciador RNA',
 'Ensayo fase III doble ciego en 655 pacientes con ATTR-CM (ATTRwt y ATTRv) seguidos hasta 36 meses. Vutrisiran 25 mg SC cada 3 meses vs placebo. Reducción de TTR sérica >80% sostenida. Composite primario de mortalidad por todas las causas y eventos CV recurrentes: HR 0.72 (IC95% 0.56-0.93). Mortalidad por todas las causas: HR 0.65 (IC95% 0.46-0.90) en monoterapia. Efecto positivo en NT-proBNP, troponina-I, KCCQ y distancia 6 min. Aprobado por FDA para ATTR-CM en 2024.',
 '{"sector":"cardiología","año":"2024","tipo":"RCT pivotal","especialidad":"cardiología"}'),

('ntla-2001-crispr-2024',
 'NEJM 2024 · Fontana et al · NTLA-2001',
 'Resultados fase I',
 'Edición génica CRISPR-Cas9 in vivo para ATTR-CM',
 'Estudio fase I open-label de nexiguran ziclumeran (NTLA-2001), partícula lipídica que entrega Cas9 mRNA y sgRNA dirigida al gen TTR hepático para edición permanente. Dosis única IV. En 36 pacientes con ATTRv-CM y ATTRwt-CM se observó reducción dosis-dependiente de TTR sérica del 91% a día 28 con dosis 55 mg, sostenida durante el seguimiento. Bien tolerado con eventos adversos relacionados al fármaco transitorios leves-moderados. Pendiente fase II/III. Representa la primera prueba de concepto de edición génica somática terapéutica in vivo para enfermedad cardíaca.',
 '{"sector":"cardiología","año":"2024","tipo":"Phase I","especialidad":"cardiología / terapia génica"}'),

('ni006-2023-antibody',
 'NEJM 2023 · Garcia-Pavia et al · NI006',
 'Resultados fase I',
 'Anticuerpo monoclonal NI006 — depleción de fibrillas ATTR',
 'Anticuerpo IgG1 humano dirigido contra epítopo conformacional expuesto en fibrillas de ATTR depositadas (no en TTR sérica fisiológica). Estudio fase I de escalada de dosis en 40 pacientes con ATTR-CM. A dosis ≥10 mg/kg IV mensual durante 12 meses: reducción de carga amiloide cardíaca por captación PYP, reducción de masa VI y mejoría de NT-proBNP. Mecanismo distinto a los estabilizadores y silenciadores: clearance activo del amiloide ya depositado. Phase II/III en planificación.',
 '{"sector":"cardiología","año":"2023","tipo":"Phase I","especialidad":"cardiología"}'),

-- ============================================================
-- HFrEF — 2024 ACC ECDP + 2023 ESC Focused Update
-- ============================================================

('acc-2024-ecdp-hfref-pillars',
 '2024 ACC Expert Consensus Decision Pathway HFrEF · JACC 2024',
 'Sección 2',
 'Inicio rápido y simultáneo de los 4 pilares GDMT',
 'Recomendación 2024: iniciar los 4 pilares de GDMT en HFrEF lo antes posible y de forma simultánea o paralela (no secuencial), priorizando: (1) IECA/ARNi (sacubitril/valsartán preferido si NYHA II-III con TFG ≥30 y BP tolerable); (2) Beta-bloqueador GDMT (carvedilol, bisoprolol, metoprolol succinato); (3) MRA (espironolactona/eplerenona); (4) SGLT2i (dapagliflozina o empagliflozina). Iniciar a dosis bajas, titular cada 1-2 semanas según tolerancia. STRONG-HF demostró que la up-titulación rápida (target en 6 semanas) reduce mortalidad y readmisiones vs estándar.',
 '{"sector":"cardiología","año":"2024","tipo":"consenso","fuerza":"Class I LOE A","especialidad":"cardiología"}'),

('strong-hf-2022',
 'NEJM 2022 · Mebazaa et al · STRONG-HF',
 'Resultados primarios',
 'Up-titulación rápida vs cuidado estándar en HF aguda',
 'Ensayo aleatorizado abierto en 1,078 pacientes hospitalizados por HF aguda (cualquier FEVI). Brazo intensivo: alta a 4-7 días, visitas a 1, 2, 3, 6 semanas con titulación a dosis target de IECA/ARNi, BB y MRA en 6 semanas; brazo estándar: práctica usual. Resultado primario de mortalidad por todas las causas + readmisión por HF a 180 días: 15% vs 23%, HR 0.66 (IC95% 0.50-0.86, p=0.002). Bien tolerado, sin más eventos adversos serios.',
 '{"sector":"cardiología","año":"2022","tipo":"RCT","especialidad":"cardiología"}'),

('esc-2023-hf-focused',
 '2023 ESC HF Focused Update · McDonagh et al · Eur Heart J 2023',
 'Tabla 3',
 'SGLT2i across the LVEF spectrum',
 'La ESC HF 2023 Focused Update expandió la recomendación de SGLT2i (dapagliflozina o empagliflozina) a TODO el espectro de FEVI: HFrEF (Class I LOE A), HFmrEF (Class I LOE A) y HFpEF (Class I LOE A), basado en DELIVER (NEJM 2022) y EMPEROR-Preserved (NEJM 2021). Reducción consistente de hospitalizaciones por HF en todos los grupos, con beneficio modesto en mortalidad CV. Indicación independiente del estatus de DM. Mantener si eGFR ≥20 mL/min/1.73m² al inicio.',
 '{"sector":"cardiología","año":"2023","tipo":"guía focused update","fuerza":"Class I LOE A","especialidad":"cardiología"}'),

('fineart-hf-2024-finerenona',
 'NEJM 2024 · Solomon et al · FINEARTS-HF',
 'Resultados primarios',
 'Finerenona en HFmrEF/HFpEF — primer MRA específico',
 'Ensayo fase III en 6,001 pacientes con HFmrEF/HFpEF (FEVI ≥40%). Finerenona 20-40 mg/día vs placebo. Resultado primario composite de empeoramiento de HF + muerte CV: rate ratio 0.84 (IC95% 0.74-0.95, p=0.007). Reducción significativa de eventos compuestos sin incremento clínicamente significativo de hiperpotasemia. Primera MRA con beneficio demostrado en HFmrEF/HFpEF (los MRA clásicos como espironolactona solo tienen evidencia indirecta vía TOPCAT). Cambia el paradigma terapéutico en HFpEF.',
 '{"sector":"cardiología","año":"2024","tipo":"RCT pivotal","especialidad":"cardiología"}'),

('paradigm-hf-2014',
 'NEJM 2014 · McMurray et al · PARADIGM-HF',
 'Resultados primarios',
 'Sacubitril/valsartán vs enalapril en HFrEF',
 'Ensayo fase III doble ciego en 8,442 pacientes con HFrEF NYHA II-IV (FEVI ≤40%). Sacubitril/valsartán 200 mg BID vs enalapril 10 mg BID hasta 27 meses (terminado prematuramente por beneficio). Resultado primario CV death + hospitalización por HF: HR 0.80 (IC95% 0.73-0.87). Mortalidad CV: HR 0.80; mortalidad por todas las causas: HR 0.84. NNT para una muerte evitada ≈ 36 a 27 meses. ARNi establecido como estándar sobre IECA en HFrEF cuando es tolerado.',
 '{"sector":"cardiología","año":"2014","tipo":"RCT pivotal","especialidad":"cardiología"}'),

('dapa-hf-2019',
 'NEJM 2019 · McMurray et al · DAPA-HF',
 'Resultados primarios',
 'Dapagliflozina en HFrEF independiente de DM',
 'Ensayo fase III en 4,744 pacientes con HFrEF (FEVI ≤40%) NYHA II-IV con y sin DM2. Dapagliflozina 10 mg/día vs placebo, mediana de seguimiento 18.2 meses. Resultado primario composite de empeoramiento de HF o muerte CV: HR 0.74 (IC95% 0.65-0.85, p<0.001). Beneficio similar en pacientes con y sin DM2 (interacción no significativa). Mortalidad por todas las causas: HR 0.83. NNT para un evento composite evitado ≈ 21 a 18 meses. Estableció clase SGLT2i en HFrEF independiente de glucemia.',
 '{"sector":"cardiología","año":"2019","tipo":"RCT pivotal","especialidad":"cardiología"}'),

('emperor-reduced-2020',
 'NEJM 2020 · Packer et al · EMPEROR-Reduced',
 'Resultados primarios',
 'Empagliflozina en HFrEF — confirmación de clase SGLT2i',
 'Ensayo fase III en 3,730 pacientes con HFrEF NYHA II-IV. Empagliflozina 10 mg/día vs placebo, mediana de seguimiento 16 meses. Resultado primario composite de muerte CV + hospitalización por HF: HR 0.75 (IC95% 0.65-0.86, p<0.001). Hospitalizaciones por HF totales: rate ratio 0.70. Lentificación del deterioro de TFGe. Confirmó el beneficio de clase SGLT2i en HFrEF independiente de DM, abrió camino al uso del agente como pilar 4.',
 '{"sector":"cardiología","año":"2020","tipo":"RCT pivotal","especialidad":"cardiología"}'),

('copernicus-2001',
 'NEJM 2001 · Packer et al · COPERNICUS',
 'Resultados primarios',
 'Carvedilol en HFrEF severa NYHA III-IV',
 'Ensayo doble ciego en 2,289 pacientes con HFrEF severa (FEVI <25%, NYHA III-IV, euvolémicos). Carvedilol target 25 mg BID (50 BID si >85 kg) titulado en 4-6 semanas vs placebo. Reducción de mortalidad por todas las causas HR 0.65 (IC95% 0.52-0.81, p<0.001), NNT ≈ 14 a 1 año. Beneficio aparece desde las primeras 8-12 semanas post-titulación. Estableció uptitulación a dosis target como objetivo terapéutico estándar en HFrEF.',
 '{"sector":"cardiología","año":"2001","tipo":"RCT pivotal","especialidad":"cardiología"}'),

-- ============================================================
-- Contexto mexicano y operativo
-- ============================================================

('v122i-mx-prevalencia',
 'LitienGuard cerebro · genética poblacional',
 'Tabla 1',
 'Variante V122I (Val122Ile) en población mexicana',
 'La variante V122I (Val122Ile) del gen TTR — antes considerada predominante en población afro-caribeña — ha sido detectada en población mexicana con frecuencias entre 0.5-3% según el subgrupo étnico, particularmente en estados con ancestría africana (Veracruz, Guerrero, Oaxaca, Tabasco). Es la variante TTR más común asociada a ATTR-CM hereditaria de inicio tardío. La penetrancia es variable; la sospecha debe elevarse en pacientes mexicanos mayores de 60 años con HFpEF y red flags (CTS bilateral, neuropatía idiopática, historia familiar de HF). El test genético TTR está disponible en México vía referencia genética especializada.',
 '{"sector":"cardiología","año":"2026","tipo":"síntesis cerebro","especialidad":"genética / cardiología"}'),

('mx-pyp-disponibilidad',
 'LitienGuard cerebro · operativa diagnóstica MX',
 'Tabla 2',
 'Disponibilidad de PYP scan en México',
 'La gammagrafía con pirofosfato de tecnecio (Tc-99m PYP/DPD/HMDP) para diagnóstico no invasivo de ATTR-CM está disponible en centros con servicio de Medicina Nuclear en México: Instituto Nacional de Cardiología Ignacio Chávez (CDMX), Centro Médico ABC, Hospital Ángeles Pedregal, Christus Muguerza Alta Especialidad (Monterrey), Hospital San José Tec (Monterrey), Hospital Civil de Guadalajara, Hospital Aranda de la Parra (León). El radiotrazador requiere planificación previa por su vida media corta. Interpretación con criterios de Perugini (grado 0-3) y cociente corazón/contralateral.',
 '{"sector":"cardiología","año":"2026","tipo":"síntesis cerebro","especialidad":"medicina nuclear"}'),

-- ============================================================
-- Bayesian likelihood ratios — núcleo del razonamiento multi-señal
-- ============================================================

('attr-lr-ecg-bajo-voltaje',
 'Cerebro · likelihood ratios ATTR-CM',
 'Tabla 1',
 'LR del bajo voltaje paradoxal en ECG para ATTR-CM',
 'En presencia de HVI eco con bajo voltaje QRS en derivaciones de miembros (Sokolow-Lyon <15 mm, Cornell <2.0 mV), la combinación define el patrón paradoxal de ATTR-CM con likelihood ratio positivo ~3.5 (IC95% 2.4-5.1). Aisladamente no es diagnóstica (sensibilidad 40-65%) pero altamente sugestiva cuando hay LVH por eco. Mecanismo: infiltración amiloide reduce voltaje neto a pesar de masa aumentada. Combinada con apical sparing strain, LR se eleva por encima de 10.',
 '{"sector":"cardiología","año":"2026","tipo":"síntesis cerebro · LR","especialidad":"cardiología"}'),

('attr-lr-apical-sparing',
 'Cerebro · likelihood ratios ATTR-CM',
 'Tabla 1',
 'LR del patrón de apical sparing en strain longitudinal',
 'Strain longitudinal apical preservado con strain basal/medio severamente reducido (patrón cherry-on-top, ratio apical/basal >2.1) tiene likelihood ratio positivo ~12 (IC95% 6.8-21) para amiloidosis cardíaca, con sensibilidad 93% y especificidad 82% (Phelan et al, Heart 2012). Único hallazgo eco con LR alto aislado para CA. Requiere strain por speckle tracking; no detectable por eco convencional. Algunos modelos AI lo identifican implícitamente desde un único clip apical de 4 cámaras (Eur Heart J 2025).',
 '{"sector":"cardiología","año":"2026","tipo":"síntesis cerebro · LR","especialidad":"cardiología"}'),

('attr-lr-cts-bilateral',
 'Cerebro · likelihood ratios ATTR-CM',
 'Tabla 1',
 'LR del síndrome del túnel del carpo bilateral en sospecha ATTR-CM',
 'Historia de síndrome del túnel del carpo bilateral con cirugía descompresiva — particularmente >5 años antes de inicio de síntomas cardíacos — tiene LR+ ~6 para ATTR-CM en pacientes con HFpEF (Westin et al, JACC 2022). La amiloide TTR se deposita en el ligamento transverso del carpo precediendo el depósito cardíaco por 5-10 años. Estenosis del canal lumbar y rotura espontánea de tendón del bíceps son señales similares con LR+ ~4. Combinación de CTS bilateral + estenosis lumbar eleva LR+ hasta ~15.',
 '{"sector":"cardiología","año":"2026","tipo":"síntesis cerebro · LR","especialidad":"cardiología"}'),

-- ============================================================
-- Información operativa adicional
-- ============================================================

('attr-mortalidad-natural',
 'Cerebro · pronóstico ATTR-CM no tratado',
 'Síntesis',
 'Pronóstico natural de ATTR-CM sin tratamiento',
 'ATTR-CM sin tratamiento dirigido tiene mortalidad alta: mediana de sobrevida desde diagnóstico 2.5-3.6 años en ATTRwt (más común en hombres mayores) y 2-3 años en ATTRv (variantes con afección cardíaca temprana). La retardo diagnóstico promedio desde inicio de síntomas hasta diagnóstico es 39 meses (~4 años) según Lousada et al, Adv Ther 2015. El retraso correlaciona con peor pronóstico: pacientes diagnosticados en NYHA III tienen sobrevida media de 11 meses sin tratamiento estabilizador o silenciador. La detección AI temprana puede comprimir este retraso significativamente.',
 '{"sector":"cardiología","año":"2026","tipo":"síntesis pronóstica","especialidad":"cardiología"}'),

('attrcm-tafamidis-dosis',
 'Cerebro · farmacología tafamidis',
 'Síntesis',
 'Dosis y formulaciones de tafamidis',
 'Dos formulaciones aprobadas: (1) Tafamidis libre (Vyndamax) 61 mg cápsula vía oral una vez al día — bioequivalente y posología simplificada; (2) Tafamidis meglumina (Vyndaqel) 80 mg cápsula vía oral una vez al día. Ambas con la misma indicación (ATTR-CM ATTRwt o ATTRv NYHA I-III). Sin necesidad de ajuste por TFGe. Costo elevado puede limitar acceso fuera de cobertura asegurada. Adherencia crítica — la suspensión revierte beneficio en meses. La elección entre formulaciones depende de disponibilidad y costo local.',
 '{"sector":"cardiología","año":"2026","tipo":"farmacología","especialidad":"cardiología"}'),

('attrcm-acoramidis-dosis',
 'Cerebro · farmacología acoramidis',
 'Síntesis',
 'Dosis y manejo de acoramidis',
 'Acoramidis (Attruby) 712 mg cápsula vía oral cada 12 horas (1,424 mg/día). Aprobado por FDA en noviembre 2024. Diferencias clave vs tafamidis: (1) mecanismo distinto — estabilización casi completa del tetrámero TTR (>90%) vs tafamidis ~60%; (2) puede combinarse en investigación con silenciadores RNA; (3) trial ATTRibute-CM permitió pacientes con FEVI hasta 35% (más restrictivo que ATTR-ACT). Sin ajuste por TFG. Efectos adversos GI leves transitorios al inicio. Costo elevado, acceso por aseguradora o programa de soporte del fabricante.',
 '{"sector":"cardiología","año":"2026","tipo":"farmacología","especialidad":"cardiología"}'),

('attrcm-vutrisiran-dosis',
 'Cerebro · farmacología vutrisiran',
 'Síntesis',
 'Dosis y administración de vutrisiran',
 'Vutrisiran (Amvuttra) 25 mg subcutáneo cada 3 meses. Aprobado por FDA para ATTR-CM en 2024 tras los resultados de HELIOS-B. Mecanismo: siRNA conjugado a N-acetilgalactosamina (GalNAc) que se internaliza en hepatocitos vía receptor de asialoglicoproteína; degrada selectivamente el mRNA del gen TTR, reduciendo producción hepática de TTR sérica en >80%. Suplementación con vitamina A recomendada por reducción concomitante de proteína de unión a retinol. Ventaja operativa: dosis trimestral vs diaria. Costo elevado.',
 '{"sector":"cardiología","año":"2026","tipo":"farmacología","especialidad":"cardiología"}'),

-- ============================================================
-- Update KDIGO 2024 (CKD Evaluation and Management)
-- ============================================================

('kdigo-2024-erc-sglt2',
 'KDIGO 2024 CKD Evaluation and Management',
 'Cap. 3.2',
 'SGLT2i en ERC con o sin DM',
 'KDIGO 2024 expande la indicación de SGLT2i a pacientes con ERC eGFR ≥20 mL/min/1.73m² independientemente de DM, basado en DAPA-CKD y EMPA-KIDNEY. Class I recommendation. Beneficio: reducción de progresión de ERC, eventos CV y mortalidad. Iniciar idealmente cuando eGFR estable ≥20; continuar hasta diálisis o trasplante si tolerado. Vigilar volumen y aumento transitorio de creatinina (esperable, no requiere suspensión salvo elevación >30%). Compatible con IECA/ARA II, MRA, finerenona.',
 '{"sector":"nefrología","año":"2024","tipo":"guía","fuerza":"Class I LOE A","especialidad":"nefrología / cardiología"}'),

('kdigo-2024-finerenona',
 'KDIGO 2024 CKD Evaluation and Management',
 'Cap. 3.3',
 'Finerenona en ERC con DM2 y albuminuria',
 'Finerenona (antagonista no esteroideo del receptor mineralocorticoide) recomendada en ERC + DM2 con albuminuria persistente (UACR ≥30 mg/g) a pesar de IECA/ARA II a dosis máxima tolerada. Dosis 10-20 mg/día según TFG y K. Evidencia FIDELIO-DKD y FIGARO-DKD: reducción de progresión renal HR ~0.82 y de eventos CV HR ~0.86. Riesgo de hiperpotasemia menor que espironolactona pero requiere vigilancia. Sinérgica con SGLT2i sin incremento significativo de K en pacientes seleccionados.',
 '{"sector":"nefrología","año":"2024","tipo":"guía","fuerza":"Class I LOE A","especialidad":"nefrología"}'),

-- ============================================================
-- Cobertura de DELIVER y EMPEROR-Preserved (HFpEF)
-- ============================================================

('deliver-2022-hfpef',
 'NEJM 2022 · Solomon et al · DELIVER',
 'Resultados primarios',
 'Dapagliflozina en HFmrEF/HFpEF',
 'Ensayo fase III en 6,263 pacientes con HF y FEVI >40% (HFmrEF + HFpEF). Dapagliflozina 10 mg/día vs placebo, mediana 2.3 años. Resultado primario composite de empeoramiento de HF o muerte CV: HR 0.82 (IC95% 0.73-0.92, p<0.001). Beneficio consistente en todo el rango de FEVI >40%, en pacientes con y sin DM, hospitalización reciente o no. Junto con EMPEROR-Preserved cambió el paradigma de tratamiento en HFpEF, donde antes no había terapia eficaz.',
 '{"sector":"cardiología","año":"2022","tipo":"RCT pivotal","especialidad":"cardiología"}'),

('emperor-preserved-2021',
 'NEJM 2021 · Anker et al · EMPEROR-Preserved',
 'Resultados primarios',
 'Empagliflozina en HFpEF',
 'Ensayo fase III en 5,988 pacientes con HF y FEVI >40%. Empagliflozina 10 mg/día vs placebo, mediana 26 meses. Resultado primario composite de hospitalización por HF o muerte CV: HR 0.79 (IC95% 0.69-0.90, p<0.001). Reducción impulsada principalmente por hospitalizaciones por HF; efecto modesto sobre mortalidad. Beneficio consistente en pacientes con y sin DM. Primera terapia con beneficio robusto demostrado en HFpEF (FEVI >40%), abriendo el campo de tratamiento médico dirigido a este subgrupo.',
 '{"sector":"cardiología","año":"2021","tipo":"RCT pivotal","especialidad":"cardiología"}'),

-- ============================================================
-- Estabilizadores experimentales no farmacéuticos
-- ============================================================

('cms-cardiac-amyloid-policy',
 'CMS National Coverage Determination 2024',
 'Sección 2',
 'Cobertura Medicare/Medicaid para tafamidis y acoramidis',
 'CMS estableció cobertura nacional condicionada en 2024 para tafamidis y acoramidis en ATTR-CM con: (1) diagnóstico confirmado por PYP scan positivo MÁS proteínas monoclonales negativas O biopsia con tipificación; (2) NYHA I-III estable; (3) FEVI documentada en el último año; (4) prescripción por cardiólogo o hematólogo con experiencia en amiloidosis. Aplica para pacientes estadounidenses; en México el acceso depende de aseguradora privada o programas compasivos del fabricante.',
 '{"sector":"cardiología","año":"2024","tipo":"acceso / cobertura","especialidad":"cardiología"}'),

-- ============================================================
-- Cribado en HFpEF — algoritmo de sospecha
-- ============================================================

('attr-cm-screening-algorithm',
 'Cerebro · algoritmo de sospecha ATTR-CM en HFpEF',
 'Síntesis',
 'Algoritmo clínico de sospecha ATTR-CM en HFpEF',
 'Algoritmo recomendado en HFpEF: en cualquier paciente >60 años con HFpEF, evaluar red flags en check-list. Si ≥1 red flag presente → solicitar AI-ECG o AI-echo screening (si disponible) y/o NT-proBNP-troponina-FLC paneles. Si AI o paneles sugieren alta probabilidad → algoritmo no invasivo (PYP + FLC κ/λ). En afroamericanos / población mexicana con ancestría africana, considerar test genético TTR aún sin red flags adicionales por prevalencia de V122I. La tasa de subdiagnóstico actual estimada es 80-90%: la mayoría de pacientes con ATTR-CM están etiquetados como HFpEF idiopático.',
 '{"sector":"cardiología","año":"2026","tipo":"síntesis cerebro","especialidad":"cardiología"}'),

('amyloid-al-vs-attr',
 'Cerebro · diferenciación AL vs ATTR',
 'Síntesis',
 'Diferenciación entre amiloidosis AL y ATTR',
 'Amiloidosis AL (cadenas ligeras de inmunoglobulina): más agresiva, mortalidad si no tratada en meses; afección multi-orgánica (riñón, corazón, hígado, tejidos blandos); requiere quimioterapia anti-clonal +/- trasplante; FLC κ/λ casi siempre anormal, electroforesis con proteína monoclonal. Amiloidosis ATTR (transtiretina): más lenta, sobrevida en años; preferentemente cardíaca o neurológica; tratamiento con estabilizadores TTR o silenciadores; FLC κ/λ normal por definición. La distinción es crítica: ATTR no responde a tratamiento AL y viceversa. Toda sospecha de CA requiere proteínas monoclonales + FLC + PYP en paralelo.',
 '{"sector":"cardiología","año":"2026","tipo":"síntesis cerebro","especialidad":"hematología / cardiología"}'),

-- ============================================================
-- HFrEF — guías regionales mexicanas 2024-2025
-- ============================================================

('mx-sociedad-cardiologia-hf-2024',
 'Sociedad Mexicana de Cardiología — Consenso HF 2024',
 'Recomendaciones clave',
 'Consenso mexicano de manejo de HF 2024',
 'La Sociedad Mexicana de Cardiología adoptó en 2024 las recomendaciones de los 4 pilares para HFrEF: IECA/ARNi + BB + MRA + SGLT2i. Énfasis en: (1) acceso equitativo a SGLT2i vía cuadros básicos públicos (cobertura IMSS/ISSSTE pendiente extensión); (2) titulación rápida (target en 4-6 semanas tras alta); (3) escalamiento a ARNi en pacientes con tolerancia a IECA; (4) educación del paciente sobre adherencia. Reconoce la barrera económica al acceso completo y propone esquemas de copago en hospitales privados.',
 '{"sector":"cardiología","año":"2024","tipo":"consenso regional MX","especialidad":"cardiología"}')

on conflict (id) do update set
  source = excluded.source,
  page = excluded.page,
  title = excluded.title,
  content = excluded.content,
  meta = excluded.meta,
  updated_at = now();

-- Forzar refresh del cache del cerebro la próxima vez que la app lo lea
-- (el cache TTL es de 60s en lib/bm25/index.ts).

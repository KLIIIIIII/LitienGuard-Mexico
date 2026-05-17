-- LitienGuard — Cerebro · ingestión paper Lin et al 2024 Frontiers Smart Healthcare
--
-- Paper: "The Frontiers of Smart Healthcare Systems" — Lin N, Paul R,
-- Guerra S, Liu Y, Doulgeris J, Shi M, Lin M, Engeberg ED, Hashemi J,
-- Vrionis FD. Florida Atlantic University + Harvard Ophthalmology AI Lab
-- + Boca Raton Regional Hospital. Healthcare 2024, 12, 2330.
-- DOI 10.3390/healthcare12232330. CC BY 4.0. Funding NSF #2205205.
--
-- Complementa al chunk almarri-2025 (definición + drivers + challenges)
-- con profundización en 4 dominios técnicos × 4 facetas + datos
-- cuantitativos de estudios reales y tablas de modelos AI.
--
-- 11 chunks: 4 dominios (admin/imaging/diagnostics/intervention) +
-- AI technologies overview + AI models in imaging + ethics table +
-- bias impact study Jabbour 2023 + frontiers (blockchain, autonomous
-- surgery, AI rehab) + policy conclusions.

insert into public.cerebro_chunks (id, source, page, title, content, meta) values

('lin-2024-shc-dominios-ai',
 'Lin N, Paul R, Guerra S, Liu Y, Doulgeris J, Shi M, Lin M, Engeberg ED, Hashemi J, Vrionis FD · Healthcare 2024, 12, 2330',
 'Figura 1 · Overview',
 'Cuatro dominios de aplicación de AI en healthcare',
 'La integración de Inteligencia Artificial en salud opera en cuatro dominios principales: (1) Administración — automatización vía NLP y EHRs, scheduling, billing, records; (2) Medical Imaging — deep learning con CNN y arquitectura U-Net para segmentación; (3) Diagnostics — risk prediction, identificación de patrones, diagnósticos personalizados; (4) Intervention — cirugía robótica con precisión mejorada, control remoto y mínima invasividad. Las cuatro se integran en el ecosistema de Smart Healthcare Systems pero cada una tiene shortcomings, possibilities, realities y frontiers distintas que deben analizarse separadamente. Adopción de AI en healthcare es más lenta que en otras industrias por desafíos técnicos, éticos y regulatorios.',
 '{"sector":"healthcare tech","año":"2024","tipo":"narrative review","especialidad":"AI clínica","license":"CC BY 4.0"}'),

('lin-2024-shc-tecnologias-ai',
 'Lin N, Paul R, Guerra S et al · Healthcare 2024, 12, 2330',
 'Table 1 · AI Technologies',
 'Catálogo de tecnologías AI usadas en healthcare',
 'Siete tecnologías AI dominantes en healthcare con aplicaciones específicas: (1) CNN (Convolutional Neural Networks) — análisis de imagen médica, alta precisión pero requiere datasets grandes; (2) NLP (Natural Language Processing) — transcripción automática de EHR, variabilidad del lenguaje es desafío; (3) GAN (Generative Adversarial Networks) — image augmentation, computacionalmente caro; (4) RNN (Recurrent Neural Networks) — monitoreo del paciente y predictive analytics en series temporales; (5) Reinforcement Learning — treatment planning con recomendaciones personalizadas, complejo de implementar clínicamente; (6) Decision Trees — risk assessment, fácil de interpretar pero prone a overfitting; (7) Support Vector Machines (SVM) — diagnósticos en espacios de alta dimensión, requiere tuning cuidadoso de parámetros. Cada técnica tiene tradeoff entre interpretabilidad y poder predictivo.',
 '{"sector":"healthcare tech","año":"2024","tipo":"narrative review","especialidad":"AI/ML técnica"}'),

('lin-2024-shc-ai-administracion-nuance',
 'Lin N, Paul R, Guerra S et al · Healthcare 2024, 12, 2330',
 'Sección 3.3.A · Realities · Administración',
 'AI en administración: caso Nuance CAPD en Universal Health Services',
 'Caso real cuantitativo de AI en administración hospitalaria: Universal Health Services (UHS) implementó Nuance Computer-Assisted Physician Documentation (CAPD), sistema cloud-based de speech con workflow de Clinical Documentation Improvement (CDI). Resultados medidos: (1) 69% de reducción en costos de transcripción equivalente a ahorro de USD 3 millones anuales; (2) 12% de incremento en Case Mix Index (CMI) que mejora allocation de recursos; (3) 36% de mejora en documentación de casos de enfermedad severa; (4) 24% de incremento en detalle para pacientes de alto riesgo. El sistema apoya engagement del médico en quality improvement, reduce costos de transcripción, acelera documentación y mejora precisión y detalle del expediente — impactando métricas de calidad y reembolsos. NLP extrae información de notas clínicas no estructuradas y la convierte en datos estructurados para EHR.',
 '{"sector":"healthcare tech","año":"2024","tipo":"caso clínico","especialidad":"informática médica","métricas":"caso real cuantificado"}'),

('lin-2024-shc-ai-imaging-mammography',
 'Lin N, Paul R, Guerra S et al · Healthcare 2024, 12, 2330',
 'Sección 3.3.B · Realities · Imaging',
 'AI en imaging: caso AI-CAD mammography (Mayo 2019)',
 'Caso cuantitativo de AI en imaging diagnóstico: estudio retrospectivo en 250 mamografías comparó AI-based Computer-Aided Detection (AI-CAD) contra CAD convencional aprobado por FDA, evaluando false positives per image (FPPI) y sensibilidad/especificidad. Resultados: (1) Reducción global de 69% en FPPI con AI-CAD manteniendo sensibilidad; (2) Reducción de 83% para calcificaciones y 56% para masas; (3) 48% de casos sin marcas con AI-CAD vs solo 17% con CAD convencional; (4) Reducción estimada de 17% en tiempo de lectura del radiólogo por caso. Implicación social: menos recalls innecesarios en screening, mejor experiencia de la paciente, beneficios económicos. Otras aplicaciones de AI en imaging incluyen detección de nódulos pulmonares en TC con performance comparable a radiólogos humanos y detección de retinopatía diabética en imágenes retinianas con alta precisión.',
 '{"sector":"healthcare tech","año":"2024","tipo":"caso clínico","especialidad":"radiología / imaging AI","métricas":"caso real cuantificado"}'),

('lin-2024-shc-ai-bias-jabbour-2023',
 'Lin N, Paul R, Guerra S et al · Healthcare 2024, 12, 2330',
 'Sección 3.1.C · Diagnostics · Bias study',
 'Impacto cuantificado del bias en AI sobre decisión clínica (Jabbour 2023)',
 'Estudio crítico Jabbour et al 2023 (publicado en JAMA) cuantifica el impacto del bias en AI sobre la decisión clínica. Diseño: cohorte de hospital-based physicians, nurse practitioners y physician assistants en 13 estados de USA, abril 2022 a enero 2023, revisaron 9 casos clínicos de falla respiratoria aguda. Procedimiento: primero 2 casos sin asistencia AI (baseline accuracy 73.0%), después 6 casos con predicciones AI — estándar o sesgada, con o sin explicaciones. Resultados: (1) AI estándar mejora accuracy +2.9 puntos porcentuales (+4.4 con explicaciones); (2) AI sesgada DISMINUYE accuracy −11.3 puntos; (3) explicaciones solo mitigan parcialmente el daño del bias (+2.3 puntos no significativo). Conclusión: el bias en AI no es tema teórico — es tema cuantificable que erosiona accuracy del clínico. Implicación operacional: validación de datasets diversos + bias audits ANTES de deployment + supervisión continua.',
 '{"sector":"healthcare tech","año":"2024","tipo":"validación clínica","especialidad":"ética AI / patient safety","métricas":"JAMA RCT"}'),

('lin-2024-shc-ai-diagnostics-sepsis',
 'Lin N, Paul R, Guerra S et al · Healthcare 2024, 12, 2330',
 'Sección 3.2.C · Possibilities · Diagnostics',
 'AI en diagnóstico: predicción temprana de sepsis con ML',
 'Aplicación de mayor impacto clínico documentado de AI en diagnóstico: algoritmos de machine learning predicen sepsis horas antes de que sea clínicamente aparente, permitiendo intervención temprana. Modelo Desautels 2016 entrenado con mínimos datos de EHR alcanzó predicción significativa, validada en posteriores estudios prospectivos. Adicionalmente, AI predice riesgo de cánceres específicos basado en marcadores genéticos + factores de estilo de vida, identifica patrones en data médica no evidentes al clínico humano, y soporta personalized medicine analizando información genética + historia médica + datos clínicos para recomendar diagnóstico y plan de tratamiento. Limitación: dataset bias — modelos entrenados en datos no representativos de poblaciones diversas pueden tener performance desigual entre grupos demográficos, lo cual exacerba inequidades existentes en salud.',
 '{"sector":"healthcare tech","año":"2024","tipo":"narrative review","especialidad":"sepsis / predictive analytics"}'),

('lin-2024-shc-ai-surgical-davinci-mako',
 'Lin N, Paul R, Guerra S et al · Healthcare 2024, 12, 2330',
 'Sección 3.3.D · Realities · Intervention',
 'AI en cirugía robótica: da Vinci + MAKO',
 'Dos plataformas robóticas líderes con AI en cirugía: (1) da Vinci Surgical System — provee precisión mejorada, destreza y control en procedimientos mínimamente invasivos, demostró capacidad de mejorar precisión quirúrgica reduciendo riesgo de complicaciones; (2) MAKO Robotic System — plataforma premier para cirugías ortopédicas (artroplastia), utiliza TC preoperatoria para planeación quirúrgica detallada, provee haptic feedback durante el procedimiento para asegurar resección ósea precisa, mejora alineación y precisión en colocación de componentes, lleva a mejores tasas de supervivencia del implante y reducción de cirugías de revisión. Limitaciones para adopción: costo prohibitivo para hospitales en low- y middle-income countries; necesidad de training extenso de cirujanos; proceso regulatorio FDA estricto antes de aprobación; concerns sobre confiabilidad y seguridad de procedimientos quirúrgicos autónomos vs cirujano humano frente a situaciones inesperadas.',
 '{"sector":"healthcare tech","año":"2024","tipo":"caso clínico","especialidad":"cirugía robótica / ortopedia"}'),

('lin-2024-shc-ai-imaging-models',
 'Lin N, Paul R, Guerra S et al · Healthcare 2024, 12, 2330',
 'Table 5 · AI models in imaging',
 'Modelos AI específicos por aplicación en medical imaging',
 'Nueve modelos AI dominantes en medical imaging con su aplicación clínica: (1) U-Net — tumor segmentation, alta precisión en delineación pero requiere datasets grandes; (2) GAN — image augmentation, mejora performance del modelo pero computacionalmente intensivo; (3) VGGNet — clasificación de imagen, fuerte extracción de features pero arquitectura profunda con riesgo de overfitting; (4) ResNet — clasificación de imagen, resuelve vanishing gradient problem, complejidad incrementa con profundidad; (5) DenseNet — lesion detection, eficiente feature reuse, alto consumo de memoria; (6) YOLO — object detection en tiempo real, menor precisión para objetos pequeños; (7) Xception — clasificación de enfermedades, depthwise separable convolutions eficientes, requiere extensive tuning; (8) MobileNet — aplicaciones móviles, ligero y rápido en dispositivos móviles, menor precisión vs modelos grandes; (9) Faster R-CNN — detección de tumores, alta precisión pero más lento que single-shot models. Cada modelo es tradeoff entre precisión, velocidad y consumo computacional.',
 '{"sector":"healthcare tech","año":"2024","tipo":"narrative review","especialidad":"imaging AI / deep learning"}'),

('lin-2024-shc-etica-regulatoria',
 'Lin N, Paul R, Guerra S et al · Healthcare 2024, 12, 2330',
 'Table 4 + Sección 4.3 · Ética',
 'Nueve consideraciones éticas y regulatorias para AI en healthcare',
 'Nueve dimensiones éticas y regulatorias críticas para AI clínica con soluciones propuestas: (1) Accountability — determinar responsabilidad ante error: establecer guidelines claros de liability + supervisión humana; (2) Patient Consent — consentimiento informado para uso de AI: comunicación transparente + opt-in policies; (3) Data Security — protección de PHI: encryption + blockchain para integridad; (4) Bias and Fairness — riesgo de modelos sesgados: datasets diversos + bias audits regulares; (5) Transparency — dificultad de explicar decisiones AI: frameworks de Explainable AI (XAI); (6) Regulatory Compliance — navegar ambientes regulatorios complejos: colaboración con reguladores; (7) Privacy — manejo de PHI en sistemas AI: controles estrictos de acceso + anonimización; (8) Trust — construir confianza entre HCPs y pacientes: iniciativas educativas + demostrar eficacia con estudios; (9) Interoperability — integración con sistemas existentes: formatos de datos estandarizados + APIs. Como AI gana autonomía, frameworks legales deben establecerse para clarificar liability en casos de malpráctica o error.',
 '{"sector":"healthcare tech","año":"2024","tipo":"narrative review","especialidad":"ética / regulación / governance"}'),

('lin-2024-shc-challenges-soluciones',
 'Lin N, Paul R, Guerra S et al · Healthcare 2024, 12, 2330',
 'Table 3 · Challenges + Solutions',
 'Nueve challenges de adopción de AI en healthcare con soluciones',
 'Nueve barreras de adopción de AI en salud con soluciones específicas: (1) Data Privacy — concerns de seguridad de datos del paciente: implementar blockchain + fortalecer encryption; (2) Dataset Bias — falta de datos de entrenamiento diversos: asegurar datasets diversos + conducir bias audits; (3) Lack of Explainability — dificultad de interpretar decisiones del modelo: desarrollar modelos interpretables + técnicas XAI; (4) Integration Issues — dificultad de integrar AI con sistemas legacy: usar APIs para compatibilidad + modernización gradual; (5) Regulatory Compliance — navegar regulaciones complejas: colaborar con reguladores + estar actualizado en guidelines; (6) High Costs — inversión significativa en AI: aprovechar soluciones cloud-based + explorar partnerships público-privados; (7) Staff Resistance — reluctancia del personal a adoptar tecnología nueva: proveer programas de training + destacar beneficios; (8) Limited Infrastructure — infraestructura tecnológica inadecuada: invertir en upgrades de IT + utilizar cloud computing; (9) Data Interoperability — compartir datos del paciente entre sistemas: adoptar formatos de datos estandarizados (FHIR) + implementar health information exchanges.',
 '{"sector":"healthcare tech","año":"2024","tipo":"narrative review","especialidad":"gestión hospitalaria / adopción"}'),

('lin-2024-shc-frontiers-conclusion',
 'Lin N, Paul R, Guerra S et al · Healthcare 2024, 12, 2330',
 'Sección 3.4 + 5 · Frontiers + Conclusions',
 'Fronteras y framework de política para AI en healthcare',
 'Fronteras de Smart Healthcare incluyen: (1) AI-driven personalized health records que activamente proveen consejos tailored y predictive insights individualizados; (2) Blockchain integrado con AI para sistema descentralizado y seguro de información del paciente, resolviendo concerns de data privacy; (3) Imaging AI en tiempo real durante cirugía + dispositivos portátiles AI-powered para low-resource settings; (4) Self-diagnostic tools IoT en wearables y smartphones para care preventiva; (5) Cirugía autónoma para procedimientos de alto riesgo + AI-enhanced tele-surgery globalmente; (6) AI-driven rehabilitation ajustando terapia en tiempo real. Framework de política recomendado: guidelines específicos para data privacy, certificación de algoritmos AI similar a protocolos de dispositivos médicos asegurando benchmarks de precisión y confiabilidad antes de uso clínico, monitoreo continuo + auditorías regulares + updates, promover data sharing inter-institucional protegiendo privacidad, colaboración entre developers + clínicos + ethicists, y educación AI embebida en currícula médica. La adopción responsable de AI mejora outcomes del paciente y confianza en la innovación.',
 '{"sector":"healthcare tech","año":"2024","tipo":"narrative review","especialidad":"política de salud / governance / educación médica"}')

on conflict (id) do update set
  source = excluded.source,
  page = excluded.page,
  title = excluded.title,
  content = excluded.content,
  meta = excluded.meta,
  updated_at = now();

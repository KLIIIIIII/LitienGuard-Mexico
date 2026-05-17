-- LitienGuard — Cerebro · ingestión paper Almarri et al 2025 Smart Healthcare
--
-- Paper: "A Review of Smart Healthcare: Concept, Drivers, Characteristics,
-- and Challenges" — Almarri A, Hunaiti Z, Manivannan N (Brunel University
-- of London). Hospitals 2025, 2, 26. DOI 10.3390/hospitals2040026.
-- CC BY 4.0 — open access reusable con atribución.
--
-- 10 chunks: concepto, drivers (general + COVID + workforce), characteristics,
-- challenges (general + interop + ethics), caso Singapore vs India,
-- conclusiones de policy. Cada chunk paráfrasis fiel en español
-- conservando definiciones técnicas verbatim cuando aplica.
--
-- Embedding queda NULL — se llena con scripts/embed-cerebro-chunks.mjs
-- después del deploy. Mientras tanto, BM25 los indexa normalmente.

insert into public.cerebro_chunks (id, source, page, title, content, meta) values

('almarri-2025-shc-definicion',
 'Almarri A, Hunaiti Z, Manivannan N · Hospitals 2025, 2, 26',
 'Sección 3.1 · Conceptualización',
 'Definición operativa de Smart Healthcare (SHC)',
 'Smart Healthcare (SHC) se define como la integración de tecnologías avanzadas — Internet of Things (IoT), Inteligencia Artificial (IA) e internet móvil — en los sistemas de salud para mejorar el cuidado, monitoreo y tratamiento del paciente. Implica el uso de sensores inteligentes, dispositivos vestibles (wearables) y plataformas de análisis de datos para recolectar y procesar información de forma autónoma, permitiendo monitoreo continuo y toma de decisiones informada. La SHC trasciende los límites físicos de hospitales y clínicas, extendiéndose a hogares, lugares de trabajo y espacios comunitarios — conectando pacientes y profesionales de salud independientemente de ubicación o zona horaria. El modelo tradicional reactivo y hospital-céntrico transita hacia uno proactivo, personalizado y preventivo.',
 '{"sector":"healthcare tech","año":"2025","tipo":"narrative review","especialidad":"informática médica","license":"CC BY 4.0"}'),

('almarri-2025-shc-drivers-overview',
 'Almarri A, Hunaiti Z, Manivannan N · Hospitals 2025, 2, 26',
 'Sección 3.3 · Drivers',
 'Seis drivers de adopción de Smart Healthcare',
 'Seis drivers principales impulsan la adopción de Smart Healthcare a nivel global: (1) Avances tecnológicos — IoT, IA y analítica de datos sofisticada; (2) Sociedades de ciudadanos digitales — Generation Z como nativos digitales que esperan integración tech en todos los servicios; (3) Modelos cambiantes de cuidado al paciente — envejecimiento poblacional y necesidad de cuidado en casa con monitoreo remoto; (4) Escasez de fuerza laboral en salud — sistemas que potencien al personal existente; (5) Costos crecientes de atención — proyección de 20-30% del PIB nacional en 2050 si no se interviene; (6) Impacto de COVID-19 — aceleró integración digital para mantener continuidad de cuidado durante confinamientos. Los seis combinados explican por qué los sistemas tradicionales legacy son insuficientes.',
 '{"sector":"healthcare tech","año":"2025","tipo":"narrative review","especialidad":"política de salud / informática médica"}'),

('almarri-2025-shc-driver-covid19',
 'Almarri A, Hunaiti Z, Manivannan N · Hospitals 2025, 2, 26',
 'Sección 3.3.6 · Impact of COVID-19',
 'COVID-19 como acelerador de Smart Healthcare',
 'La pandemia COVID-19 transformó fundamentalmente cómo se accede y entrega atención médica. Los confinamientos hicieron esenciales las consultas remotas, validando la utilidad de plataformas digitales que inicialmente generaban escepticismo. Las teleconsultas ganaron aceptación amplia por su efectividad y conveniencia, aunque persisten implicaciones de largo plazo por la ruptura de consultas presenciales normativas. Países como Reino Unido, Francia y Suecia experimentaron incrementos dramáticos en uso de teleconsulta, impulsando desarrollo de políticas y programas de capacitación. El evento validó la practicidad de Smart Healthcare y aceleró su integración a servicios mainstream — antes de 2020 era piloto, después de 2020 es esperado.',
 '{"sector":"healthcare tech","año":"2025","tipo":"narrative review","especialidad":"telemedicina / política"}'),

('almarri-2025-shc-driver-workforce',
 'Almarri A, Hunaiti Z, Manivannan N · Hospitals 2025, 2, 26',
 'Sección 3.3.4 · Workforce',
 'Escasez de fuerza laboral en salud como driver de SHC',
 'La escasez global ubicua de profesionales de salud (HCPs) ha motivado la exploración de soluciones tecnológicas para aliviar la carga del personal. Sistemas de IA que proveen monitoreo continuo del paciente pueden reducir la necesidad de supervisión manual constante por enfermería o médicos, liberando tiempo para interacciones más complejas centradas en humanos mientras se mantiene monitoreo de alta calidad. Además, la explosión de datos en salud requiere sistemas capaces de manejar y analizar grandes datasets eficientemente — algo que IA y plataformas digitales facilitan. La escasez de personal NO debe verse como problema a resolver con más contratación sino con apalancamiento tecnológico que multiplica capacidad por médico.',
 '{"sector":"healthcare tech","año":"2025","tipo":"narrative review","especialidad":"gestión hospitalaria"}'),

('almarri-2025-shc-characteristics',
 'Almarri A, Hunaiti Z, Manivannan N · Hospitals 2025, 2, 26',
 'Sección 3.2 · Características (Table 4)',
 'Cinco características clave de Smart Hospitals',
 'Cinco características definen a un Smart Hospital: (1) Integración de tecnologías avanzadas — IA, robótica quirúrgica (ej. da Vinci) y mixed reality para mejorar diagnóstico, tratamiento y eficiencia; (2) Mobile Health services — dispositivos móviles y wearables para auto-monitoreo del paciente y acceso a Personal Health Records; (3) Telehealth — entrega remota vía teleconsulta, tele-ICU y agentes virtuales para continuidad de cuidado en cualquier momento, en cualquier lugar; (4) Prevención y monitoreo — recolección continua de datos con wearables permitiendo detección temprana y acceso fácil del clínico a información del paciente; (5) Soporte a investigación — herramientas digitales que aceleran descubrimiento de fármacos, ensayos clínicos y recolección de datos. Diferenciar drivers (por qué adoptamos SHC) de characteristics (cómo se ve SHC en la práctica) evita confundir motivación con feature.',
 '{"sector":"healthcare tech","año":"2025","tipo":"narrative review","especialidad":"informática médica"}'),

('almarri-2025-shc-challenges-overview',
 'Almarri A, Hunaiti Z, Manivannan N · Hospitals 2025, 2, 26',
 'Sección 3.4 · Challenges',
 'Seis desafíos de implementación de Smart Healthcare',
 'Seis desafíos principales asocian la implementación de Smart Healthcare: (1) Interacción humana reducida y monitoreo del paciente — la tecnología no reemplaza la compasión ni el juicio clínico del HCP, la sobre-dependencia genera cuidado impersonal; (2) Precisión y confiabilidad de datos — entrada de datos errónea lleva a misdiagnóstico, dosis incorrecta y errores de tratamiento, requiere protocolos robustos de verificación; (3) Seguridad y privacidad de datos — sistemas no seguros llevan a robo de registros médicos y pérdida de confianza, requiere ciberseguridad fuerte; (4) Interoperabilidad y desempeño del sistema — ecosistema IoT debe soportar múltiples usuarios simultáneos, sin autenticación optimizada hay delays o crashes; (5) Preocupaciones éticas y confianza en IA — la IA carece de inteligencia emocional y responsabilidad clara, desacuerdos entre IA y juicio clínico crean confusión; (6) Costos financieros altos — inversión inicial significativa en infraestructura, software, hardware, training y upgrades continuos.',
 '{"sector":"healthcare tech","año":"2025","tipo":"narrative review","especialidad":"gestión / política"}'),

('almarri-2025-shc-interoperabilidad-first',
 'Almarri A, Hunaiti Z, Manivannan N · Hospitals 2025, 2, 26',
 'Sección 5 · Conclusiones',
 'Interoperabilidad como requisito de primer orden en SHC',
 'La política de adopción de Smart Healthcare debe priorizar interoperabilidad como requisito de primer orden — no como característica deseable. Registros de salud, imágenes, dispositivos y datos de monitoreo remoto necesitan moverse de forma segura y consistente entre organizaciones y fronteras nacionales. Esto requiere: adopción de estándares de datos y mensajería reconocidos internacionalmente (HL7 FHIR, USCDI, IHE), conformance y certificación de vendors durante procurement, e hitos explícitos de integración para que los flujos de información sean confiables desde el día uno. La interoperabilidad no es opcional ni viene después — sin ella el resto del Smart Hospital es teatro de tecnología.',
 '{"sector":"healthcare tech","año":"2025","tipo":"narrative review","especialidad":"interoperabilidad / política"}'),

('almarri-2025-shc-etica-ai-gobernanza',
 'Almarri A, Hunaiti Z, Manivannan N · Hospitals 2025, 2, 26',
 'Sección 3.2.3 + 3.4.5 · Ética / Trust in AI',
 'Marco de gobernanza ética para IA clínica',
 'Traducir ética en mecanismos concretos para IA clínica requiere: (1) Documentación del modelo y auditorías de sesgo (fairness) — evaluación across subgroups antes de uso rutinario; (2) Exposición del rationale (explainability) — el médico debe poder ver por qué la IA sugiere X; (3) Checkpoints human-in-the-loop (accountability) — la IA sugiere, el humano decide y firma; (4) Privacy/security impact assessments — antes de deploy y periódicamente; (5) Conformance testing para interoperabilidad. Anclas éticas: autonomía (juicio clínico no se subordina a IA), beneficencia (bien del paciente sobre métricas de adopción), accountability documentada (auditable). Caso cautelar IBM Watson en oncología: potencial limitado por falta de explainability y mal fit local — validación local + supervisión humana son obligatorios, no opcionales.',
 '{"sector":"healthcare tech","año":"2025","tipo":"narrative review","especialidad":"ética / IA clínica"}'),

('almarri-2025-shc-singapore-vs-india',
 'Almarri A, Hunaiti Z, Manivannan N · Hospitals 2025, 2, 26',
 'Sección 3.1 + Table 3 · Casos país',
 'Singapore (HIC) vs India (LMIC) — dos caminos de Smart Healthcare',
 'Dos casos contrastantes con lecciones complementarias. Singapore (high-income): construyó sistema digital integrado priorizando prevención (Healthier SG, NEHR), con vista única del expediente del paciente via plataformas nacionales; evaluaciones tempranas reportan estancias hospitalarias más cortas y menos camas-días post-rollout en hospital terciario. Fortalezas: integración, gobernanza, prevención. Gaps clave: onboarding universal de proveedores e inclusión digital de adultos mayores. India (LMIC): eSanjeevani es servicio nacional de telemedicina con escala masiva, beneficiando comunidades rurales y remotas; estudios muestran buena concordancia diagnóstica entre teleconsulta y atención presencial en Gujarat rural. Fortalezas: alcance y equidad a escala, bajo costo. Gaps: conectividad, capacidades digitales, calidad consistente entre regiones, integración limitada con expediente compartido. Implicación para LATAM: no se requiere replicar Singapore para impactar — el modelo India demuestra que reach + equity a escala generan valor antes de la integración perfecta.',
 '{"sector":"healthcare tech","año":"2025","tipo":"narrative review","especialidad":"política de salud / case study","países":"Singapore + India"}'),

('almarri-2025-shc-equidad-digital',
 'Almarri A, Hunaiti Z, Manivannan N · Hospitals 2025, 2, 26',
 'Sección 5 · Conclusiones · Equidad',
 'Inclusión digital como prevención de nuevas inequidades en SHC',
 'La inclusión digital debe operacionalizarse en práctica, no solo declararse en principio. Componentes obligatorios: conectividad de última milla (last-mile), opciones de bajo ancho de banda, acceso asistido o mediado por familiar/promotor de salud, interfaces multilingües, diseño accesible (WCAG 2.2 AA mínimo). Sin esto, Smart Healthcare crea nuevas disparidades particularmente para adultos mayores, comunidades rurales y personas con discapacidad. El éxito se juzga por resultados tangibles que mejoran calidad de atención — no por tasa de adopción de tecnología per se. El monitoreo durante COVID-19 reveló brechas digitales (conectividad, dispositivos, habilidades, idioma) que llevaron a beneficios desiguales — respuestas prácticas incluyen monitoreo de gaps de outcome (no solo conteo de visitas) y safeguards de privacidad y consentimiento alineados a principios GDPR/HIPAA con flujos de datos interoperables que aseguran que los encuentros remotos quedan capturados en registros longitudinales.',
 '{"sector":"healthcare tech","año":"2025","tipo":"narrative review","especialidad":"equidad / política"}')

on conflict (id) do update set
  source = excluded.source,
  page = excluded.page,
  title = excluded.title,
  content = excluded.content,
  meta = excluded.meta,
  updated_at = now();

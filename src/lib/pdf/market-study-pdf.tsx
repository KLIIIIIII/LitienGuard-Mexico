import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 60,
    paddingBottom: 70,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1F1E1B",
    backgroundColor: "#FBFAF6",
    lineHeight: 1.45,
  },
  // Cover styles
  coverPage: {
    paddingTop: 100,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
    backgroundColor: "#FBFAF6",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "100%",
  },
  coverBrand: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#1F1E1B",
    letterSpacing: -0.8,
  },
  coverDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4A6B5B",
    marginTop: 8,
  },
  coverSubtitle: {
    fontSize: 10,
    color: "#8B887F",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginTop: 16,
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: "#1F1E1B",
    letterSpacing: -0.9,
    lineHeight: 1.15,
    marginTop: 80,
  },
  coverDek: {
    fontSize: 13,
    color: "#2C2B27",
    marginTop: 16,
    lineHeight: 1.5,
  },
  coverMetaBlock: {
    marginTop: 60,
    paddingTop: 18,
    borderTopWidth: 0.6,
    borderTopColor: "#C9C4B8",
  },
  coverMetaLabel: {
    fontSize: 7.5,
    color: "#8B887F",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  coverMetaValue: {
    fontSize: 11,
    color: "#1F1E1B",
    fontFamily: "Helvetica-Bold",
    marginBottom: 12,
  },
  coverFooter: {
    fontSize: 8,
    color: "#8B887F",
    marginTop: 50,
    lineHeight: 1.5,
  },

  // Standard content styles
  h1: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#1F1E1B",
    letterSpacing: -0.5,
    marginBottom: 4,
    marginTop: 0,
  },
  h1Eyebrow: {
    fontSize: 8,
    color: "#4A6B5B",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  h2: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1F1E1B",
    marginTop: 18,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#2C2B27",
    marginTop: 12,
    marginBottom: 4,
  },
  p: {
    fontSize: 10,
    color: "#2C2B27",
    marginBottom: 6,
    lineHeight: 1.5,
  },
  pSmall: {
    fontSize: 9,
    color: "#5C5A52",
    marginBottom: 4,
    lineHeight: 1.4,
  },
  bullet: {
    fontSize: 10,
    color: "#2C2B27",
    marginBottom: 3,
    marginLeft: 14,
    lineHeight: 1.45,
  },
  bulletStrong: {
    fontFamily: "Helvetica-Bold",
  },
  callout: {
    backgroundColor: "#E5EDE8",
    borderLeftWidth: 3,
    borderLeftColor: "#4A6B5B",
    padding: 10,
    marginVertical: 8,
    borderRadius: 2,
  },
  calloutText: {
    fontSize: 10,
    color: "#1F1E1B",
    lineHeight: 1.5,
  },
  warningBlock: {
    backgroundColor: "#F0E9DC",
    padding: 10,
    marginVertical: 8,
    borderRadius: 2,
  },
  warningTitle: {
    fontSize: 8,
    color: "#8B6B3A",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },

  // Section header (running)
  sectionLabel: {
    fontSize: 7.5,
    color: "#8B887F",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },

  // Table
  table: {
    marginTop: 6,
    marginBottom: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#C9C4B8",
    borderBottomWidth: 0.5,
    borderBottomColor: "#C9C4B8",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F4F2EB",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontSize: 8,
    color: "#5C5A52",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 0.3,
    borderTopColor: "#E5E2D8",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableCell: {
    fontSize: 9,
    color: "#2C2B27",
    lineHeight: 1.35,
  },
  tableCellBold: {
    fontFamily: "Helvetica-Bold",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 56,
    right: 56,
    paddingTop: 6,
    borderTopWidth: 0.4,
    borderTopColor: "#C9C4B8",
    fontSize: 7.5,
    color: "#8B887F",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerBrand: {
    fontFamily: "Helvetica-Bold",
    color: "#1F1E1B",
  },
  pageNumber: {
    fontSize: 8,
    color: "#5C5A52",
    fontFamily: "Helvetica-Bold",
  },

  // TOC
  tocEntry: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 7,
  },
  tocNumber: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#4A6B5B",
    width: 24,
  },
  tocTitle: {
    fontSize: 10.5,
    color: "#1F1E1B",
    flex: 1,
  },
  tocDots: {
    flex: 1,
    borderBottomWidth: 0.4,
    borderBottomStyle: "dotted",
    borderBottomColor: "#C9C4B8",
    marginHorizontal: 4,
    marginBottom: 3,
  },

  // Source link
  sourceLink: {
    fontSize: 8.5,
    color: "#4A6B5B",
    marginBottom: 4,
    textDecoration: "none",
  },
});

interface SectionProps {
  number?: string;
  title: string;
  children: React.ReactNode;
}

function Section({ number, title, children }: SectionProps) {
  return (
    <View wrap>
      <Text style={styles.h1Eyebrow}>
        {number ? `Sección ${number}` : "Apartado"}
      </Text>
      <Text style={styles.h1}>{title}</Text>
      <View style={{ marginTop: 8 }}>{children}</View>
    </View>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return <Text style={styles.p}>{children}</Text>;
}

function Bullet({
  bold,
  children,
}: {
  bold?: string;
  children: React.ReactNode;
}) {
  return (
    <Text style={styles.bullet}>
      • {bold && <Text style={styles.bulletStrong}>{bold}</Text>}
      {children}
    </Text>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.callout}>
      <Text style={styles.calloutText}>{children}</Text>
    </View>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <Text style={styles.h2}>{children}</Text>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <Text style={styles.h3}>{children}</Text>;
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text>
        <Text style={styles.footerBrand}>LitienGuard AV</Text>
        {"  ·  "}Estudio de mercado México 2026
      </Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `${pageNumber} / ${totalPages}`
        }
      />
    </View>
  );
}

export function MarketStudyPdf() {
  return (
    <Document
      title="LitienGuard AV — Estudio de mercado México 2026"
      author="Carlos García Noriega"
      subject="Mexico Healthtech Market Study for Investor Presentation"
      creator="LitienGuard AV"
    >
      {/* ============ COVER ============ */}
      <Page size="A4" style={styles.coverPage}>
        <View>
          <Text style={styles.coverBrand}>LitienGuard</Text>
          <View style={styles.coverDot} />
          <Text style={styles.coverSubtitle}>Anticipatory Vision</Text>

          <Text style={styles.coverTitle}>
            Estudio de mercado{"\n"}México 2026
          </Text>
          <Text style={styles.coverDek}>
            Análisis del mercado de salud digital, panorama competitivo,
            mandato regulatorio y oportunidad direccionable para el Sistema
            Operativo Clínico de Latinoamérica.{"\n\n"}Documento preparado
            para presentación a inversores.
          </Text>
        </View>

        <View>
          <View style={styles.coverMetaBlock}>
            <Text style={styles.coverMetaLabel}>Documento</Text>
            <Text style={styles.coverMetaValue}>
              Estudio formal de mercado — v1.0
            </Text>

            <Text style={styles.coverMetaLabel}>Fundador</Text>
            <Text style={styles.coverMetaValue}>Carlos García Noriega</Text>

            <Text style={styles.coverMetaLabel}>Cobertura</Text>
            <Text style={styles.coverMetaValue}>
              México · LATAM · horizonte 2026-2031
            </Text>

            <Text style={styles.coverMetaLabel}>Fecha</Text>
            <Text style={styles.coverMetaValue}>12 de mayo de 2026</Text>
          </View>

          <Text style={styles.coverFooter}>
            Todas las cifras de este documento provienen de fuentes públicas
            verificables (INEGI, OCDE, ENSANUT, ENIGH, DOF, AMIS, CONDUSEF,
            Crunchbase, PitchBook, reportes de empresas públicas, papers
            indexados PubMed). Cuando un dato MX-específico no fue
            localizable se cita el dato proxy disponible.{"\n\n"}LitienGuard
            AV es un proyecto independiente. No es entidad de Grupo PRODI,
            DIMSA ni Corporativo Caribe.
          </Text>
        </View>
      </Page>

      {/* ============ TOC ============ */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1Eyebrow}>Tabla de contenidos</Text>
        <Text style={styles.h1}>Estructura del documento</Text>
        <View style={{ marginTop: 24 }}>
          {[
            ["01", "Resumen ejecutivo"],
            ["02", "El problema — un sistema de salud sobrepasado"],
            ["03", "Mandato regulatorio — Reforma LGS Salud Digital DOF 2026"],
            ["04", "Tamaño del mercado direccionable"],
            ["05", "Panorama competitivo"],
            ["06", "Producto — siete capas, seis fases"],
            ["07", "Modelo de negocio y unit economics"],
            ["08", "Casos clínicos con ROI demostrable"],
            ["09", "Tracción actual (mayo 2026)"],
            ["10", "Equipo y bottlenecks"],
            ["11", "The ask — qué solicitamos al inversor"],
            ["12", "Anexo — fuentes verificables"],
          ].map(([n, t]) => (
            <View key={n} style={styles.tocEntry}>
              <Text style={styles.tocNumber}>{n}</Text>
              <Text style={styles.tocTitle}>{t}</Text>
              <View style={styles.tocDots} />
            </View>
          ))}
        </View>
        <Footer />
      </Page>

      {/* ============ Sección 1 — Resumen ejecutivo ============ */}
      <Page size="A4" style={styles.page}>
        <Section number="01" title="Resumen ejecutivo">
          <Para>
            LitienGuard AV es el <Text style={styles.bulletStrong}>Sistema Operativo Clínico para México y Latinoamérica</Text>: una plataforma que integra siete capas (médico, hospital/laboratorio, paciente, pharma/autoridad, telesalud, gobernanza/ciberseguridad, revenue cycle management) sobre un cerebro de evidencia clínica curada en español mexicano con citas verbatim a guías oficiales (IMSS, CENETEC, KDIGO, ESC, AHA-ACC, Sepsis-3 y seis universidades elite).
          </Para>

          <H2>Por qué ahora</H2>

          <Bullet bold="Mandato regulatorio. ">
            El 15 de enero de 2026 entró en vigor la Reforma a la Ley General de Salud — Salud Digital, que formaliza telemedicina, telesalud, registros electrónicos y credencialización del paciente, modificando más de 100 artículos. La pregunta del comprador hospitalario cambió de &quot;¿por qué necesito esto?&quot; a &quot;¿con quién lo implemento?&quot;.
          </Bullet>
          <Bullet bold="Capital fluyendo. ">
            México captó USD 1.8 mil millones en venture capital en 2025, superando a Brasil por primera vez desde 2012 en el Q2 2025. Healthtech fue la segunda vertical más activa en LATAM.
          </Bullet>
          <Bullet bold="Mercado validado. ">
            Tempus AI creció de USD 321M en 2022 a USD 1.27B en 2025 (+83% YoY) y vale USD 12.8B. Abridge dobló su valuación a USD 5.3B en cuatro meses durante 2025.
          </Bullet>
          <Bullet bold="Vacío competitivo en México. ">
            Ningún jugador integra simultáneamente Clinical AI + Scribe + Revenue Cycle Management + Patient Navigation en español mexicano nativo.
          </Bullet>

          <H2>Tamaño del mercado direccionable</H2>

          <Bullet>
            Mercado salud total México 2025: USD 55.6 mil millones, proyectado a USD 71B en 2032 (CAGR 3.67%).
          </Bullet>
          <Bullet>
            Mercado de seguros de gastos médicos: USD 9.3B en 2025 → USD 16.6B en 2033 (CAGR 7.4%).
          </Bullet>
          <Bullet>
            Out-of-pocket México: 41% del gasto sanitario (uno de los más altos OCDE).
          </Bullet>
          <Bullet>
            666,000 médicos en México (Q2 2023, INEGI). Déficit de 70,000 especialistas vs. recomendación OCDE.
          </Bullet>
          <Bullet>
            98,000 médicos en hospitales privados, 84% especialistas. Penetración objetivo Fase 1.
          </Bullet>

          <Callout>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              Hito comercial Fase 1 (cierre 2027 H1):
            </Text>{" "}
            100 médicos pagantes a USD 30/mes ={" "}
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              USD 36,000 ARR
            </Text>{" "}
            con capital inicial menor a USD 100,000.
            {"\n\n"}
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              Visión Fase 2A (2027 H3 — 2028 H4):
            </Text>{" "}
            5 hospitales privados con RCM en producción + 1 aseguradora piloto ={" "}
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              USD 2-3M ARR
            </Text>
            . Capital requerido USD 500K-1.5M seed parcial.
          </Callout>
        </Section>
        <Footer />
      </Page>

      {/* ============ Sección 2 — El problema ============ */}
      <Page size="A4" style={styles.page}>
        <Section number="02" title="El problema — un sistema de salud sobrepasado">
          <H2>2.1 — Desfase entre oferta y demanda</H2>
          <Para>
            México tiene 2.5 médicos por cada 1,000 habitantes, por debajo de la recomendación OCDE de 3.2. El déficit de especialistas supera los 70,000 plazas. Solo 33% de los médicos en ejercicio son especialistas; los 67% restantes son médicos generales que enfrentan diagnósticos cada vez más complejos con tiempo limitado de consulta.
          </Para>

          <H2>2.2 — La carga administrativa del médico</H2>
          <Para>
            Aunque no localizamos estadísticas específicas de México, los datos internacionales son consistentes:
          </Para>
          <Bullet>
            Los médicos pasan 49% de su día clínico en el expediente electrónico y solo 27% con pacientes (AMA, USA).
          </Bullet>
          <Bullet>
            Por cada 15 minutos con un paciente, se requieren 9 minutos de captura en EHR.
          </Bullet>
          <Bullet>
            Por cada hora de contacto directo, se invierten 2 horas adicionales en entrada de datos.
          </Bullet>
          <Bullet>
            Los médicos con tiempo insuficiente para documentación tienen 2.8 veces más probabilidad de burnout.
          </Bullet>
          <Para>
            La entrevista pública 2026 con Dr. Gustavo Ross (FunSalud + Universidad Panamericana + Observatorio IA Salud MX) confirma que en México &quot;algunos médicos pasan 4 a 6 horas al día haciendo notas médicas&quot;, generando notas con acrónimos, contradicciones y a mano.
          </Para>

          <H2>2.3 — Retraso diagnóstico cuantificado</H2>
          <Para>
            El retraso diagnóstico en enfermedades complejas es masivo y medible. Ejemplo paradigmático — Amiloidosis cardíaca por transtiretina (ATTR-CM), primera causa subdiagnosticada de insuficiencia cardíaca con FEVI preservada en adultos mayores:
          </Para>
          <Bullet>
            Retraso diagnóstico promedio: 6.1 años para ATTR wild-type y 5.7 años para hereditaria.
          </Bullet>
          <Bullet>
            Mediana de 494 días desde el diagnóstico inicial de HF.
          </Bullet>
          <Bullet>
            42% de pacientes UK esperan más de 4 años desde el primer síntoma cardíaco.
          </Bullet>
          <Bullet>
            Misdiagnóstico ocurre en 34-57% de pacientes.
          </Bullet>
          <Para>
            Este patrón se repite en cardiomiopatía hipertrófica, Fabry, sarcoidosis cardíaca, endocarditis, sepsis temprana y muchas más.{" "}
            <Text style={styles.bulletStrong}>
              El cuello de botella no es falta de evidencia — es falta de un sistema que la entregue al médico en el momento de la decisión.
            </Text>
          </Para>
        </Section>
        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Section number="02 (continuación)" title="">
          <H2>2.4 — Gasto de bolsillo y fragmentación</H2>
          <Para>
            México tiene el gasto de bolsillo en salud más alto entre países OCDE (~41% del gasto sanitario total). Entre 2018 y 2024:
          </Para>
          <Bullet>Gasto de bolsillo +41% en términos reales.</Bullet>
          <Bullet>
            Gastos catastróficos en salud +64.5% (de 677,000 hogares a más de 1.11 millones).
          </Bullet>
          <Bullet>
            38% del gasto de bolsillo es en medicamentos; en hogares de menores ingresos, llega a 50%.
          </Bullet>
          <Para>
            77% de los mexicanos tiene afiliación a alguna institución pública de seguridad social, pero{" "}
            <Text style={styles.bulletStrong}>
              6 de cada 10 receptores de servicio público también acuden a clínicas o farmacias privadas
            </Text>
            , evidencia del subdesempeño del sistema público y la fragmentación que enfrenta el paciente cotidianamente. Solo 7% de la población tiene seguro privado de gastos médicos.
          </Para>

          <H2>2.5 — Prevalencia de enfermedades crónicas — el problema crece</H2>
          <Para>ENSANUT 2023 reporta:</Para>
          <Bullet>
            Diabetes tipo 2 en adultos: 18.4% (12.4% diagnosticada, 6.0% sin diagnosticar).
          </Bullet>
          <Bullet>Prediabetes: 22.1%.</Bullet>
          <Bullet>
            Solo 25.8% de pacientes diabéticos diagnosticados tiene control glucémico.
          </Bullet>
          <Bullet>
            27.7% de la población elegible recibió tamizaje en el último año (meta 33.3%).
          </Bullet>
          <Callout>
            Casi 1 de cada 5 adultos mexicanos tiene diabetes. Tres de cada cuatro diabéticos están descontrolados.{" "}
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              Cada consulta de control mal aprovechada es un evento adverso futuro evitable.
            </Text>
          </Callout>
        </Section>
        <Footer />
      </Page>

      {/* ============ Sección 3 — Reforma LGS ============ */}
      <Page size="A4" style={styles.page}>
        <Section
          number="03"
          title="Mandato regulatorio — Reforma LGS Salud Digital DOF 2026"
        >
          <Para>
            El 15 de enero de 2026 se publicó en el Diario Oficial de la Federación la reforma a la Ley General de Salud que formaliza el capítulo de Salud Digital. Entró en vigor el 16 de enero de 2026 modificando más de 100 artículos.
          </Para>

          <H2>3.1 — Componentes del nuevo Capítulo VI Bis &quot;Salud Digital&quot;</H2>
          <Para>La reforma:</Para>
          <Bullet>
            Define formalmente salud digital, telesalud, telemedicina y salud móvil.
          </Bullet>
          <Bullet>
            Mandata protocolos de ciberseguridad y protección de datos en salud.
          </Bullet>
          <Bullet>
            Establece marco regulatorio para registros clínicos electrónicos con requisitos de seguridad, confidencialidad y documentación.
          </Bullet>
          <Bullet>
            Promueve los sistemas nacionales SINBA (Sistema Nacional de Información Básica en Materia de Salud) y SINAIS (Sistema Nacional de Información en Salud).
          </Bullet>
          <Bullet>Reconoce wearables como instrumentos válidos de captura clínica.</Bullet>
          <Bullet>
            Mandata la credencialización del paciente y portabilidad del expediente.
          </Bullet>
          <Bullet>Define perspectiva de género en políticas de salud.</Bullet>

          <H2>3.2 — Implicación comercial para LitienGuard</H2>
          <Para>La reforma cambia la pregunta del comprador hospitalario:</Para>
          <Callout>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Antes:</Text>{" "}
            &quot;¿Por qué necesito digitalizarme?&quot;{"\n"}
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Después:</Text>{" "}
            &quot;¿Con quién implemento mi obligación legal?&quot;
          </Callout>
          <Para>
            Esto convierte cumplimiento regulatorio en una palanca de venta directa al director médico. LitienGuard se posiciona como &quot;compatible con la Credencial Nacional 2026 y reportero SINBA gratuito&quot; como caballo de Troya regulatorio.
          </Para>

          <H2>3.3 — Validación independiente</H2>
          <Para>
            El Dr. Gustavo Ross (FunSalud) confirma en entrevista pública 2026 las tres prioridades sectoriales para los próximos 12 meses: (1) paciente primero, (2) acceso efectivo, (3) adopción correcta de IA en salud. Las tres están en el corazón de LitienGuard.
          </Para>
        </Section>
        <Footer />
      </Page>

      {/* ============ Sección 4 — Tamaño de mercado ============ */}
      <Page size="A4" style={styles.page}>
        <Section number="04" title="Tamaño del mercado direccionable">
          <H2>4.1 — Top-down: TAM, SAM, SOM</H2>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2.4 }]}>Indicador</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.3 }]}>Valor 2025</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>Proyección</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Fuente</Text>
            </View>
            {[
              ["Mercado salud total MX (TAM)", "USD 55.6B", "USD 71B (2032, CAGR 3.67%)", "MarknTel"],
              ["Seguros gastos médicos privados (SAM-1)", "USD 9.3B", "USD 16.6B (2033, CAGR 7.4%)", "IMARC"],
              ["Healthcare IT MX (SAM-2)", "~USD 4.8B", "~USD 12.7B (2034, CAGR ~11%)", "Sector"],
              ["SOM Fase 2B 2029 (0.5%)", "—", "~USD 24M ARR", "Derivado"],
            ].map(([a, b, c, d], i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2.4 }, styles.tableCellBold]}>{a}</Text>
                <Text style={[styles.tableCell, { flex: 1.3 }]}>{b}</Text>
                <Text style={[styles.tableCell, { flex: 1.8 }]}>{c}</Text>
                <Text style={[styles.tableCell, { flex: 1.4 }]}>{d}</Text>
              </View>
            ))}
          </View>

          <H2>4.2 — Bottom-up: Fase 1 (médico individual)</H2>
          <Bullet>Universo: 666,000 médicos en México (Q2 2023). 98,000 en hospitales privados (84% especialistas).</Bullet>
          <Bullet>Mercado primario Fase 1: médicos privados con consultorio propio o adscripción a clínica privada — estimado 50,000-80,000.</Bullet>
          <Bullet>Pricing target: USD 30/mes = USD 360/año por médico.</Bullet>
          <Bullet>Captura conservadora: 0.5% del universo objetivo en 18 meses = 250-400 médicos pagantes.</Bullet>
          <Bullet>ARR proyectado cierre Fase 1: USD 90K — USD 145K.</Bullet>

          <H2>4.3 — Bottom-up: Fase 2A (RCM hospitalario)</H2>
          <Bullet>Universo: ~3,000 hospitales privados medianos (50-200 camas) en México.</Bullet>
          <Bullet>Targets nombrados Tier 1: Christus Muguerza, TecSalud, Hospitales MAC, Grupo Ángeles, Médica Sur.</Bullet>
          <Bullet>Pricing target Fase 2A: setup MXN 200K-800K + suscripción mensual MXN 80K-300K (~USD 4K-15K/mes).</Bullet>
          <Bullet>20 hospitales × MXN 150K/mes = MXN 36M ARR = ~USD 2M ARR (escenario base).</Bullet>

          <H2>4.4 — Mercado de aseguradoras (palanca Fase 2A — Capa G)</H2>
          <Para>
            El mercado de seguros de gastos médicos en México mueve USD 35.4 mil millones (2023) con crecimiento proyectado de 9.12% anual hasta 2030. Está concentrado:
          </Para>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Aseguradora</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Individual</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Colectivo</Text>
            </View>
            {[
              ["GNP", "29.7%", "23.9%"],
              ["AXA Seguros", "22.0%", "16.2%"],
              ["MetLife México", "—", "24.7% (líder)"],
              ["Seguros Monterrey NY Life", "11%", "—"],
            ].map(([a, b, c], i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }, styles.tableCellBold]}>{a}</Text>
                <Text style={[styles.tableCell, { flex: 1.2 }]}>{b}</Text>
                <Text style={[styles.tableCell, { flex: 1.2 }]}>{c}</Text>
              </View>
            ))}
          </View>
          <Para>
            9 compañías concentran 90% del mercado. Captar una sola aseguradora para validación de pólizas en tiempo real (módulo G.1) puede generar contratos anuales 6-7 cifras MXN.
          </Para>

          <H2>4.5 — Indicador de oportunidad: gasto administrativo</H2>
          <Callout>
            Benchmarks internacionales estiman que 20-30% del gasto sanitario total se va en procesos administrativos ineficientes. Aplicado al gasto sanitario MX de USD 55.6B, hay{" "}
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              USD 11-17B anuales atados a administración
            </Text>
            . Esta es la palanca de la Capa G (RCM).
          </Callout>
        </Section>
        <Footer />
      </Page>

      {/* ============ Sección 5 — Competidores ============ */}
      <Page size="A4" style={styles.page}>
        <Section number="05" title="Panorama competitivo">
          <H2>5.1 — Mapa por categoría (mayo 2026)</H2>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2.2 }]}>Competidor</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.7 }]}>Geo</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2.4 }]}>Funding / Valuación</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Amenaza</Text>
            </View>
            {[
              ["Glass Health (CDS+Scribe+DDx)", "USA", "USD 5.5M (Series A sep 2023)", "Alta"],
              ["Abridge (scribe)", "USA", "USD 5.3B val · Series E $300M + $316M ext", "Alta"],
              ["Konko AI / Kora (front office)", "MX/US", "USD 1.1M · ARR $550K+ 2025", "Vecino"],
              ["Tempus AI (precision medicine)", "USA", "USD 12.8B market cap Q2 2025", "Baja"],
              ["Isabel Healthcare (DDx)", "USA", "Privada, 25+ años", "Media"],
              ["DxGPT (Foundation29)", "ES", "ONG / gratis", "Media"],
              ["Sofía (telemed + seguro)", "MX", "Index Ventures backed", "Baja"],
              ["Clivi (diabetes virtual)", "MX", "Seed funded", "Baja"],
              ["Qualis (EMA EHR)", "MX", "Privada, no AI-first", "Baja"],
              ["PROSPERiA (AI healthcare MX)", "MX", "Privada", "Media"],
            ].map(([a, b, c, d], i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2.2 }, styles.tableCellBold]}>{a}</Text>
                <Text style={[styles.tableCell, { flex: 0.7 }]}>{b}</Text>
                <Text style={[styles.tableCell, { flex: 2.4 }]}>{c}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{d}</Text>
              </View>
            ))}
          </View>

          <H2>5.2 — Tres amenazas reales</H2>

          <H3>Glass Health (San Francisco, fundada 2021)</H3>
          <Para>
            El más cercano conceptualmente al bundle LitienGuard. Ambient scribe + diferencial ranked en 3 tiers + Q&A clínico con citas + integración Epic. USD 90-200/mes. Funding: USD 5.5M total.
          </Para>
          <View style={styles.warningBlock}>
            <Text style={styles.warningTitle}>Vacíos vs. LitienGuard</Text>
            <Text style={styles.calloutText}>
              Sin español MX nativo. Sin cerebro IMSS-CENETEC-KDIGO. Sin compatibilidad Reforma LGS 2026 / Credencial Paciente / NOM-024. Sin Revenue Cycle Management mexicano. Sin patient navigation por esquemas mexicanos.
            </Text>
          </View>

          <H3>Abridge (Pittsburgh, fundada 2018)</H3>
          <Para>
            Líder global de medical scribe. Soporta 28 idiomas con code-switching español-inglés. Series E USD 300M jun 2025 + extensión USD 316M abr 2026. Valuación USD 5.3B. ARR USD 100M may 2025. Kaiser (24,600 médicos), Mayo Clinic (2,000+), 250+ health systems. Pricing enterprise ~USD 2,500/clínico/año.
          </Para>
          <View style={styles.warningBlock}>
            <Text style={styles.warningTitle}>Vacíos vs. LitienGuard</Text>
            <Text style={styles.calloutText}>
              Scribe puro — sin diferencial, sin RCM, sin patient navigation. Cloud-only — no cumple promesa &quot;tu nota nunca sale de México&quot;. Pricing enterprise (~7× LitienGuard target). Sin cerebro clínico mexicano integrado.
            </Text>
          </View>
        </Section>
        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Section number="05 (continuación)" title="">
          <H3>Konko AI (Mexico City + NYC, fundada ~2024)</H3>
          <Para>
            Agente AI &quot;Kora&quot; para front office de clínicas. WhatsApp + web 24/7, intake, scheduling, transcripción, follow-ups. Equipo Harvard, UCLA, Tesla, C3 AI. USD 1.1M raised. ARR USD 0 → USD 550K+ en 2025. Caso Clínicas Vallejo: ROI 14×, +40% citas, 15 hrs/sem ahorradas.
          </Para>
          <Callout>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              No es rival directo — es vecino complementario.
            </Text>{" "}
            Konko juega front office (paciente → cita). LitienGuard juega back-of-house (consulta → nota → diferencial → outcome). Estrategia: alianza, no guerra.
          </Callout>

          <H2>5.3 — Por qué Tempus AI valida (sin competir directo)</H2>
          <Bullet>IPO junio 2024 a USD 6.1B (subió 15% en debut).</Bullet>
          <Bullet>Revenue: USD 321M (2022) → USD 532M (2023) → USD 700M (2024) → USD 1.27B (2025), +83% YoY.</Bullet>
          <Bullet>Market cap USD 12.8B en Q2 2025.</Bullet>
          <Para>
            Tempus prueba que el mercado paga valuaciones de 10+ cifras por plataformas que integran inteligencia clínica + datos reales + ofertas multi-stakeholder. LitienGuard es la versión mexicana adaptada: el bottleneck no es el secuenciador genómico, es el cerebro clínico + EHR + navegación + cobranza + cumplimiento regulatorio.
          </Para>

          <H2>5.4 — Moats reales de LitienGuard</H2>
          <Bullet bold="1. Cerebro clínico curado en español MX ">
            con citas verbatim a IMSS-CENETEC + 6 universidades elite. 2,758 chunks indexados. Tiempo de replicación: 18+ meses.
          </Bullet>
          <Bullet bold="2. Compatible Reforma LGS 2026 + Credencial Paciente ">
            desde día 1. Argumento de venta no replicable por jugadores USA.
          </Bullet>
          <Bullet bold="3. Stack 100% open source self-hosted ">
            (Whisper + Llama). Privacidad total como bandera. Abridge no puede igualar.
          </Bullet>
          <Bullet bold="4. Bundle integrado ">
            — scribe + cerebro + diferencial + asistencia + RCM en una sola suscripción.
          </Bullet>
          <Bullet bold="5. Revenue Cycle Management mexicano ">
            (Capa G, Fase 2A). Requiere relaciones aseguradoras MX + SAT/CFDI + CIE-10 local. Moat más profundo a 24 meses.
          </Bullet>
          <Bullet bold="6. Pricing MX-realista: ">
            USD 30/mes vs. USD 90 Glass / USD 208 Abridge.
          </Bullet>
        </Section>
        <Footer />
      </Page>

      {/* ============ Sección 6 — Producto ============ */}
      <Page size="A4" style={styles.page}>
        <Section number="06" title="Producto — siete capas, seis fases">
          <H2>6.1 — Capas (todas comparten un cerebro común)</H2>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 0.6 }]}>Capa</Text>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Función</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Comprador</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Fase</Text>
            </View>
            {[
              ["A", "Evidencia clínica, scribe, validación captura", "Médico individual / hospital", "1"],
              ["B", "EHR ligero, calidad, interop, SINBA, admin copilot", "Director médico", "2B"],
              ["C", "LitienGuard Asistencia — derechos, plan crónico, recursos, reembolsos, comparador IMSS/INSABI", "B2C + aseguradora", "1.5"],
              ["D", "RWD agregada, observatorio epidemiológico", "Pharma + autoridades", "3-4"],
              ["E", "Telesalud — cartera, protocolos, pagos, wearables", "Médicos + pacientes", "1.5"],
              ["F", "Gobernanza, identidad, ciberseguridad", "Compliance institucional", "Trans."],
              ["G", "RCM — pólizas, denegaciones, cobranza, fraude", "Hospital + aseguradora", "2A"],
            ].map(([a, b, c, d], i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.6 }, styles.tableCellBold]}>{a}</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>{b}</Text>
                <Text style={[styles.tableCell, { flex: 1.4 }]}>{c}</Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>{d}</Text>
              </View>
            ))}
          </View>

          <H2>6.2 — Fases: plazos, capital, indicadores</H2>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 0.6 }]}>Fase</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2.4 }]}>Producto</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Plazo</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Capital</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Cierre</Text>
            </View>
            {[
              ["1", "App médico + cerebro (activa)", "2026 H2 → 27 H1", "< USD 100K", "100 médicos pagantes"],
              ["1.5", "Asistencia + scribe + telesalud", "2027 H1 → H3", "USD 80-120K", "10K usuarios + 50 médicos"],
              ["2A", "RCM Copilot hospital + aseg.", "2027 H3 → 28 H4", "USD 500K-1.5M", "5 hosp + 1 aseg"],
              ["2B", "EHR sobre RCM instalado", "2028 H4 → 29 H4", "USD 1-3M", "10 hospitales SaaS"],
              ["3", "Labs + genómica gineco-onco", "2029 → 2031", "USD 8-15M", "3 deals pharma RWD"],
              ["4", "Lab propio + LATAM + pharma", "2031+", "USD 30M+", "4 países LATAM"],
            ].map(([a, b, c, d, e], i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.6 }, styles.tableCellBold]}>{a}</Text>
                <Text style={[styles.tableCell, { flex: 2.4 }]}>{b}</Text>
                <Text style={[styles.tableCell, { flex: 1.4 }]}>{c}</Text>
                <Text style={[styles.tableCell, { flex: 1.4 }]}>{d}</Text>
                <Text style={[styles.tableCell, { flex: 1.4 }]}>{e}</Text>
              </View>
            ))}
          </View>

          <H2>6.3 — Lógica de Fase 2A (RCM antes de EHR)</H2>
          <Para>
            El RCM tiene el ROI más rápido y medible para el hospital privado mediano: literatura internacional reporta 5-15% de ingresos recuperados y 20-30% de reducción en days sales outstanding (DSO). Una vez instalado el RCM, vender el EHR completo (Fase 2B) es upsell natural — el hospital ya confía en LitienGuard.
          </Para>
        </Section>
        <Footer />
      </Page>

      {/* ============ Sección 7 — Modelo de negocio ============ */}
      <Page size="A4" style={styles.page}>
        <Section number="07" title="Modelo de negocio y unit economics">
          <H2>7.1 — Capa A (Médico individual): Fase 1</H2>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Métrica</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Target</Text>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Notas</Text>
            </View>
            {[
              ["Precio", "USD 30/mes (MXN 540)", "vs. USD 90 Glass, USD 208 Abridge ent."],
              ["ARPU anual", "USD 360", ""],
              ["CAC objetivo", "< USD 60", "Boca a boca + LinkedIn"],
              ["Payback", "~2 meses", ""],
              ["LTV (30 meses retención)", "USD 900", ""],
              ["LTV/CAC", "~15×", ""],
              ["Costo marginal", "~USD 0", "Stack open source self-hosted"],
            ].map(([a, b, c], i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }, styles.tableCellBold]}>{a}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{b}</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>{c}</Text>
              </View>
            ))}
          </View>

          <H2>7.2 — Capa C (Asistencia): Fase 1.5</H2>
          <Bullet bold="Freemium: ">$0 — discovery, navegación básica.</Bullet>
          <Bullet bold="Premium B2C: ">MXN 99/mes (~USD 5) — reembolsos, comparador, plan crónico.</Bullet>
          <Bullet bold="Sponsorship B2B aseguradora: ">USD 50K-500K/año — captación + retención afiliados.</Bullet>

          <H2>7.3 — Capa G (RCM): Fase 2A</H2>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Cliente</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.3 }]}>Setup</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Mensual</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.3 }]}>ARR</Text>
            </View>
            {[
              ["Hospital privado mediano (50-200 camas)", "MXN 200-800K", "MXN 80-300K", "USD 50-180K"],
              ["Aseguradora privada / TPA", "MXN 500K-2M", "Variable", "6-7 cifras MXN"],
            ].map(([a, b, c, d], i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2.5 }, styles.tableCellBold]}>{a}</Text>
                <Text style={[styles.tableCell, { flex: 1.3 }]}>{b}</Text>
                <Text style={[styles.tableCell, { flex: 1.4 }]}>{c}</Text>
                <Text style={[styles.tableCell, { flex: 1.3 }]}>{d}</Text>
              </View>
            ))}
          </View>
          <Callout>
            Captura conservadora Fase 2A: 5 hospitales × promedio USD 90K ARR = USD 450K + 1 aseguradora piloto USD 500K ={" "}
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              USD 950K-1M ARR cierre Fase 2A
            </Text>
            .
          </Callout>

          <H2>7.4 — Captura objetivo Fase 2B (cierre 2029)</H2>
          <Para>
            0.5% del Healthcare IT MX (USD 4.8B base) ={" "}
            <Text style={styles.bulletStrong}>USD 24M ARR</Text>. Conservador asumiendo solo el segmento privado y antes de fase pharma (Capa D).
          </Para>
        </Section>
        <Footer />
      </Page>

      {/* ============ Sección 8 — Casos clínicos ============ */}
      <Page size="A4" style={styles.page}>
        <Section number="08" title="Casos clínicos con ROI demostrable">
          <H2>8.1 — Caso 1: Diabetes mal controlada (74.2% del universo)</H2>
          <Para>
            ENSANUT 2023: solo 25.8% de los diabéticos diagnosticados están en control glucémico. El 74.2% restante (más de 9 millones de personas) representa el caso paradigmático donde LitienGuard agrega valor en cada consulta:
          </Para>
          <Bullet>Capa A propone GDMT actualizada (metformina + GLP-1 + SGLT2i según KDIGO 2024).</Bullet>
          <Bullet>Capa C educa al paciente y monitorea adherencia.</Bullet>
          <Bullet>Capa G valida cobertura de medicamentos por aseguradora antes de prescribir.</Bullet>

          <H2>8.2 — Caso 2: ATTR-CM (retraso 6.1 años promedio)</H2>
          <Para>
            Paciente típico: hombre, 70-80 años, HFpEF + síndrome del túnel del carpo bilateral + bajo voltaje ECG con LVH eco.
          </Para>
          <Bullet bold="Sin LitienGuard: ">6.1 años a diagnóstico.</Bullet>
          <Bullet bold="Con LitienGuard:">
            Cerebro alerta sobre la combinación; diferencial bayesiano coloca ATTR-CM como top-1 con citas verbatim a 2025 ACC Concise Clinical Guidance; recomendación inmediata de PYP scan grado 2-3. Diagnóstico en consulta única.
          </Bullet>
          <Callout>
            Tratamiento temprano con tafamidis (Maurer NEJM 2018, ATTR-ACT): hazard ratio 0.70 para mortalidad, NNT 7.5 a 30 meses.{" "}
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              Cada caso detectado temprano vale la diferencia entre cuidados paliativos y 5+ años de calidad de vida.
            </Text>
          </Callout>

          <H2>8.3 — Caso 3: Cobranza hospitalaria (Capa G)</H2>
          <Para>
            Benchmark internacional Waystar/Infinx: -40% horas administrativas tras implementación RCM. Hospital privado típico de 100 camas con DSO actual 75 días → reducción a 50 días libera ~MXN 8M de capital de trabajo.{" "}
            <Text style={styles.bulletStrong}>
              Esa cifra justifica suscripción anual de MXN 1-2M con creces.
            </Text>
          </Para>
        </Section>
        <Footer />
      </Page>

      {/* ============ Sección 9 — Tracción ============ */}
      <Page size="A4" style={styles.page}>
        <Section number="09" title="Tracción actual (mayo 2026)">
          <H2>9.1 — Producto construido</H2>
          <Bullet bold="Cerebro v0.5: ">
            2,758 chunks indexados con BM25 de 49 documentos en 4 sectores (diabetes 1,016 / cardio 318 / neuro 433 / gineco-onco 317).
          </Bullet>
          <Bullet bold="App Médica v0.5: ">
            cuatro tabs (consulta nueva, mis consultas, mi calidad, configuración) con sistema visual &quot;Clinical Calm&quot; propio.
          </Bullet>
          <Bullet bold="Scribe v0.1 self-hosted: ">
            Whisper + Llama 8B local, latencia E2E 13.5 segundos para audio de 8 segundos. Costo marginal USD 0.
          </Bullet>
          <Bullet bold="Asistencia v0.3: ">
            7 sub-tabs (wizard, triaje, coverage, comparador, recursos, derechos, trámites) con 8 esquemas de aseguramiento y 40 unidades médicas seed.
          </Bullet>
          <Bullet bold="Web v0.1: ">
            Next.js 15 + Supabase + Resend, 100% TypeScript strict, deploy en Vercel.
          </Bullet>

          <H2>9.2 — Diferencial diagnóstico bayesiano (motor v3)</H2>
          <Bullet>28 enfermedades en 4 dominios (cardio, endocrino, neuro, infecto).</Bullet>
          <Bullet>51 findings clínicos categorizados (ECG, eco, lab, historia, examen, genética).</Bullet>
          <Bullet>~180 likelihood ratios todos con cita verbatim a guidelines oficiales.</Bullet>
          <Bullet>Auto-extracción de findings desde texto libre usando Vercel AI Gateway + Claude Sonnet 4.6.</Bullet>
          <Bullet>Integración cerrada: consulta → scribe → diferencial → outcome trackeado.</Bullet>

          <H2>9.3 — Costo acumulado a la fecha</H2>
          <Callout>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              USD $0.00 en infraestructura LLM comercial.
            </Text>{" "}
            Todo el desarrollo se ha realizado con stack open source self-hosted + Vercel free tier + Supabase free tier.
          </Callout>
        </Section>
        <Footer />
      </Page>

      {/* ============ Sección 10 — Equipo y bottlenecks ============ */}
      <Page size="A4" style={styles.page}>
        <Section number="10" title="Equipo y bottlenecks">
          <H2>10.1 — Equipo actual</H2>
          <Bullet bold="Founder/CEO: ">
            Carlos García Noriega — fundador en operaciones plenas, perfil comercial B2B (DIMSA, Grupo PRODI, Corporativo Caribe).
          </Bullet>
          <Bullet bold="Validador clínico externo: ">
            Dr. Gustavo Ross (FunSalud + UP + Observatorio IA Salud MX) — confirmación pública 2026.
          </Bullet>

          <H2>10.2 — Bottlenecks reconocidos</H2>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 0.4 }]}>#</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2.4 }]}>Bottleneck</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2.4 }]}>Mitigación</Text>
            </View>
            {[
              ["1", "CTO técnico (mediano plazo)", "Reclutar post-pre-seed"],
              ["2", "Piloto con 5 médicos amigos", "Plan H2 2026"],
              ["3", "Estructura legal formal", "S.A.P.I. antes del primer cliente pagante"],
              ["4", "Validación contra MIMIC-IV", "CITI training + aplicación PhysioNet"],
            ].map(([a, b, c], i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.4 }, styles.tableCellBold]}>{a}</Text>
                <Text style={[styles.tableCell, { flex: 2.4 }]}>{b}</Text>
                <Text style={[styles.tableCell, { flex: 2.4 }]}>{c}</Text>
              </View>
            ))}
          </View>

          <H2>10.3 — Riesgos vigilados</H2>
          <Bullet bold="1. Hallucination clínica: ">
            Cero generación natural-language en respuestas; solo chunks verbatim con cita.
          </Bullet>
          <Bullet bold="2. LFPDPPP datos pacientes Capa C: ">
            Aviso + consentimiento + cifrado AES-256 + sin PII en cerebro.
          </Bullet>
          <Bullet bold="3. NOM-024-SSA3 (EHR Fase 2B): ">
            Diseñar cumpliendo NOM desde día 1.
          </Bullet>
          <Bullet bold="4. Adopción médica baja por aversión al teclado: ">
            Capa A sin reemplazar workflow; scribe ambient en Fase 1.5.
          </Bullet>
          <Bullet bold="5. Competidor USA entra a MX antes de tener tracción: ">
            Aceleración Fase 2A (RCM) como moat irreplicable.
          </Bullet>
          <Bullet bold="6. Glass Health localiza a español: ">
            Captura de 500 médicos pagantes en MX antes de su entrada.
          </Bullet>
        </Section>
        <Footer />
      </Page>

      {/* ============ Sección 11 — The Ask ============ */}
      <Page size="A4" style={styles.page}>
        <Section number="11" title="The ask — qué solicitamos al inversor">
          <H2>11.1 — Ronda pre-seed propuesta</H2>
          <Callout>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Monto: </Text>
            USD 250,000 — USD 500,000{"\n"}
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Instrumento: </Text>
            SAFE post-money cap propuesto USD 5M
          </Callout>

          <H3>Uso de fondos (12 meses)</H3>
          <Bullet bold="35% ">— primer hire técnico (CTO o senior engineer)</Bullet>
          <Bullet bold="25% ">— adquisición controlada de médicos pagantes (LinkedIn ads + congresos)</Bullet>
          <Bullet bold="20% ">— legal (S.A.P.I., aviso privacidad, IP en IMPI, NOM-024 compliance)</Bullet>
          <Bullet bold="15% ">— desarrollo Fase 1.5 (Asistencia productiva + scribe avanzado)</Bullet>
          <Bullet bold="5% ">— buffer operativo</Bullet>

          <H3>Hitos comprometidos</H3>
          <Bullet bold="Mes 6: ">25 médicos pagantes confirmados, churn &lt; 10%.</Bullet>
          <Bullet bold="Mes 12: ">
            100 médicos pagantes (Fase 1 cerrada), beta Fase 1.5 lanzada, primer LOI con hospital privado para Fase 2A.
          </Bullet>

          <H2>11.2 — Por qué este es el momento de entrar</H2>
          <Bullet>Producto construido a USD 0 — capital eficiente comprobado.</Bullet>
          <Bullet>Cerebro propietario que tarda 18+ meses en replicarse — moat técnico real.</Bullet>
          <Bullet>Mandato regulatorio alineado — viento de cola institucional.</Bullet>
          <Bullet>Capital LATAM fluyendo — MX #2 LATAM con USD 1.8B en 2025.</Bullet>
          <Bullet>Modelo Tempus AI validado — USD 12.8B market cap demuestra ceiling.</Bullet>
          <Bullet>Founder con perfil comercial B2B comprobado + red de médicos privados.</Bullet>

          <H2>11.3 — Por qué Carlos puede ejecutar</H2>
          <Bullet>10+ años en ventas B2B (DIMSA, Grupo PRODI, Corporativo Caribe).</Bullet>
          <Bullet>
            Red profesional en sector privado MX con acceso directo a los 5 grupos hospitalarios target (Christus Muguerza, TecSalud, MAC, Ángeles, Médica Sur).
          </Bullet>
          <Bullet>
            Validación externa doble: Dr. Gustavo Ross (FunSalud) + análisis estratégico independiente (score 9.8/10).
          </Bullet>
          <Bullet>
            Producto construido sin capital y sin equipo técnico previo — demuestra ejecución frugal.
          </Bullet>
        </Section>
        <Footer />
      </Page>

      {/* ============ Sección 12 — Fuentes ============ */}
      <Page size="A4" style={styles.page}>
        <Section number="12" title="Anexo — fuentes verificables">
          <H2>Macro mercado salud México</H2>
          {[
            ["MarknTel Advisors — Mexico Healthcare Market Forecast 2026-2032", "https://www.marknteladvisors.com/research-library/mexico-healthcare-market-report.html"],
            ["IMARC Group — Mexico Health Insurance Market 2033", "https://www.imarcgroup.com/mexico-health-insurance-market"],
            ["OECD — Health at a Glance 2025: Mexico", "https://www.oecd.org/en/publications/2025/11/health-at-a-glance-2025-country-notes_2f94481e/mexico_0c55bf71.html"],
            ["World Bank — Current Health Expenditure (% GDP) Mexico", "https://data.worldbank.org/indicator/SH.XPD.CHEX.GD.ZS?locations=MX"],
          ].map(([t, u], i) => (
            <Link key={i} src={u} style={styles.sourceLink}>
              {t}
            </Link>
          ))}

          <H2>Médicos y hospitales privados México</H2>
          {[
            ["INEGI ESEP 2024 — Estadísticas Salud Establecimientos Particulares", "https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2025/salud/ESEP2024_RR.pdf"],
            ["INEGI ESEP 2023", "https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2024/ESEP/ESEP2023.pdf"],
            ["Saludiario — Día del Médico 2025: 10 estadísticas", "https://www.saludiario.com/dia-del-medico-2025-10-estadisticas-para-comprender-la-importancia-de-este-gremio/"],
            ["Gaceta UNAM — Distribución del personal de salud", "https://www.gaceta.unam.mx/la-distribucion-del-personal-de-salud-un-desafio-en-mexico/"],
          ].map(([t, u], i) => (
            <Link key={i} src={u} style={styles.sourceLink}>
              {t}
            </Link>
          ))}

          <H2>Reforma LGS Salud Digital 2026</H2>
          {[
            ["DOF — 15 enero 2026 publicación oficial", "https://dof.gob.mx/2026/PRESREP/PRESREP_150126_02.pdf"],
            ["Pérez-Llorca — Nota Jurídica Reforma LGS 2026", "https://www.perezllorca.com/wp-content/uploads/2026/01/Nota-Juridica-Reforma-a-la-Ley-General-de-Salud-Decreto-publicado-el-15-de-enero-de-2026-.pdf"],
            ["ConsultorSalud MX — Reforma a la LGS: México formaliza Salud Digital", "https://consultorsalud.com.mx/reforma-ley-general-de-salud-mexico/"],
          ].map(([t, u], i) => (
            <Link key={i} src={u} style={styles.sourceLink}>
              {t}
            </Link>
          ))}

          <H2>Aseguradoras, gasto bolsillo, ENSANUT</H2>
          {[
            ["CONDUSEF — Calidad aseguradoras gastos médicos", "https://www.condusef.gob.mx/?p=contenido&idc=1243&idcat=1"],
            ["COFECE — Estudio competencia seguros gastos médicos", "https://www.cofece.mx/wp-content/uploads/2022/12/Estudio-Seguro-de-Gastos-Medicos.pdf"],
            ["CIEP — Gasto de bolsillo ENIGH 2024", "https://ciep.mx/gasto-de-bolsillo-en-salud-resultados-de-la-enigh-2024/"],
            ["México Evalúa — Gastos catastróficos +64.5% 2018-2024", "https://mexicoevalua.org/gastos-catastroficos-en-salud-se-disparan-64-5-en-2024-frente-a-2018-mexico-evalua/"],
            ["INSP — Prevalencia diabetes ENSANUT 2022", "https://www.insp.mx/avisos/prevalencia-de-prediabetes-y-diabetes-en-mexico-ensanut-2022"],
            ["Salud Pública de México — ENSANUT 2023 control glucémico", "https://saludpublica.mx/index.php/spm/article/view/17286"],
          ].map(([t, u], i) => (
            <Link key={i} src={u} style={styles.sourceLink}>
              {t}
            </Link>
          ))}

          <H2>Retraso diagnóstico, burnout, VC LATAM</H2>
          {[
            ["PMC 8126532 — Delayed Diagnosis ATTR-CM", "https://pmc.ncbi.nlm.nih.gov/articles/PMC8126532/"],
            ["Medscape — Long Delays in Cardiac Amyloidosis 2026", "https://www.medscape.com/viewarticle/long-delays-cardiac-amyloidosis-diagnosis-persist-2026a1000f1x"],
            ["Tebra — EHR documentation top cause physician burnout", "https://www.tebra.com/theintake/ehr-emr/how-documentation-became-top-cause-of-physician-burnout"],
            ["Crunchbase News — LatAm Funding Rebounds 2025", "https://news.crunchbase.com/venture/vcs-bullish-latam-startup-funding-rebounds-2025/"],
            ["Mexico Business News — MX #2 LATAM VC 2025", "https://mexicobusiness.news/finance/news/mexico-ranked-second-latin-american-venture-capital-2025"],
          ].map(([t, u], i) => (
            <Link key={i} src={u} style={styles.sourceLink}>
              {t}
            </Link>
          ))}

          <H2>Competidores</H2>
          {[
            ["Glass Health — Crunchbase", "https://www.crunchbase.com/organization/glass-health"],
            ["Abridge — FierceHealthcare Series E", "https://www.fiercehealthcare.com/ai-and-machine-learning/ambient-ai-startup-abridge-scores-300m-series-e-backed-a16z-and-khosla"],
            ["Abridge — TechCrunch USD 5.3B valuation", "https://techcrunch.com/2025/06/24/in-just-4-months-ai-medical-scribe-abridge-doubles-valuation-to-5-3b/"],
            ["Konko AI — Crunchbase", "https://www.crunchbase.com/organization/konko-ai"],
            ["Tempus AI — Q2 2025 Results", "https://www.tempus.com/news/tempus-reports-second-quarter-2025-results/"],
            ["Tempus AI — FierceHealthcare IPO Coverage", "https://www.fiercehealthcare.com/health-tech/tempus-ai-shares-jump-15-stock-market-debut-ipo-priced-over-6b-valuation"],
            ["Sofía — TechCrunch Index Ventures", "https://techcrunch.com/2020/11/20/index-ventures-into-latin-america-to-back-sofia-a-mexico-city-based-telemedicine-and-health-insurer/"],
            ["Clivi — TechCrunch (Livongo of LATAM)", "https://techcrunch.com/2023/06/20/diabetes-management-clivi-livongo-latin-america-healthcare/"],
          ].map(([t, u], i) => (
            <Link key={i} src={u} style={styles.sourceLink}>
              {t}
            </Link>
          ))}

          <View style={{ marginTop: 30, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: "#C9C4B8" }}>
            <Text style={styles.pSmall}>
              Documento vivo. Próxima revisión: tras cierre de pre-seed o a los 6 meses, lo que ocurra primero.
            </Text>
            <Text style={[styles.pSmall, { marginTop: 4 }]}>
              LitienGuard AV es un proyecto independiente fundado por Carlos García Noriega. No es entidad de Grupo PRODI, DIMSA ni Corporativo Caribe.
            </Text>
          </View>
        </Section>
        <Footer />
      </Page>
    </Document>
  );
}

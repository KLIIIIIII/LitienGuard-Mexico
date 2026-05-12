import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    /*
     * paddingTop suficiente para dejar espacio al header fixed que se
     * repite en cada página. Sin esto, en página 2+ el contenido se
     * dibuja encima del header (overlap). 56 (margen base) + 56 (alto
     * del header con padding y border) ≈ 112.
     */
    paddingTop: 112,
    paddingBottom: 80,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1F1E1B",
    backgroundColor: "#FBFAF6",
    lineHeight: 1.55,
  },
  header: {
    /*
     * Header fixed — se posiciona absolutamente en cada página.
     * El paddingTop del page deja espacio para que no se solape con
     * el contenido normal.
     */
    position: "absolute",
    top: 56,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 10,
    borderBottomWidth: 0.6,
    borderBottomColor: "#C9C4B8",
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  brand: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1F1E1B",
    letterSpacing: -0.4,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
    backgroundColor: "#4A6B5B",
  },
  brandSubtitle: {
    fontSize: 8,
    color: "#8B887F",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 4,
  },
  headerMeta: { alignItems: "flex-end" },
  metaLabel: {
    fontSize: 7,
    color: "#8B887F",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    color: "#2C2B27",
    fontFamily: "Helvetica-Bold",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  statusFirmada: { backgroundColor: "#E5EDE8", color: "#4A6B5B" },
  statusBorrador: { backgroundColor: "#F0E9DC", color: "#8B6B3A" },
  statusDescartada: { backgroundColor: "#F0E1E2", color: "#8E4A52" },
  patientBlock: {
    backgroundColor: "#F4F2EB",
    padding: 14,
    borderRadius: 4,
    marginBottom: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
  },
  patientField: { minWidth: 120 },
  patientLabel: {
    fontSize: 7,
    color: "#8B887F",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  patientValue: {
    fontSize: 11,
    color: "#1F1E1B",
    fontFamily: "Helvetica-Bold",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1F1E1B",
    marginBottom: 20,
  },
  soapSection: { marginBottom: 18 },
  soapHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 6,
  },
  soapLetter: {
    fontSize: 22,
    fontFamily: "Times-BoldItalic",
    color: "#4A6B5B",
    marginRight: 8,
    width: 22,
  },
  soapLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#1F1E1B",
  },
  soapHint: {
    fontSize: 8,
    color: "#8B887F",
    marginLeft: 6,
    marginBottom: 2,
  },
  soapBody: {
    fontSize: 10,
    lineHeight: 1.6,
    color: "#2C2B27",
    paddingLeft: 30,
    paddingRight: 6,
  },
  soapSpacer: {
    marginBottom: 14,
  },
  soapEmpty: {
    fontSize: 9,
    fontStyle: "italic",
    color: "#B5B2A8",
    paddingLeft: 30,
  },
  divider: {
    borderBottomWidth: 0.4,
    borderBottomColor: "#EFECE3",
    marginVertical: 6,
    marginLeft: 30,
  },
  signature: {
    marginTop: 28,
    paddingTop: 16,
    borderTopWidth: 0.6,
    borderTopColor: "#C9C4B8",
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  signatureLabel: {
    fontSize: 7,
    color: "#8B887F",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  signatureName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1F1E1B",
    marginTop: 4,
  },
  signatureMeta: { fontSize: 8, color: "#57554F", marginTop: 2 },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 56,
    right: 56,
    paddingTop: 8,
    borderTopWidth: 0.4,
    borderTopColor: "#EFECE3",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 7,
    color: "#8B887F",
  },
  pageNumber: { fontSize: 7, color: "#8B887F" },
});

export type SoapPdfData = {
  id: string;
  paciente_iniciales: string | null;
  paciente_nombre: string | null;
  paciente_apellido_paterno: string | null;
  paciente_apellido_materno: string | null;
  paciente_edad: number | null;
  paciente_sexo: string | null;
  soap_subjetivo: string;
  soap_objetivo: string;
  soap_analisis: string;
  soap_plan: string;
  status: "borrador" | "firmada" | "descartada";
  created_at: string;
  updated_at: string;
  medico_nombre: string;
  medico_email: string;
  medico_hospital: string | null;
  medico_especialidad: string | null;
};

function patientFullName(d: SoapPdfData): string {
  const parts = [
    d.paciente_nombre,
    d.paciente_apellido_paterno,
    d.paciente_apellido_materno,
  ].filter((p): p is string => Boolean(p && p.trim()));
  if (parts.length > 0) return parts.join(" ");
  if (d.paciente_iniciales) return d.paciente_iniciales;
  return "—";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sexoLabel(s: string | null): string {
  if (s === "F") return "Femenino";
  if (s === "M") return "Masculino";
  if (s === "O") return "Otro";
  return "—";
}

const SECTIONS = [
  { letter: "S", label: "Subjetivo", key: "soap_subjetivo", hint: "Padecimiento actual y antecedentes" },
  { letter: "O", label: "Objetivo", key: "soap_objetivo", hint: "Exploración física y estudios" },
  { letter: "A", label: "Análisis", key: "soap_analisis", hint: "Impresión diagnóstica" },
  { letter: "P", label: "Plan", key: "soap_plan", hint: "Tratamiento y seguimiento" },
] as const;

const STATUS_LABEL = {
  borrador: "Borrador",
  firmada: "Firmada",
  descartada: "Descartada",
} as const;

export function SoapPdf({ nota }: { nota: SoapPdfData }) {
  const statusStyle =
    nota.status === "firmada"
      ? styles.statusFirmada
      : nota.status === "descartada"
        ? styles.statusDescartada
        : styles.statusBorrador;

  return (
    <Document
      title={`Nota SOAP ${nota.paciente_iniciales ?? ""} ${nota.id.slice(0, 8)}`.trim()}
      author="LitienGuard"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.brand}>LitienGuard</Text>
              <View style={styles.brandDot} />
            </View>
            <Text style={styles.brandSubtitle}>
              Inteligencia médica para México
            </Text>
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.metaLabel}>Nota SOAP</Text>
            <Text style={styles.metaValue}>#{nota.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={[styles.statusBadge, statusStyle]}>
              {STATUS_LABEL[nota.status]}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Consulta médica</Text>

        <View style={styles.patientBlock}>
          <View
            style={[
              styles.patientField,
              { minWidth: 220, flexGrow: 1 } as never,
            ]}
          >
            <Text style={styles.patientLabel}>Paciente</Text>
            <Text style={styles.patientValue}>{patientFullName(nota)}</Text>
          </View>
          <View style={styles.patientField}>
            <Text style={styles.patientLabel}>Edad</Text>
            <Text style={styles.patientValue}>
              {nota.paciente_edad != null
                ? `${nota.paciente_edad} años`
                : "—"}
            </Text>
          </View>
          <View style={styles.patientField}>
            <Text style={styles.patientLabel}>Sexo</Text>
            <Text style={styles.patientValue}>
              {sexoLabel(nota.paciente_sexo)}
            </Text>
          </View>
          <View style={styles.patientField}>
            <Text style={styles.patientLabel}>Fecha de consulta</Text>
            <Text style={styles.patientValue}>
              {formatDate(nota.created_at)}
            </Text>
          </View>
        </View>

        {SECTIONS.map((s) => {
          const body = String(
            (nota as unknown as Record<string, string>)[s.key] ?? "",
          ).trim();
          return (
            <View key={s.key} style={styles.soapSection} wrap={false}>
              <View style={styles.soapHeader}>
                <Text style={styles.soapLetter}>{s.letter}</Text>
                <Text style={styles.soapLabel}>{s.label}</Text>
                <Text style={styles.soapHint}>· {s.hint}</Text>
              </View>
              {body ? (
                <Text style={styles.soapBody}>{body}</Text>
              ) : (
                <Text style={styles.soapEmpty}>
                  (sin información registrada)
                </Text>
              )}
              <View style={styles.divider} />
            </View>
          );
        })}

        <View style={styles.signature} wrap={false}>
          <View style={styles.signatureRow}>
            <View>
              <Text style={styles.signatureLabel}>Médico responsable</Text>
              <Text style={styles.signatureName}>{nota.medico_nombre}</Text>
              <Text style={styles.signatureMeta}>
                {nota.medico_email}
                {nota.medico_especialidad
                  ? ` · ${nota.medico_especialidad}`
                  : ""}
                {nota.medico_hospital
                  ? ` · ${nota.medico_hospital}`
                  : ""}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.signatureLabel}>
                {nota.status === "firmada" ? "Firmada" : "Actualizada"}
              </Text>
              <Text style={styles.signatureMeta}>
                {formatDate(nota.updated_at)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>
            Generado con asistencia de IA y revisado por el médico. No
            sustituye juicio clínico profesional.
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { OdontogramState, ToothState } from "@/components/odontogram";

const STATE_LABELS: Record<ToothState, string> = {
  sano: "Sano",
  caries: "Caries",
  restaurado: "Restaurado",
  endodoncia: "Endodoncia",
  corona: "Corona",
  implante: "Implante",
  ausente: "Ausente",
};

const STATE_COLORS: Record<ToothState, { fill: string; border: string; text: string }> = {
  sano: { fill: "#FFFFFF", border: "#D8D4C8", text: "#1F1E1B" },
  caries: { fill: "#F6E2B8", border: "#C68B2A", text: "#5C3A0E" },
  restaurado: { fill: "#D6E8DC", border: "#4A6B5B", text: "#274B39" },
  endodoncia: { fill: "#D0DEED", border: "#3F6B95", text: "#1F3F5E" },
  corona: { fill: "#2C2B27", border: "#2C2B27", text: "#FFFFFF" },
  implante: { fill: "#8E8B7E", border: "#5C5A52", text: "#FFFFFF" },
  ausente: { fill: "#F4F2EB", border: "#B8B4A8", text: "#8B887F" },
};

const UPPER_ROW = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_ROW = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const INK = "#1F1E1B";
const INK_MUTED = "#57554F";
const INK_SOFT = "#8B887F";
const RULE = "#D8D4C8";
const RULE_STRONG = "#2C2B27";
const SURFACE_ALT = "#F4F2EB";
const ACCENT = "#274B39";
const ACCENT_SOFT = "#E5EDE8";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 80,
    paddingHorizontal: 44,
    fontSize: 10,
    color: INK,
    fontFamily: "Helvetica",
    lineHeight: 1.55,
  },

  // Header
  header: {
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: RULE_STRONG,
  },
  brandEyebrow: {
    fontSize: 7,
    color: ACCENT,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: INK,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 9.5,
    color: INK_MUTED,
    marginTop: 2,
  },

  // Meta box
  metaBox: {
    marginTop: 14,
    backgroundColor: SURFACE_ALT,
    borderRadius: 4,
    padding: 12,
  },
  metaGrid: { flexDirection: "row", flexWrap: "wrap" },
  metaCell: { marginRight: 32, marginBottom: 4 },
  metaLabel: {
    fontSize: 7,
    color: INK_SOFT,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: INK,
  },

  // Section
  section: { marginTop: 18 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: ACCENT_SOFT,
  },

  // Arch
  archBlock: { marginBottom: 12 },
  archLabel: {
    fontSize: 7,
    color: INK_SOFT,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 5,
    textAlign: "center",
  },
  archRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  tooth: {
    width: 26,
    height: 34,
    marginHorizontal: 1.5,
    borderWidth: 1,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  toothLeftGap: { marginLeft: 10 },
  toothNum: { fontSize: 7, fontFamily: "Helvetica-Bold" },
  toothStateLabel: { fontSize: 5, marginTop: 1 },

  midline: {
    alignSelf: "center",
    width: 60,
    height: 1,
    backgroundColor: RULE,
    marginVertical: 8,
  },

  // Legend
  legendBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: SURFACE_ALT,
    borderRadius: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    marginVertical: 2,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderWidth: 1,
    marginRight: 5,
    borderRadius: 2,
  },
  legendLabel: { fontSize: 8.5, color: INK_MUTED },

  // Notes
  notesBody: {
    fontSize: 10,
    color: INK,
    lineHeight: 1.5,
  },

  // Signatures
  signatureWrap: {
    marginTop: 38,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: { width: "45%" },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: INK,
    marginBottom: 6,
    height: 32,
  },
  signatureLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: INK,
    textAlign: "center",
  },
  signatureSub: {
    fontSize: 8.5,
    color: INK_MUTED,
    textAlign: "center",
    marginTop: 1,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: RULE,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: INK_SOFT, letterSpacing: 0.3 },
});

interface OdontogramPdfProps {
  paciente: string;
  fecha: string;
  medico: string;
  notas: string;
  state: OdontogramState;
}

function ToothCell({
  n,
  state,
  isGap,
}: {
  n: number;
  state: ToothState;
  isGap: boolean;
}) {
  const colors = STATE_COLORS[state];
  return (
    <View
      style={[
        styles.tooth,
        isGap ? styles.toothLeftGap : {},
        {
          backgroundColor: colors.fill,
          borderColor: colors.border,
          borderStyle: state === "ausente" ? "dashed" : "solid",
        },
      ]}
    >
      <Text style={[styles.toothNum, { color: colors.text }]}>{n}</Text>
      {state !== "sano" && (
        <Text style={[styles.toothStateLabel, { color: colors.text }]}>
          {STATE_LABELS[state].slice(0, 4)}
        </Text>
      )}
    </View>
  );
}

export function OdontogramPdf({
  paciente,
  fecha,
  medico,
  notas,
  state,
}: OdontogramPdfProps) {
  const fmtDate = (() => {
    try {
      return new Date(fecha).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return fecha;
    }
  })();

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandEyebrow}>LitienGuard · Dental</Text>
          <Text style={styles.brandTitle}>Odontograma</Text>
          <Text style={styles.brandSubtitle}>
            Estado clínico de las piezas dentales · Notación FDI
          </Text>
        </View>

        {/* Meta box */}
        <View style={styles.metaBox}>
          <View style={styles.metaGrid}>
            <View style={[styles.metaCell, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.metaLabel}>Paciente</Text>
              <Text style={styles.metaValue}>{paciente || "—"}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Fecha</Text>
              <Text style={styles.metaValue}>{fmtDate}</Text>
            </View>
            <View style={[styles.metaCell, { marginRight: 0 }]}>
              <Text style={styles.metaLabel}>Profesional</Text>
              <Text style={styles.metaValue}>{medico}</Text>
            </View>
          </View>
        </View>

        {/* Diagram */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagrama dentario</Text>

          <View style={styles.archBlock}>
            <Text style={styles.archLabel}>Arcada superior</Text>
            <View style={styles.archRow}>
              {UPPER_ROW.map((n, i) => (
                <ToothCell
                  key={n}
                  n={n}
                  state={state[n] ?? "sano"}
                  isGap={i === 8}
                />
              ))}
            </View>
          </View>

          <View style={styles.midline} />

          <View style={styles.archBlock}>
            <Text style={styles.archLabel}>Arcada inferior</Text>
            <View style={styles.archRow}>
              {LOWER_ROW.map((n, i) => (
                <ToothCell
                  key={n}
                  n={n}
                  state={state[n] ?? "sano"}
                  isGap={i === 8}
                />
              ))}
            </View>
          </View>

          <View style={styles.legendBox}>
            {(Object.keys(STATE_LABELS) as ToothState[]).map((k) => {
              const c = STATE_COLORS[k];
              return (
                <View key={k} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendSwatch,
                      {
                        backgroundColor: c.fill,
                        borderColor: c.border,
                        borderStyle: k === "ausente" ? "dashed" : "solid",
                      },
                    ]}
                  />
                  <Text style={styles.legendLabel}>{STATE_LABELS[k]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        {notas.trim() ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas y plan de tratamiento</Text>
            <Text style={styles.notesBody}>{notas}</Text>
          </View>
        ) : null}

        {/* Signatures */}
        <View style={styles.signatureWrap}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Paciente</Text>
            <Text style={styles.signatureSub}>Firma de aceptación</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Profesional</Text>
            <Text style={styles.signatureSub}>{medico}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            LitienGuard · Estructura conforme NOM-024-SSA3 · LFPDPPP
          </Text>
          <Text style={styles.footerText}>
            Contiene únicamente información clínica
          </Text>
        </View>
      </Page>
    </Document>
  );
}

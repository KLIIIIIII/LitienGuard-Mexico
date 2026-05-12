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
const ACCENT = "#274B39";

const styles = StyleSheet.create({
  page: {
    paddingTop: 60,
    paddingBottom: 84,
    paddingHorizontal: 64,
    fontSize: 10,
    color: INK,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },

  // Masthead -------------------------------------------------------------
  mastheadBrandRow: { flexDirection: "row", justifyContent: "center" },
  mastheadBrand: {
    fontFamily: "Times-Italic",
    fontSize: 9,
    color: ACCENT,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  mastheadTitle: {
    marginTop: 8,
    textAlign: "center",
    fontFamily: "Times-Roman",
    fontSize: 24,
    color: INK,
    letterSpacing: 0.5,
  },
  mastheadSubtitle: {
    marginTop: 4,
    textAlign: "center",
    fontFamily: "Times-Italic",
    fontSize: 10,
    color: INK_MUTED,
  },
  mastheadRule: {
    marginTop: 14,
    marginBottom: 22,
    height: 0.6,
    backgroundColor: RULE,
  },

  // Meta block ----------------------------------------------------------
  metaRow: {
    flexDirection: "row",
    paddingBottom: 14,
    marginBottom: 28,
    borderBottomWidth: 0.6,
    borderBottomColor: RULE,
  },
  metaCell: { flexDirection: "column", marginRight: 36 },
  metaLabel: {
    fontSize: 6.5,
    color: INK_SOFT,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  metaValue: { fontSize: 10, color: INK },

  // Sections ------------------------------------------------------------
  sectionLabel: {
    fontSize: 7.5,
    color: ACCENT,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
  },

  // Arch ---------------------------------------------------------------
  archBlock: { marginBottom: 18 },
  archHeading: {
    fontFamily: "Times-Italic",
    fontSize: 10,
    color: INK_MUTED,
    marginBottom: 6,
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
    borderWidth: 0.8,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  toothLeftGap: { marginLeft: 9 },
  toothNum: { fontSize: 6.5, fontFamily: "Helvetica-Bold" },
  toothStateLabel: { fontSize: 5, marginTop: 1, fontFamily: "Times-Italic" },

  midline: {
    alignSelf: "center",
    width: 1,
    height: 14,
    backgroundColor: RULE,
    marginVertical: 4,
  },

  // Legend --------------------------------------------------------------
  legendWrap: {
    marginTop: 26,
    paddingTop: 14,
    paddingBottom: 14,
    borderTopWidth: 0.4,
    borderTopColor: RULE,
    borderBottomWidth: 0.4,
    borderBottomColor: RULE,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    marginVertical: 3,
  },
  legendBox: {
    width: 10,
    height: 10,
    borderWidth: 0.8,
    marginRight: 5,
    borderRadius: 2,
  },
  legendText: { fontSize: 8.5, color: INK_MUTED, letterSpacing: 0.3 },

  // Notes ---------------------------------------------------------------
  notesBlock: { marginTop: 26 },
  notesBody: {
    fontSize: 10,
    color: INK,
    lineHeight: 1.55,
    fontFamily: "Helvetica",
  },

  // Signatures ---------------------------------------------------------
  signatureWrap: {
    marginTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: { width: "44%", alignItems: "center" },
  signatureLine: {
    width: "100%",
    borderBottomWidth: 0.8,
    borderBottomColor: INK,
    marginBottom: 6,
    height: 34,
  },
  signatureLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: INK,
    textAlign: "center",
  },
  signatureSub: {
    fontSize: 8,
    fontFamily: "Times-Italic",
    color: INK_MUTED,
    textAlign: "center",
    marginTop: 1,
  },

  // Footer --------------------------------------------------------------
  footer: {
    position: "absolute",
    bottom: 36,
    left: 64,
    right: 64,
    paddingTop: 10,
    borderTopWidth: 0.4,
    borderTopColor: RULE,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerLeft: {
    fontFamily: "Times-Italic",
    fontSize: 7.5,
    color: INK_SOFT,
  },
  footerRight: {
    fontSize: 7,
    color: INK_SOFT,
    letterSpacing: 0.4,
  },
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
        {/* Masthead */}
        <View style={styles.mastheadBrandRow}>
          <Text style={styles.mastheadBrand}>LitienGuard · Dental</Text>
        </View>
        <Text style={styles.mastheadTitle}>Odontograma</Text>
        <Text style={styles.mastheadSubtitle}>
          Estado clínico de las piezas dentales
        </Text>
        <View style={styles.mastheadRule} />

        {/* Meta */}
        <View style={styles.metaRow}>
          <View style={[styles.metaCell, { flex: 1 }]}>
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

        {/* Odontogram */}
        <Text style={styles.sectionLabel}>Diagrama dentario · Notación FDI</Text>

        <View style={styles.archBlock}>
          <Text style={styles.archHeading}>Arcada superior</Text>
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
          <Text style={styles.archHeading}>Arcada inferior</Text>
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

        {/* Legend */}
        <View style={styles.legendWrap}>
          {(Object.keys(STATE_LABELS) as ToothState[]).map((k) => {
            const c = STATE_COLORS[k];
            return (
              <View key={k} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendBox,
                    {
                      backgroundColor: c.fill,
                      borderColor: c.border,
                      borderStyle: k === "ausente" ? "dashed" : "solid",
                    },
                  ]}
                />
                <Text style={styles.legendText}>{STATE_LABELS[k]}</Text>
              </View>
            );
          })}
        </View>

        {/* Notes */}
        {notas.trim() ? (
          <View style={styles.notesBlock}>
            <Text style={styles.sectionLabel}>Notas y plan de tratamiento</Text>
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
          <Text style={styles.footerLeft}>
            LitienGuard · Documento conforme a NOM-024-SSA3 · LFPDPPP
          </Text>
          <Text style={styles.footerRight}>
            Contiene únicamente información clínica
          </Text>
        </View>
      </Page>
    </Document>
  );
}

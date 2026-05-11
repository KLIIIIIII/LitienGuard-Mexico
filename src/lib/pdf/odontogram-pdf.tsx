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
  sano: { fill: "#FFFFFF", border: "#D8D4C8", text: "#2C2B27" },
  caries: { fill: "#FBE9C8", border: "#D49B3F", text: "#7A4F0F" },
  restaurado: { fill: "#D6E8DC", border: "#4A6B5B", text: "#274B39" },
  endodoncia: { fill: "#D0DEED", border: "#3F6B95", text: "#1F3F5E" },
  corona: { fill: "#2C2B27", border: "#2C2B27", text: "#FFFFFF" },
  implante: { fill: "#8E8B7E", border: "#5C5A52", text: "#FFFFFF" },
  ausente: { fill: "#F4F2EB", border: "#B8B4A8", text: "#8B887F" },
};

const UPPER_ROW = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_ROW = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: "#2C2B27", fontFamily: "Helvetica" },
  eyebrow: { fontSize: 8, color: "#4A6B5B", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 },
  h1: { fontSize: 18, fontWeight: 700, marginBottom: 14 },
  rowMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#E5E2DA" },
  metaCell: { flexDirection: "column" },
  metaLabel: { fontSize: 8, color: "#8B887F", marginBottom: 2 },
  metaValue: { fontSize: 11, fontWeight: 700 },
  arch: { marginBottom: 12 },
  archLabel: { fontSize: 8, color: "#8B887F", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 },
  archRow: { flexDirection: "row", justifyContent: "space-between" },
  tooth: { width: 28, height: 36, borderWidth: 1.4, borderRadius: 4, justifyContent: "center", alignItems: "center" },
  toothLeftGap: { marginLeft: 6 },
  toothNum: { fontSize: 7, fontWeight: 700 },
  toothState: { fontSize: 5, marginTop: 2 },
  legendWrap: { marginTop: 16, padding: 10, backgroundColor: "#F4F2EB", borderRadius: 6, flexDirection: "row", flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", marginRight: 14, marginBottom: 4 },
  legendBox: { width: 10, height: 10, borderWidth: 1, marginRight: 4, borderRadius: 2 },
  legendText: { fontSize: 8 },
  notasWrap: { marginTop: 18, padding: 12, borderWidth: 1, borderColor: "#E5E2DA", borderRadius: 6 },
  notasTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6 },
  notasBody: { fontSize: 9, lineHeight: 1.4, color: "#57554F" },
  signatureWrap: { marginTop: 30, flexDirection: "row", justifyContent: "space-between" },
  signatureBox: { width: "45%" },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: "#2C2B27", marginBottom: 4, height: 36 },
  signatureLabel: { fontSize: 8, color: "#57554F", textAlign: "center" },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 7, color: "#8B887F", borderTopWidth: 1, borderTopColor: "#E5E2DA", paddingTop: 6 },
});

interface OdontogramPdfProps {
  paciente: string;
  fecha: string;
  medico: string;
  notas: string;
  state: OdontogramState;
}

function ToothCell({ n, state, isGap }: { n: number; state: ToothState; isGap: boolean }) {
  const colors = STATE_COLORS[state];
  return (
    <View
      style={[
        styles.tooth,
        isGap ? styles.toothLeftGap : {},
        { backgroundColor: colors.fill, borderColor: colors.border, borderStyle: state === "ausente" ? "dashed" : "solid" },
      ]}
    >
      <Text style={[styles.toothNum, { color: colors.text }]}>{n}</Text>
      {state !== "sano" && (
        <Text style={[styles.toothState, { color: colors.text }]}>
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
        <Text style={styles.eyebrow}>LitienGuard · Dental</Text>
        <Text style={styles.h1}>Odontograma</Text>

        <View style={styles.rowMeta}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Paciente</Text>
            <Text style={styles.metaValue}>{paciente || "—"}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Fecha</Text>
            <Text style={styles.metaValue}>{fmtDate}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Profesional</Text>
            <Text style={styles.metaValue}>{medico}</Text>
          </View>
        </View>

        <View style={styles.arch}>
          <Text style={styles.archLabel}>Superior</Text>
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

        <View style={styles.arch}>
          <Text style={styles.archLabel}>Inferior</Text>
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

        <View style={styles.legendWrap}>
          {(Object.keys(STATE_LABELS) as ToothState[]).map((k) => {
            const c = STATE_COLORS[k];
            return (
              <View key={k} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendBox,
                    { backgroundColor: c.fill, borderColor: c.border, borderStyle: k === "ausente" ? "dashed" : "solid" },
                  ]}
                />
                <Text style={styles.legendText}>{STATE_LABELS[k]}</Text>
              </View>
            );
          })}
        </View>

        {notas.trim() ? (
          <View style={styles.notasWrap}>
            <Text style={styles.notasTitle}>Notas y plan de tratamiento</Text>
            <Text style={styles.notasBody}>{notas}</Text>
          </View>
        ) : null}

        <View style={styles.signatureWrap}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Firma del paciente</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Firma del profesional</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          LitienGuard · Construido siguiendo NOM-024-SSA3 y LFPDPPP. Este
          documento contiene únicamente información clínica.
        </Text>
      </Page>
    </Document>
  );
}

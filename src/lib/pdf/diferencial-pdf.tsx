import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { FINDINGS } from "@/lib/inference/knowledge-base";
import { resolveBranding } from "./branding";

const styles = StyleSheet.create({
  page: {
    /*
     * paddingTop deja espacio al header fixed para evitar overlap
     * en página 2+. 48 (margen) + 50 (header) ≈ 98.
     */
    paddingTop: 100,
    paddingBottom: 80,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1F1E1B",
    backgroundColor: "#FBFAF6",
    lineHeight: 1.55,
  },
  header: {
    position: "absolute",
    top: 48,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 10,
    borderBottomWidth: 0.6,
    borderBottomColor: "#C9C4B8",
  },
  brand: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.4,
    color: "#1F1E1B",
  },
  brandSubtitle: {
    fontSize: 8,
    color: "#8B887F",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 4,
  },
  metaCol: { alignItems: "flex-end" },
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
  caseTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#1F1E1B",
  },
  caseId: { fontSize: 8, color: "#8B887F", fontFamily: "Helvetica" },
  patientBlock: {
    backgroundColor: "#F4F2EB",
    padding: 12,
    borderRadius: 3,
    marginTop: 12,
    marginBottom: 18,
  },
  patientRow: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  patientField: { minWidth: 100 },
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
  contextoText: {
    marginTop: 8,
    fontSize: 10,
    lineHeight: 1.4,
    color: "#2C2B27",
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "#1F1E1B",
  },
  section: { marginBottom: 16 },
  findingCategory: {
    fontSize: 7,
    color: "#8B887F",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
    marginTop: 8,
  },
  findingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  badgePresent: {
    fontSize: 7,
    backgroundColor: "#E5EDE8",
    color: "#4A6B5B",
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginRight: 6,
    minWidth: 28,
    textAlign: "center",
  },
  badgeAbsent: {
    fontSize: 7,
    backgroundColor: "#F0E1E2",
    color: "#8E4A52",
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginRight: 6,
    minWidth: 28,
    textAlign: "center",
  },
  findingLabel: { fontSize: 9.5, color: "#1F1E1B", flex: 1 },
  dxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: "#C9C4B8",
  },
  dxRowLeader: {
    backgroundColor: "#E5EDE8",
    borderColor: "#4A6B5B",
  },
  dxRank: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#8B887F",
    width: 18,
  },
  dxLabel: { fontSize: 10, flex: 1, color: "#1F1E1B" },
  dxLabelLeader: { fontFamily: "Helvetica-Bold" },
  dxPct: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#4A6B5B",
    minWidth: 36,
    textAlign: "right",
  },
  dxPctSecondary: { color: "#8B887F" },
  decisionLabel: {
    fontSize: 7,
    color: "#8B887F",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 6,
    marginBottom: 2,
  },
  decisionValue: {
    fontSize: 10,
    color: "#1F1E1B",
    lineHeight: 1.4,
  },
  overrideBlock: {
    backgroundColor: "#F0E1E2",
    padding: 10,
    borderRadius: 3,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#8E4A52",
  },
  outcomeBadge: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  outcomeConfirmado: { backgroundColor: "#E5EDE8", color: "#4A6B5B" },
  outcomeRefutado: { backgroundColor: "#F0E1E2", color: "#8E4A52" },
  outcomeParcial: { backgroundColor: "#F0E9DC", color: "#8B6B3A" },
  outcomePendiente: { backgroundColor: "#F4F2EB", color: "#8B887F" },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 90,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#C9C4B8",
    fontSize: 7.5,
    color: "#8B887F",
    lineHeight: 1.45,
  },
  pageNumber: {
    position: "absolute",
    bottom: 32,
    right: 48,
    fontSize: 8,
    color: "#8B887F",
    fontFamily: "Helvetica-Bold",
  },
});

const CAT_LABELS: Record<string, string> = {
  ecg: "ECG",
  echo: "Ecocardiograma",
  lab: "Laboratorios",
  history: "Historia",
  exam: "Examen físico",
  genetic: "Genética",
};

const SEXO_LABEL: Record<string, string> = {
  M: "Masculino",
  F: "Femenino",
  O: "Otro",
};

export interface DiferencialPdfData {
  id: string;
  paciente_iniciales: string | null;
  paciente_edad: number | null;
  paciente_sexo: "M" | "F" | "O" | null;
  contexto_clinico: string | null;
  findings_observed: Array<{ finding: string; present: boolean | null }>;
  top_diagnoses: Array<{
    disease: string;
    label: string;
    posterior: number;
  }>;
  medico_diagnostico_principal: string | null;
  medico_notas: string | null;
  override_razonamiento: string | null;
  outcome_confirmado: string | null;
  outcome_confirmado_at: string | null;
  created_at: string;
  medico_nombre: string;
  medico_especialidad: string | null;
  medico_hospital: string | null;
  medico_cedula: string | null;
  pdf_brand_titulo?: string | null;
  pdf_brand_subtitulo?: string | null;
  consultorio_nombre?: string | null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function DiferencialPdf({
  caso,
}: {
  caso: DiferencialPdfData;
}) {
  const presentFindings = caso.findings_observed.filter(
    (f) => f.present === true,
  );
  const absentFindings = caso.findings_observed.filter(
    (f) => f.present === false,
  );

  const findingsByCategory = new Map<
    string,
    { id: string; label: string; present: boolean }[]
  >();
  for (const obs of [...presentFindings, ...absentFindings]) {
    const f = FINDINGS.find((x) => x.id === obs.finding);
    if (!f || obs.present === null) continue;
    const list = findingsByCategory.get(f.category) ?? [];
    list.push({ id: f.id, label: f.label, present: obs.present });
    findingsByCategory.set(f.category, list);
  }

  const outcomeStyle =
    caso.outcome_confirmado === "confirmado"
      ? styles.outcomeConfirmado
      : caso.outcome_confirmado === "refutado"
        ? styles.outcomeRefutado
        : caso.outcome_confirmado === "parcial"
          ? styles.outcomeParcial
          : styles.outcomePendiente;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          {(() => {
            const brand = resolveBranding(
              {
                pdf_brand_titulo: caso.pdf_brand_titulo,
                pdf_brand_subtitulo: caso.pdf_brand_subtitulo,
                consultorio_nombre: caso.consultorio_nombre,
              },
              {
                eyebrow: "Diferencial diagnóstico",
                subtitulo: "Diferencial diagnóstico",
              },
            );
            return (
              <View>
                <Text style={styles.brand}>{brand.titulo}</Text>
                <Text style={styles.brandSubtitle}>
                  {brand.titulo === "LitienGuard"
                    ? "Diferencial diagnóstico"
                    : `Diferencial · ${brand.subtitulo || "diagnóstico"}`}
                </Text>
              </View>
            );
          })()}
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Fecha</Text>
            <Text style={styles.metaValue}>
              {formatDate(caso.created_at)}
            </Text>
          </View>
        </View>

        {/* Case title */}
        <View>
          <Text style={styles.caseTitle}>
            {caso.paciente_iniciales ?? "Paciente"}
            {caso.paciente_edad ? ` · ${caso.paciente_edad} años` : ""}
            {caso.paciente_sexo
              ? ` · ${SEXO_LABEL[caso.paciente_sexo] ?? caso.paciente_sexo}`
              : ""}
          </Text>
          <Text style={styles.caseId}>
            ID {caso.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>

        {/* Patient context block */}
        <View style={styles.patientBlock}>
          <View style={styles.patientRow}>
            <View style={styles.patientField}>
              <Text style={styles.patientLabel}>Iniciales</Text>
              <Text style={styles.patientValue}>
                {caso.paciente_iniciales ?? "—"}
              </Text>
            </View>
            <View style={styles.patientField}>
              <Text style={styles.patientLabel}>Edad</Text>
              <Text style={styles.patientValue}>
                {caso.paciente_edad != null ? `${caso.paciente_edad}` : "—"}
              </Text>
            </View>
            <View style={styles.patientField}>
              <Text style={styles.patientLabel}>Sexo</Text>
              <Text style={styles.patientValue}>
                {caso.paciente_sexo
                  ? SEXO_LABEL[caso.paciente_sexo] ?? caso.paciente_sexo
                  : "—"}
              </Text>
            </View>
          </View>
          {caso.contexto_clinico && (
            <>
              <Text style={[styles.patientLabel, { marginTop: 10 }]}>
                Contexto clínico
              </Text>
              <Text style={styles.contextoText}>{caso.contexto_clinico}</Text>
            </>
          )}
        </View>

        {/* Findings observados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Findings observados</Text>
          {findingsByCategory.size === 0 ? (
            <Text style={{ fontSize: 9, color: "#8B887F", fontStyle: "italic" }}>
              No se marcaron findings.
            </Text>
          ) : (
            Array.from(findingsByCategory.entries()).map(([cat, list]) => (
              <View key={cat}>
                <Text style={styles.findingCategory}>
                  {CAT_LABELS[cat] ?? cat}
                </Text>
                {list.map((f) => (
                  <View key={f.id} style={styles.findingRow}>
                    <Text
                      style={f.present ? styles.badgePresent : styles.badgeAbsent}
                    >
                      {f.present ? "PRES" : "AUS"}
                    </Text>
                    <Text style={styles.findingLabel}>{f.label}</Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        {/* Diferencial generado */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diferencial generado</Text>
          {caso.top_diagnoses.map((dx, idx) => {
            const pct = Math.round(dx.posterior * 100);
            const isLeader = idx === 0;
            return (
              <View
                key={dx.disease}
                style={[styles.dxRow, isLeader ? styles.dxRowLeader : {}]}
              >
                <Text style={styles.dxRank}>
                  {(idx + 1).toString().padStart(2, "0")}
                </Text>
                <Text style={[styles.dxLabel, isLeader ? styles.dxLabelLeader : {}]}>
                  {dx.label}
                </Text>
                <Text
                  style={[styles.dxPct, !isLeader ? styles.dxPctSecondary : {}]}
                >
                  {pct}%
                </Text>
              </View>
            );
          })}
        </View>

        {/* Decisión del médico */}
        {(caso.medico_diagnostico_principal ||
          caso.medico_notas ||
          caso.override_razonamiento) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tu decisión</Text>
            {caso.medico_diagnostico_principal && (
              <>
                <Text style={styles.decisionLabel}>
                  Diagnóstico principal
                </Text>
                <Text
                  style={[
                    styles.decisionValue,
                    { fontFamily: "Helvetica-Bold" },
                  ]}
                >
                  {caso.medico_diagnostico_principal}
                </Text>
              </>
            )}
            {caso.medico_notas && (
              <>
                <Text style={styles.decisionLabel}>Notas</Text>
                <Text style={styles.decisionValue}>{caso.medico_notas}</Text>
              </>
            )}
            {caso.override_razonamiento && (
              <View style={styles.overrideBlock}>
                <Text
                  style={[
                    styles.decisionLabel,
                    { color: "#8E4A52", marginTop: 0 },
                  ]}
                >
                  Override del motor
                </Text>
                <Text style={styles.decisionValue}>
                  {caso.override_razonamiento}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Outcome */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outcome</Text>
          <Text style={[styles.outcomeBadge, outcomeStyle]}>
            {(caso.outcome_confirmado ?? "pendiente").toUpperCase()}
          </Text>
          {caso.outcome_confirmado_at && (
            <Text
              style={{ fontSize: 8, color: "#8B887F", marginTop: 4 }}
            >
              Marcado el {formatDate(caso.outcome_confirmado_at)}
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>
            Generado por {caso.medico_nombre}
            {caso.medico_especialidad ? ` · ${caso.medico_especialidad}` : ""}
            {caso.medico_hospital ? ` · ${caso.medico_hospital}` : ""}
            {caso.medico_cedula ? ` · Céd. ${caso.medico_cedula}` : ""}.
          </Text>
          <Text style={{ marginTop: 2 }}>
            LitienGuard es herramienta de apoyo a la decisión. No sustituye
            criterio clínico ni acto médico. Datos del paciente anonimizados
            por iniciales. Estructura conforme LFPDPPP, NOM-024-SSA3 y
            Reforma LGS Salud Digital DOF 2026.
          </Text>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

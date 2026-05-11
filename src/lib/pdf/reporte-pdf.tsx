import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { NotasAnalytics } from "@/lib/analytics/notas";

const styles = StyleSheet.create({
  page: {
    padding: 56,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1F1E1B",
    backgroundColor: "#FBFAF6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 0.6,
    borderBottomColor: "#C9C4B8",
  },
  brand: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1F1E1B",
    letterSpacing: -0.4,
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
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
  },
  metaValue: {
    fontSize: 10,
    color: "#2C2B27",
    fontFamily: "Helvetica-Bold",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1F1E1B",
    marginBottom: 8,
  },
  subtitle: { fontSize: 10, color: "#57554F", marginBottom: 22 },
  kpiRow: { flexDirection: "row", gap: 12, marginBottom: 22 },
  kpi: {
    flexGrow: 1,
    flexBasis: 0,
    backgroundColor: "#F4F2EB",
    padding: 14,
    borderRadius: 4,
  },
  kpiLabel: {
    fontSize: 7,
    color: "#8B887F",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1F1E1B",
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#1F1E1B",
    marginTop: 18,
    marginBottom: 8,
  },
  table: { borderTopWidth: 0.4, borderTopColor: "#E5E2DA" },
  row: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottomWidth: 0.4,
    borderBottomColor: "#EFECE3",
  },
  rowLabel: { flexGrow: 1, fontSize: 10, color: "#2C2B27" },
  rowValue: {
    width: 36,
    textAlign: "right",
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1F1E1B",
  },
  rowBar: {
    width: 64,
    height: 6,
    backgroundColor: "#E5EDE8",
    borderRadius: 3,
    marginLeft: 8,
    overflow: "hidden",
  },
  rowBarFill: { height: 6, backgroundColor: "#4A6B5B" },
  cols: { flexDirection: "row", gap: 14 },
  col: { flexBasis: 0, flexGrow: 1 },
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
    fontSize: 7,
    color: "#8B887F",
  },
});

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function BarRow({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowBar}>
        <View style={[styles.rowBarFill, { width: `${pct}%` } as never]} />
      </View>
      <Text style={styles.rowValue}>{count}</Text>
    </View>
  );
}

export function ReportePdf({
  medico,
  analytics,
}: {
  medico: { nombre: string; email: string; hospital: string | null };
  analytics: NotasAnalytics;
}) {
  const maxDx = analytics.topDiagnosticos[0]?.count ?? 1;
  const maxRx = analytics.topFarmacos[0]?.count ?? 1;
  const sexoTotal =
    analytics.distribucionSexo.F +
    analytics.distribucionSexo.M +
    analytics.distribucionSexo.O +
    analytics.distribucionSexo.sinDato;

  return (
    <Document title="Reporte clínico — LitienGuard" author="LitienGuard">
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.brand}>LitienGuard</Text>
              <View style={styles.brandDot} />
            </View>
            <Text style={styles.brandSubtitle}>
              Reporte clínico del médico
            </Text>
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.metaLabel}>Médico</Text>
            <Text style={styles.metaValue}>{medico.nombre}</Text>
            <Text style={[styles.metaLabel, { marginTop: 4 } as never]}>
              {medico.hospital ?? medico.email}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>Resumen de práctica clínica</Text>
        <Text style={styles.subtitle}>
          Ventana: {formatDate(analytics.rango.primera)} —{" "}
          {formatDate(analytics.rango.ultima)} · solo notas firmadas
        </Text>

        <View style={styles.kpiRow}>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Notas totales</Text>
            <Text style={styles.kpiValue}>{analytics.total}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Firmadas</Text>
            <Text style={styles.kpiValue}>{analytics.firmadas}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Borradores</Text>
            <Text style={styles.kpiValue}>{analytics.borradores}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Descartadas</Text>
            <Text style={styles.kpiValue}>{analytics.descartadas}</Text>
          </View>
        </View>

        <View style={styles.cols}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>
              Top diagnósticos manejados
            </Text>
            <View style={styles.table}>
              {analytics.topDiagnosticos.slice(0, 12).map((d) => (
                <BarRow
                  key={d.term}
                  label={d.term}
                  count={d.count}
                  max={maxDx}
                />
              ))}
              {analytics.topDiagnosticos.length === 0 && (
                <Text style={[styles.rowLabel, { paddingVertical: 6 } as never]}>
                  Sin diagnósticos detectados en las notas firmadas.
                </Text>
              )}
            </View>
          </View>

          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Top fármacos prescritos</Text>
            <View style={styles.table}>
              {analytics.topFarmacos.slice(0, 12).map((d) => (
                <BarRow
                  key={d.term}
                  label={d.term}
                  count={d.count}
                  max={maxRx}
                />
              ))}
              {analytics.topFarmacos.length === 0 && (
                <Text style={[styles.rowLabel, { paddingVertical: 6 } as never]}>
                  Sin fármacos detectados en los planes.
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.cols} wrap={false}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Distribución por edad</Text>
            <View style={styles.table}>
              {analytics.distribucionEdad.map((d) => (
                <BarRow
                  key={d.decada}
                  label={d.decada}
                  count={d.count}
                  max={
                    Math.max(
                      ...analytics.distribucionEdad.map((x) => x.count),
                      1,
                    )
                  }
                />
              ))}
            </View>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Sexo</Text>
            <View style={styles.table}>
              <BarRow
                label="Femenino"
                count={analytics.distribucionSexo.F}
                max={Math.max(sexoTotal, 1)}
              />
              <BarRow
                label="Masculino"
                count={analytics.distribucionSexo.M}
                max={Math.max(sexoTotal, 1)}
              />
              <BarRow
                label="Otro"
                count={analytics.distribucionSexo.O}
                max={Math.max(sexoTotal, 1)}
              />
              <BarRow
                label="Sin dato"
                count={analytics.distribucionSexo.sinDato}
                max={Math.max(sexoTotal, 1)}
              />
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>
            Generado por LitienGuard. Extracción automática por palabras clave;
            verifica contra el JSON o las notas individuales para auditoría
            completa.
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

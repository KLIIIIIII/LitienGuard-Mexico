import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

export interface RecetaPdfData {
  receta: {
    id: string;
    paciente_nombre: string;
    paciente_apellido_paterno: string | null;
    paciente_apellido_materno: string | null;
    paciente_edad: number | null;
    paciente_sexo: string | null;
    diagnostico: string;
    diagnostico_cie10: string | null;
    indicaciones_generales: string | null;
    status: string;
    fecha_emision: string;
    motivo_anulacion: string | null;
  };
  items: Array<{
    orden: number;
    medicamento: string;
    presentacion: string | null;
    dosis: string | null;
    frecuencia: string | null;
    duracion: string | null;
    via_administracion: string | null;
    indicaciones: string | null;
  }>;
  medico: {
    nombre: string | null;
    email: string | null;
    cedula_profesional: string | null;
    especialidad: string | null;
    consultorio_nombre: string | null;
    consultorio_direccion: string | null;
    consultorio_telefono: string | null;
  };
}

// Clinical palette — restrained, structured, easy to scan
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: RULE_STRONG,
  },
  brand: { flexDirection: "column" },
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
  practitionerBlock: {
    flexDirection: "column",
    alignItems: "flex-end",
    maxWidth: 240,
  },
  practitionerName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: INK,
  },
  practitionerLine: {
    fontSize: 8.5,
    color: INK_MUTED,
    marginTop: 1,
  },
  practitionerCedula: {
    fontSize: 8,
    color: INK_SOFT,
    marginTop: 3,
  },

  // Meta box - structured, easy to scan
  metaBox: {
    marginTop: 14,
    backgroundColor: SURFACE_ALT,
    borderRadius: 4,
    padding: 12,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metaCell: {
    flexDirection: "column",
    marginRight: 28,
    marginBottom: 4,
  },
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

  diagBody: { fontSize: 11, color: INK, marginBottom: 4 },
  diagCie: { fontSize: 9, color: INK_MUTED, marginTop: 2 },

  // Items
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
  },
  itemRowLast: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 0,
  },
  itemNumberWrap: {
    width: 22,
    height: 22,
    backgroundColor: ACCENT_SOFT,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  itemNumber: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
  },
  itemBody: { flex: 1 },
  itemMedicamento: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: INK,
  },
  itemPresentacion: {
    fontSize: 9.5,
    color: INK_MUTED,
    marginTop: 1,
  },
  itemDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  itemDetail: {
    flexDirection: "row",
    marginRight: 14,
    marginBottom: 2,
  },
  itemDetailLabel: {
    fontSize: 7,
    color: INK_SOFT,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginRight: 4,
    paddingTop: 1,
  },
  itemDetailValue: {
    fontSize: 9.5,
    color: INK,
    fontFamily: "Helvetica-Bold",
  },
  itemIndicaciones: {
    marginTop: 5,
    paddingTop: 4,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: ACCENT_SOFT,
    fontSize: 9,
    color: INK_MUTED,
  },

  indicacionesBody: { fontSize: 10, color: INK },

  // Anulada
  anuladaBox: {
    marginTop: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#C45A4A",
    borderRadius: 4,
    backgroundColor: "#FBEAE5",
  },
  anuladaTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#8B2C2C",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
  },
  anuladaBody: { fontSize: 9.5, color: INK_MUTED },

  // Signature
  signatureWrap: {
    marginTop: 38,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  signatureBox: { width: 250 },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: INK,
    marginBottom: 6,
    height: 32,
  },
  signatureName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: INK,
    textAlign: "center",
  },
  signatureSpecialty: {
    fontSize: 9,
    color: INK_MUTED,
    textAlign: "center",
    marginTop: 1,
  },
  signatureCedula: {
    fontSize: 8,
    color: INK_SOFT,
    textAlign: "center",
    marginTop: 2,
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

  // Watermark for borrador / anulada
  watermark: {
    position: "absolute",
    top: 320,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 78,
    fontFamily: "Helvetica-Bold",
    color: "#D8D4C8",
    transform: "rotate(-30deg)",
    opacity: 0.32,
    letterSpacing: 8,
  },
});

const SEXO_LABEL: Record<string, string> = { M: "Masculino", F: "Femenino", O: "Otro" };

export function RecetaPdf({ receta, items, medico }: RecetaPdfData) {
  const fullName = [
    receta.paciente_nombre,
    receta.paciente_apellido_paterno,
    receta.paciente_apellido_materno,
  ]
    .filter(Boolean)
    .join(" ");

  const fechaStr = (() => {
    try {
      return new Date(receta.fecha_emision).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return receta.fecha_emision;
    }
  })();

  const folio = receta.id.slice(0, 8).toUpperCase();
  const isAnulada = receta.status === "anulada";
  const isBorrador = receta.status === "borrador";

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {isAnulada && <Text style={styles.watermark}>ANULADA</Text>}
        {isBorrador && <Text style={styles.watermark}>BORRADOR</Text>}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <Text style={styles.brandEyebrow}>LitienGuard · Receta médica</Text>
            <Text style={styles.brandTitle}>Receta</Text>
          </View>
          <View style={styles.practitionerBlock}>
            <Text style={styles.practitionerName}>{medico.nombre ?? "—"}</Text>
            {medico.especialidad && (
              <Text style={styles.practitionerLine}>{medico.especialidad}</Text>
            )}
            {medico.cedula_profesional && (
              <Text style={styles.practitionerCedula}>
                Cédula profesional · {medico.cedula_profesional}
              </Text>
            )}
            {medico.consultorio_nombre && (
              <Text style={styles.practitionerLine}>
                {medico.consultorio_nombre}
              </Text>
            )}
            {medico.consultorio_direccion && (
              <Text style={styles.practitionerLine}>
                {medico.consultorio_direccion}
              </Text>
            )}
            {medico.consultorio_telefono && (
              <Text style={styles.practitionerLine}>
                Tel. {medico.consultorio_telefono}
              </Text>
            )}
          </View>
        </View>

        {/* Meta box - structured & scannable */}
        <View style={styles.metaBox}>
          <View style={styles.metaGrid}>
            <View style={[styles.metaCell, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.metaLabel}>Paciente</Text>
              <Text style={styles.metaValue}>{fullName}</Text>
            </View>
            {receta.paciente_edad !== null && (
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>Edad</Text>
                <Text style={styles.metaValue}>{receta.paciente_edad} años</Text>
              </View>
            )}
            {receta.paciente_sexo && (
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>Sexo</Text>
                <Text style={styles.metaValue}>
                  {SEXO_LABEL[receta.paciente_sexo] ?? receta.paciente_sexo}
                </Text>
              </View>
            )}
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Fecha</Text>
              <Text style={styles.metaValue}>{fechaStr}</Text>
            </View>
            <View style={[styles.metaCell, { marginRight: 0 }]}>
              <Text style={styles.metaLabel}>Folio</Text>
              <Text style={styles.metaValue}>{folio}</Text>
            </View>
          </View>
        </View>

        {/* Diagnóstico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnóstico</Text>
          <Text style={styles.diagBody}>{receta.diagnostico}</Text>
          {receta.diagnostico_cie10 && (
            <Text style={styles.diagCie}>
              CIE-10 · {receta.diagnostico_cie10}
            </Text>
          )}
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Tratamiento prescrito · {items.length}{" "}
            {items.length === 1 ? "medicamento" : "medicamentos"}
          </Text>
          {items.map((it, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <View
                key={it.orden}
                style={isLast ? styles.itemRowLast : styles.itemRow}
              >
                <View style={styles.itemNumberWrap}>
                  <Text style={styles.itemNumber}>{it.orden}</Text>
                </View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemMedicamento}>{it.medicamento}</Text>
                  {it.presentacion && (
                    <Text style={styles.itemPresentacion}>{it.presentacion}</Text>
                  )}
                  <View style={styles.itemDetailsGrid}>
                    {it.dosis && (
                      <View style={styles.itemDetail}>
                        <Text style={styles.itemDetailLabel}>Dosis</Text>
                        <Text style={styles.itemDetailValue}>{it.dosis}</Text>
                      </View>
                    )}
                    {it.frecuencia && (
                      <View style={styles.itemDetail}>
                        <Text style={styles.itemDetailLabel}>Frecuencia</Text>
                        <Text style={styles.itemDetailValue}>{it.frecuencia}</Text>
                      </View>
                    )}
                    {it.duracion && (
                      <View style={styles.itemDetail}>
                        <Text style={styles.itemDetailLabel}>Duración</Text>
                        <Text style={styles.itemDetailValue}>{it.duracion}</Text>
                      </View>
                    )}
                    {it.via_administracion && (
                      <View style={styles.itemDetail}>
                        <Text style={styles.itemDetailLabel}>Vía</Text>
                        <Text style={styles.itemDetailValue}>
                          {it.via_administracion}
                        </Text>
                      </View>
                    )}
                  </View>
                  {it.indicaciones && (
                    <Text style={styles.itemIndicaciones}>{it.indicaciones}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Indicaciones generales */}
        {receta.indicaciones_generales && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Indicaciones generales</Text>
            <Text style={styles.indicacionesBody}>
              {receta.indicaciones_generales}
            </Text>
          </View>
        )}

        {/* Anulada */}
        {isAnulada && receta.motivo_anulacion && (
          <View style={styles.anuladaBox}>
            <Text style={styles.anuladaTitle}>Receta anulada</Text>
            <Text style={styles.anuladaBody}>
              <Text style={styles.itemDetailLabel}>Motivo · </Text>
              {receta.motivo_anulacion}
            </Text>
          </View>
        )}

        {/* Signature */}
        {!isAnulada && (
          <View style={styles.signatureWrap}>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>{medico.nombre ?? "—"}</Text>
              {medico.especialidad && (
                <Text style={styles.signatureSpecialty}>
                  {medico.especialidad}
                </Text>
              )}
              {medico.cedula_profesional && (
                <Text style={styles.signatureCedula}>
                  Cédula profesional · {medico.cedula_profesional}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            LitienGuard · Estructura conforme NOM-024-SSA3 · LFPDPPP
          </Text>
          <Text style={styles.footerText}>
            Folio {folio} · Retención mínima 5 años
          </Text>
        </View>
      </Page>
    </Document>
  );
}

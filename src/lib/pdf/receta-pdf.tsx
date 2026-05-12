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

// Editorial palette: ink, cream, parchment, single restrained green accent.
const INK = "#1F1E1B";
const INK_MUTED = "#57554F";
const INK_SOFT = "#8B887F";
const INK_QUIET = "#B8B4A8";
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
  mastheadRule: {
    marginTop: 14,
    marginBottom: 22,
    height: 0.6,
    backgroundColor: RULE,
  },

  // Practitioner block (two columns) ------------------------------------
  practitionerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  practitionerLeft: { flexDirection: "column", maxWidth: 280 },
  practitionerRight: {
    flexDirection: "column",
    maxWidth: 220,
    alignItems: "flex-end",
  },
  practitionerName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: INK,
    marginBottom: 2,
  },
  practitionerSpecialty: {
    fontFamily: "Times-Italic",
    fontSize: 10,
    color: INK_MUTED,
    marginBottom: 4,
  },
  practitionerCedula: {
    fontSize: 8,
    color: INK_SOFT,
    letterSpacing: 0.4,
  },

  metaLabel: {
    fontSize: 6.5,
    color: INK_SOFT,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 1,
  },
  metaValue: {
    fontSize: 10,
    color: INK,
    marginBottom: 8,
  },
  metaValueMuted: {
    fontSize: 9,
    color: INK_MUTED,
    marginBottom: 2,
  },

  // Patient table -------------------------------------------------------
  patientRow: {
    flexDirection: "row",
    paddingBottom: 14,
    marginBottom: 22,
    borderBottomWidth: 0.6,
    borderBottomColor: RULE,
  },
  patientCol: { flexDirection: "column", marginRight: 36 },

  // Section headings ----------------------------------------------------
  sectionLabel: {
    fontSize: 7.5,
    color: ACCENT,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },

  // Diagnóstico ----------------------------------------------------------
  diagnosticoBlock: { marginBottom: 26 },
  diagnosticoBody: {
    fontSize: 11,
    color: INK,
    lineHeight: 1.45,
    marginBottom: 4,
  },
  diagnosticoCie: {
    fontSize: 8.5,
    fontFamily: "Times-Italic",
    color: INK_MUTED,
    marginTop: 2,
  },

  // Items ---------------------------------------------------------------
  itemsBlock: { marginBottom: 26 },
  itemRow: {
    flexDirection: "row",
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 0.4,
    borderBottomColor: RULE,
  },
  itemRowLast: {
    flexDirection: "row",
    marginBottom: 4,
  },
  itemNumber: {
    fontFamily: "Times-Italic",
    fontSize: 13,
    color: ACCENT,
    width: 22,
    marginTop: 0,
  },
  itemBody: { flex: 1 },
  itemMedicamento: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: INK,
    marginBottom: 2,
  },
  itemPresentacion: {
    fontFamily: "Times-Italic",
    fontSize: 9.5,
    color: INK_MUTED,
    marginBottom: 5,
  },
  itemPosology: {
    fontSize: 9.5,
    color: INK,
    lineHeight: 1.45,
    marginBottom: 2,
  },
  itemPosologyLabel: {
    fontSize: 6.5,
    color: INK_SOFT,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  itemIndicaciones: {
    fontFamily: "Times-Italic",
    fontSize: 9.5,
    color: INK_MUTED,
    marginTop: 4,
  },

  // Indicaciones generales ---------------------------------------------
  indicacionesBlock: { marginBottom: 26 },
  indicacionesBody: {
    fontSize: 10,
    color: INK,
    lineHeight: 1.55,
  },

  // Anulada -------------------------------------------------------------
  anuladaBlock: {
    marginTop: 18,
    paddingTop: 14,
    paddingBottom: 14,
    borderTopWidth: 0.6,
    borderBottomWidth: 0.6,
    borderColor: RULE,
  },
  anuladaLabel: {
    fontSize: 7.5,
    color: "#8B2C2C",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  anuladaBody: {
    fontFamily: "Times-Italic",
    fontSize: 10,
    color: INK_MUTED,
  },

  // Signature -----------------------------------------------------------
  signatureWrap: {
    marginTop: 60,
    flexDirection: "row",
    justifyContent: "center",
  },
  signatureBox: { width: 280, alignItems: "center" },
  signatureLine: {
    width: "100%",
    borderBottomWidth: 0.8,
    borderBottomColor: INK,
    marginBottom: 8,
    height: 36,
  },
  signatureName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: INK,
    textAlign: "center",
  },
  signatureSpecialty: {
    fontSize: 9,
    fontFamily: "Times-Italic",
    color: INK_MUTED,
    textAlign: "center",
    marginTop: 1,
  },
  signatureCedula: {
    fontSize: 7.5,
    color: INK_SOFT,
    letterSpacing: 0.4,
    textAlign: "center",
    marginTop: 2,
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

  // Watermark for borrador / anulada ------------------------------------
  watermark: {
    position: "absolute",
    top: 340,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "Times-Italic",
    fontSize: 88,
    color: INK_QUIET,
    transform: "rotate(-26deg)",
    opacity: 0.18,
    letterSpacing: 6,
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
        {isAnulada && <Text style={styles.watermark}>Anulada</Text>}
        {isBorrador && <Text style={styles.watermark}>Borrador</Text>}

        {/* Masthead */}
        <View style={styles.mastheadBrandRow}>
          <Text style={styles.mastheadBrand}>LitienGuard</Text>
        </View>
        <Text style={styles.mastheadTitle}>Receta Médica</Text>
        <View style={styles.mastheadRule} />

        {/* Practitioner block */}
        <View style={styles.practitionerRow}>
          <View style={styles.practitionerLeft}>
            <Text style={styles.practitionerName}>{medico.nombre ?? "—"}</Text>
            {medico.especialidad && (
              <Text style={styles.practitionerSpecialty}>{medico.especialidad}</Text>
            )}
            {medico.cedula_profesional && (
              <Text style={styles.practitionerCedula}>
                Cédula profesional · {medico.cedula_profesional}
              </Text>
            )}
          </View>

          <View style={styles.practitionerRight}>
            {medico.consultorio_nombre && (
              <Text style={styles.metaValueMuted}>{medico.consultorio_nombre}</Text>
            )}
            {medico.consultorio_direccion && (
              <Text style={styles.metaValueMuted}>{medico.consultorio_direccion}</Text>
            )}
            {medico.consultorio_telefono && (
              <Text style={styles.metaValueMuted}>Tel. {medico.consultorio_telefono}</Text>
            )}
          </View>
        </View>

        {/* Patient meta row */}
        <View style={styles.patientRow}>
          <View style={[styles.patientCol, { flex: 1 }]}>
            <Text style={styles.metaLabel}>Paciente</Text>
            <Text style={styles.metaValue}>{fullName}</Text>
          </View>
          {receta.paciente_edad !== null && (
            <View style={styles.patientCol}>
              <Text style={styles.metaLabel}>Edad</Text>
              <Text style={styles.metaValue}>{receta.paciente_edad} años</Text>
            </View>
          )}
          {receta.paciente_sexo && (
            <View style={styles.patientCol}>
              <Text style={styles.metaLabel}>Sexo</Text>
              <Text style={styles.metaValue}>
                {SEXO_LABEL[receta.paciente_sexo] ?? receta.paciente_sexo}
              </Text>
            </View>
          )}
          <View style={styles.patientCol}>
            <Text style={styles.metaLabel}>Fecha</Text>
            <Text style={styles.metaValue}>{fechaStr}</Text>
          </View>
          <View style={[styles.patientCol, { marginRight: 0 }]}>
            <Text style={styles.metaLabel}>Folio</Text>
            <Text style={styles.metaValue}>{folio}</Text>
          </View>
        </View>

        {/* Diagnóstico */}
        <View style={styles.diagnosticoBlock}>
          <Text style={styles.sectionLabel}>Diagnóstico clínico</Text>
          <Text style={styles.diagnosticoBody}>{receta.diagnostico}</Text>
          {receta.diagnostico_cie10 && (
            <Text style={styles.diagnosticoCie}>CIE-10 · {receta.diagnostico_cie10}</Text>
          )}
        </View>

        {/* Items */}
        <View style={styles.itemsBlock}>
          <Text style={styles.sectionLabel}>Tratamiento prescrito</Text>
          {items.map((it, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <View
                key={it.orden}
                style={isLast ? styles.itemRowLast : styles.itemRow}
              >
                <Text style={styles.itemNumber}>{it.orden}.</Text>
                <View style={styles.itemBody}>
                  <Text style={styles.itemMedicamento}>{it.medicamento}</Text>
                  {it.presentacion && (
                    <Text style={styles.itemPresentacion}>{it.presentacion}</Text>
                  )}
                  <PosologyLine
                    dosis={it.dosis}
                    frecuencia={it.frecuencia}
                    duracion={it.duracion}
                    via={it.via_administracion}
                  />
                  {it.indicaciones && (
                    <Text style={styles.itemIndicaciones}>« {it.indicaciones} »</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Indicaciones generales */}
        {receta.indicaciones_generales && (
          <View style={styles.indicacionesBlock}>
            <Text style={styles.sectionLabel}>Indicaciones generales</Text>
            <Text style={styles.indicacionesBody}>
              {receta.indicaciones_generales}
            </Text>
          </View>
        )}

        {/* Anulada */}
        {isAnulada && receta.motivo_anulacion && (
          <View style={styles.anuladaBlock}>
            <Text style={styles.anuladaLabel}>Receta anulada</Text>
            <Text style={styles.anuladaBody}>{receta.motivo_anulacion}</Text>
          </View>
        )}

        {/* Signature */}
        {!isAnulada && (
          <View style={styles.signatureWrap}>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>{medico.nombre ?? "—"}</Text>
              {medico.especialidad && (
                <Text style={styles.signatureSpecialty}>{medico.especialidad}</Text>
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
          <Text style={styles.footerLeft}>
            LitienGuard · Documento conforme a NOM-024-SSA3 · LFPDPPP
          </Text>
          <Text style={styles.footerRight}>
            Folio {folio} · Retención mínima 5 años
          </Text>
        </View>
      </Page>
    </Document>
  );
}

function PosologyLine({
  dosis,
  frecuencia,
  duracion,
  via,
}: {
  dosis: string | null;
  frecuencia: string | null;
  duracion: string | null;
  via: string | null;
}) {
  const parts: Array<{ label: string; value: string }> = [];
  if (dosis) parts.push({ label: "Dosis", value: dosis });
  if (frecuencia) parts.push({ label: "Frecuencia", value: frecuencia });
  if (duracion) parts.push({ label: "Duración", value: duracion });
  if (via) parts.push({ label: "Vía", value: via });

  if (parts.length === 0) return null;

  return (
    <Text style={styles.itemPosology}>
      {parts.map((p, i) => (
        <Text key={p.label}>
          <Text style={styles.itemPosologyLabel}>{p.label} · </Text>
          {p.value}
          {i < parts.length - 1 ? "    " : ""}
        </Text>
      ))}
    </Text>
  );
}

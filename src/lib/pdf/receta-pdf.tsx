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

const styles = StyleSheet.create({
  page: {
    padding: 36,
    paddingBottom: 90,
    fontSize: 10,
    color: "#2C2B27",
    fontFamily: "Helvetica",
  },
  headerWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2B27",
  },
  brand: { flexDirection: "column" },
  brandEyebrow: {
    fontSize: 7,
    color: "#4A6B5B",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  brandName: { fontSize: 18, fontWeight: 700 },
  brandTagline: { fontSize: 8, color: "#8B887F", marginTop: 2 },

  consultorio: { flexDirection: "column", alignItems: "flex-end" },
  consultLine: { fontSize: 9, color: "#57554F", marginBottom: 1 },

  watermark: {
    position: "absolute",
    top: 280,
    left: 80,
    right: 0,
    textAlign: "center",
    fontSize: 56,
    fontWeight: 700,
    color: "#E1D8C8",
    transform: "rotate(-30deg)",
    opacity: 0.4,
  },

  metaWrap: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F4F2EB",
    borderRadius: 4,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metaCell: {
    flexDirection: "column",
    marginRight: 24,
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 7,
    color: "#8B887F",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  metaValue: { fontSize: 10, fontWeight: 700 },

  sectionTitle: {
    fontSize: 8,
    color: "#4A6B5B",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginTop: 18,
    marginBottom: 6,
  },

  diagBody: { fontSize: 11, fontWeight: 700, marginBottom: 3 },
  diagCie10: { fontSize: 9, color: "#57554F" },

  itemsList: { marginTop: 10 },
  itemRow: {
    flexDirection: "row",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E2DA",
  },
  itemNumber: {
    fontSize: 10,
    fontWeight: 700,
    color: "#4A6B5B",
    marginRight: 8,
    width: 16,
  },
  itemBody: { flex: 1 },
  itemPrincipal: { fontSize: 11, fontWeight: 700, marginBottom: 3 },
  itemPresentacion: { fontSize: 9, color: "#57554F", marginBottom: 3 },
  itemDetail: {
    flexDirection: "row",
    flexWrap: "wrap",
    fontSize: 9,
    color: "#57554F",
  },
  itemPair: { marginRight: 14, marginBottom: 2 },
  itemPairLabel: { fontWeight: 700, color: "#2C2B27" },
  itemIndicaciones: {
    marginTop: 4,
    fontSize: 9,
    fontStyle: "italic",
    color: "#57554F",
  },

  indicaciones: {
    fontSize: 10,
    color: "#2C2B27",
    marginTop: 4,
  },

  anulada: {
    marginTop: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#C45A4A",
    borderRadius: 4,
  },
  anuladaTitle: { fontSize: 11, fontWeight: 700, color: "#C45A4A", marginBottom: 4 },
  anuladaBody: { fontSize: 9, color: "#57554F" },

  signatureWrap: {
    marginTop: 38,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  signatureBox: { width: 240, alignItems: "center" },
  signatureLine: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#2C2B27",
    marginBottom: 6,
    height: 30,
  },
  signatureLabel: { fontSize: 9, fontWeight: 700, color: "#2C2B27" },
  signatureSubLabel: { fontSize: 8, color: "#57554F", marginTop: 1 },
  signatureCedula: { fontSize: 8, color: "#57554F", marginTop: 1 },

  footer: {
    position: "absolute",
    bottom: 28,
    left: 36,
    right: 36,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#E5E2DA",
    fontSize: 7,
    color: "#8B887F",
    textAlign: "center",
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

        <View style={styles.headerWrap}>
          <View style={styles.brand}>
            <Text style={styles.brandEyebrow}>Receta médica</Text>
            <Text style={styles.brandName}>{medico.nombre ?? "—"}</Text>
            {medico.especialidad && (
              <Text style={styles.brandTagline}>{medico.especialidad}</Text>
            )}
            {medico.cedula_profesional && (
              <Text style={styles.brandTagline}>
                Cédula profesional: {medico.cedula_profesional}
              </Text>
            )}
          </View>

          <View style={styles.consultorio}>
            {medico.consultorio_nombre && (
              <Text style={styles.consultLine}>{medico.consultorio_nombre}</Text>
            )}
            {medico.consultorio_direccion && (
              <Text style={styles.consultLine}>{medico.consultorio_direccion}</Text>
            )}
            {medico.consultorio_telefono && (
              <Text style={styles.consultLine}>Tel. {medico.consultorio_telefono}</Text>
            )}
          </View>
        </View>

        <View style={styles.metaWrap}>
          <View style={styles.metaCell}>
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
            <Text style={styles.metaLabel}>Fecha de emisión</Text>
            <Text style={styles.metaValue}>{fechaStr}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Folio</Text>
            <Text style={styles.metaValue}>{folio}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Diagnóstico</Text>
        <Text style={styles.diagBody}>{receta.diagnostico}</Text>
        {receta.diagnostico_cie10 && (
          <Text style={styles.diagCie10}>CIE-10: {receta.diagnostico_cie10}</Text>
        )}

        <Text style={styles.sectionTitle}>Tratamiento prescrito</Text>
        <View style={styles.itemsList}>
          {items.map((it) => (
            <View key={it.orden} style={styles.itemRow}>
              <Text style={styles.itemNumber}>{it.orden}.</Text>
              <View style={styles.itemBody}>
                <Text style={styles.itemPrincipal}>{it.medicamento}</Text>
                {it.presentacion && (
                  <Text style={styles.itemPresentacion}>{it.presentacion}</Text>
                )}
                <View style={styles.itemDetail}>
                  {it.dosis && (
                    <Text style={styles.itemPair}>
                      <Text style={styles.itemPairLabel}>Dosis: </Text>
                      {it.dosis}
                    </Text>
                  )}
                  {it.frecuencia && (
                    <Text style={styles.itemPair}>
                      <Text style={styles.itemPairLabel}>Frecuencia: </Text>
                      {it.frecuencia}
                    </Text>
                  )}
                  {it.duracion && (
                    <Text style={styles.itemPair}>
                      <Text style={styles.itemPairLabel}>Duración: </Text>
                      {it.duracion}
                    </Text>
                  )}
                  {it.via_administracion && (
                    <Text style={styles.itemPair}>
                      <Text style={styles.itemPairLabel}>Vía: </Text>
                      {it.via_administracion}
                    </Text>
                  )}
                </View>
                {it.indicaciones && (
                  <Text style={styles.itemIndicaciones}>
                    Indicaciones: {it.indicaciones}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {receta.indicaciones_generales && (
          <>
            <Text style={styles.sectionTitle}>Indicaciones generales</Text>
            <Text style={styles.indicaciones}>{receta.indicaciones_generales}</Text>
          </>
        )}

        {isAnulada && receta.motivo_anulacion && (
          <View style={styles.anulada}>
            <Text style={styles.anuladaTitle}>Receta anulada</Text>
            <Text style={styles.anuladaBody}>
              Motivo: {receta.motivo_anulacion}
            </Text>
          </View>
        )}

        {!isAnulada && (
          <View style={styles.signatureWrap}>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>
                {medico.nombre ?? "—"}
              </Text>
              {medico.especialidad && (
                <Text style={styles.signatureSubLabel}>
                  {medico.especialidad}
                </Text>
              )}
              {medico.cedula_profesional && (
                <Text style={styles.signatureCedula}>
                  Cédula profesional: {medico.cedula_profesional}
                </Text>
              )}
            </View>
          </View>
        )}

        <Text style={styles.footer} fixed>
          Documento generado por LitienGuard · Cumplimiento NOM-024-SSA3-2012 +
          LFPDPPP · Retención mínima 5 años · Folio {folio}
        </Text>
      </Page>
    </Document>
  );
}

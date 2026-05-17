/**
 * I1 — Importer HL7 v2.
 *
 * Parsea archivos HL7 v2 (el formato que exporta SaludTotal y muchos
 * sistemas hospitalarios legacy) y devuelve estructura clínica
 * navegable: pacientes + encounters + diagnósticos + medicamentos +
 * observaciones.
 *
 * HL7 v2 estructura:
 *   - Cada línea (\r o \n) es un segmento
 *   - Primer campo del segmento es su tipo (MSH, PID, PV1, OBX, etc.)
 *   - Campos separados por | (pipe)
 *   - Repeticiones por ~ (tilde)
 *   - Componentes por ^ (caret)
 *   - Sub-componentes por &
 *
 * Cobertura mínima viable para LitienGuard:
 *   - PID → datos del paciente (nombre, sexo, fecha nac, teléfono)
 *   - PV1 → encuentro / visita (fecha)
 *   - DG1 → diagnósticos (CIE-10)
 *   - OBX → observaciones (síntomas, signos vitales)
 *   - RXE / RXO → medicamentos prescritos
 *   - AL1 → alergias
 *
 * Notas:
 *   - HL7 v2 acepta múltiples mensajes en un archivo (separados por MSH).
 *     Procesamos cada uno como un encounter.
 *   - Fechas HL7: YYYYMMDDHHMMSS → ISO YYYY-MM-DDTHH:MM:SS
 *   - Sexo HL7: M/F/O/U → M/F/O/null
 */

export interface Hl7Paciente {
  nombre: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  fecha_nacimiento: string | null;
  sexo: "M" | "F" | "O" | null;
  telefono: string | null;
  email: string | null;
  externalId: string | null;
}

export interface Hl7Encounter {
  fecha: string | null;
  motivo: string | null;
  tipo: string | null;
}

export interface Hl7Diagnostico {
  codigo: string | null;
  descripcion: string;
}

export interface Hl7Medicamento {
  nombre: string;
  dosis: string | null;
  frecuencia: string | null;
  via: string | null;
}

export interface Hl7Observacion {
  campo: string;
  valor: string;
  unidad: string | null;
}

export interface Hl7Alergia {
  agente: string;
  reaccion: string | null;
}

export interface Hl7Mensaje {
  paciente: Hl7Paciente | null;
  encounter: Hl7Encounter | null;
  diagnosticos: Hl7Diagnostico[];
  medicamentos: Hl7Medicamento[];
  observaciones: Hl7Observacion[];
  alergias: Hl7Alergia[];
  warnings: string[];
}

export interface Hl7ParseResult {
  mensajes: Hl7Mensaje[];
  totalSegmentos: number;
  parseErrors: string[];
}

// =================================================================
// Parsing helpers
// =================================================================

function parseFields(segment: string): string[] {
  // El primer campo del segmento (e.g. "PID") y luego pipe-separated.
  return segment.split("|");
}

function parseComponents(field: string): string[] {
  return field.split("^");
}

function parseHl7Date(s: string | undefined | null): string | null {
  if (!s) return null;
  // Formato HL7: YYYYMMDDHHMMSS o YYYYMMDD
  const clean = s.replace(/[^\d]/g, "");
  if (clean.length < 8) return null;
  const yyyy = clean.slice(0, 4);
  const mm = clean.slice(4, 6);
  const dd = clean.slice(6, 8);
  if (clean.length >= 14) {
    const hh = clean.slice(8, 10);
    const mi = clean.slice(10, 12);
    const ss = clean.slice(12, 14);
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
  }
  return `${yyyy}-${mm}-${dd}`;
}

function parseHl7Sex(s: string | undefined | null): "M" | "F" | "O" | null {
  if (!s) return null;
  const c = s.trim().toUpperCase();
  if (c === "M") return "M";
  if (c === "F") return "F";
  if (c === "O" || c === "OTH" || c === "OTHER") return "O";
  return null;
}

// =================================================================
// Segment-specific parsers
// =================================================================

function parsePid(fields: string[]): Hl7Paciente {
  // PID-3 external ID, PID-5 name, PID-7 DOB, PID-8 sex, PID-13 phone
  const idField = fields[3] ?? "";
  const idParts = parseComponents(idField);
  const externalId = idParts[0] ?? null;

  const nameField = fields[5] ?? "";
  const nameParts = parseComponents(nameField);
  // Estandar: nameParts[0] = familyName, [1] = givenName, [2] = middleName
  // PERO: en MX a veces vienen "PATERNO MATERNO^NOMBRE"
  const fam = (nameParts[0] ?? "").trim();
  const famParts = fam.split(/\s+/);
  const apellido_paterno = famParts[0] ?? null;
  const apellido_materno = famParts.slice(1).join(" ") || null;
  const nombre = (nameParts[1] ?? "").trim() || "Sin nombre";

  return {
    nombre,
    apellido_paterno,
    apellido_materno,
    fecha_nacimiento: parseHl7Date(fields[7]),
    sexo: parseHl7Sex(fields[8]),
    telefono: (fields[13] ?? "").trim() || null,
    email: (fields[14] ?? "").trim() || null,
    externalId,
  };
}

function parsePv1(fields: string[]): Hl7Encounter {
  // PV1-2 patient class (I/O/E), PV1-44 admit date
  const tipo = (fields[2] ?? "").trim() || null;
  const fecha = parseHl7Date(fields[44]);
  return {
    fecha,
    motivo: null,
    tipo,
  };
}

function parseDg1(fields: string[]): Hl7Diagnostico {
  // DG1-3 diagnosis code (CIE-10), DG1-4 diagnosis description
  const codeField = fields[3] ?? "";
  const parts = parseComponents(codeField);
  return {
    codigo: parts[0] ?? null,
    descripcion: (parts[1] ?? fields[4] ?? "").trim() || "Sin descripción",
  };
}

function parseObx(fields: string[]): Hl7Observacion {
  // OBX-3 observation identifier, OBX-5 value, OBX-6 units
  const idField = fields[3] ?? "";
  const idParts = parseComponents(idField);
  const campo = (idParts[1] ?? idParts[0] ?? "").trim() || "Observación";
  const valor = (fields[5] ?? "").trim();
  const unidad = (fields[6] ?? "").trim() || null;
  return { campo, valor, unidad };
}

function parseRxe(fields: string[]): Hl7Medicamento {
  // RXE-2 medication code/name, RXE-3 minimum amount, RXE-5 units,
  // RXE-21 frequency, RXE-6 route
  const medField = fields[2] ?? "";
  const medParts = parseComponents(medField);
  const nombre = (medParts[1] ?? medParts[0] ?? "").trim() || "Medicamento";
  const dosisVal = (fields[3] ?? "").trim();
  const dosisUnit = (fields[5] ?? "").trim();
  const dosis =
    dosisVal && dosisUnit ? `${dosisVal} ${dosisUnit}` : dosisVal || null;
  const frecuencia = (fields[21] ?? "").trim() || null;
  const via = (fields[6] ?? "").trim() || null;
  return { nombre, dosis, frecuencia, via };
}

function parseAl1(fields: string[]): Hl7Alergia {
  // AL1-3 allergen, AL1-5 reaction
  const allergenField = fields[3] ?? "";
  const parts = parseComponents(allergenField);
  const agente = (parts[1] ?? parts[0] ?? fields[3] ?? "").trim() || "Alérgeno";
  const reaccion = (fields[5] ?? "").trim() || null;
  return { agente, reaccion };
}

// =================================================================
// Main parser
// =================================================================

export function parseHl7(content: string): Hl7ParseResult {
  if (!content || content.trim().length < 3) {
    return {
      mensajes: [],
      totalSegmentos: 0,
      parseErrors: ["Archivo vacío"],
    };
  }

  // Normalizar line endings
  const normalized = content.replace(/\r\n?/g, "\n");
  const lines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 3);

  const mensajes: Hl7Mensaje[] = [];
  let current: Hl7Mensaje | null = null;
  const parseErrors: string[] = [];
  let totalSegmentos = 0;

  for (const line of lines) {
    const fields = parseFields(line);
    const tipo = fields[0]?.trim();
    if (!tipo) continue;

    totalSegmentos++;

    try {
      if (tipo === "MSH") {
        // Inicio de nuevo mensaje
        if (current) mensajes.push(current);
        current = {
          paciente: null,
          encounter: null,
          diagnosticos: [],
          medicamentos: [],
          observaciones: [],
          alergias: [],
          warnings: [],
        };
        continue;
      }

      // Si no hay MSH iniciador, asumimos un mensaje implícito
      if (!current) {
        current = {
          paciente: null,
          encounter: null,
          diagnosticos: [],
          medicamentos: [],
          observaciones: [],
          alergias: [],
          warnings: [],
        };
      }

      switch (tipo) {
        case "PID":
          current.paciente = parsePid(fields);
          break;
        case "PV1":
          current.encounter = parsePv1(fields);
          break;
        case "DG1":
          current.diagnosticos.push(parseDg1(fields));
          break;
        case "OBX": {
          const obs = parseObx(fields);
          if (obs.valor) current.observaciones.push(obs);
          break;
        }
        case "RXE":
        case "RXO":
          current.medicamentos.push(parseRxe(fields));
          break;
        case "AL1":
          current.alergias.push(parseAl1(fields));
          break;
        // Segmentos que conocemos pero ignoramos (no aportan a LG):
        case "EVN":
        case "MSA":
        case "GT1":
        case "IN1":
        case "NK1":
        case "ZBE":
          break;
        default:
          // Segmento desconocido — no es fallo, solo nota
          if (current.warnings.length < 5) {
            current.warnings.push(`Segmento ignorado: ${tipo}`);
          }
      }
    } catch (e) {
      parseErrors.push(
        `Error parseando ${tipo}: ${e instanceof Error ? e.message : "?"}`,
      );
    }
  }

  if (current) mensajes.push(current);

  // Filtrar mensajes vacíos
  const validMensajes = mensajes.filter(
    (m) =>
      m.paciente !== null ||
      m.diagnosticos.length > 0 ||
      m.medicamentos.length > 0,
  );

  return {
    mensajes: validMensajes,
    totalSegmentos,
    parseErrors,
  };
}

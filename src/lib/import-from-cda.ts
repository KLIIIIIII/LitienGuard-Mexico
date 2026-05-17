/**
 * I2 — Importer CDA (Clinical Document Architecture).
 *
 * Parsea archivos CDA XML (formato que exporta MediSel y muchos EHRs que
 * cumplen con HL7 v3). Estructura típica:
 *
 *   <ClinicalDocument>
 *     <recordTarget>
 *       <patientRole>
 *         <id extension="..." />
 *         <patient>
 *           <name><given>...</given><family>...</family></name>
 *           <administrativeGenderCode code="M" />
 *           <birthTime value="19850101" />
 *         </patient>
 *       </patientRole>
 *     </recordTarget>
 *     <component>
 *       <structuredBody>
 *         <component>
 *           <section>
 *             <code code="..." />
 *             <title>Diagnósticos</title>
 *             <text>...</text>
 *             <entry>...</entry>
 *           </section>
 *         </component>
 *       </structuredBody>
 *     </component>
 *   </ClinicalDocument>
 *
 * Implementación: parser regex-based (NodeJS no tiene DOMParser nativo).
 * Para nuestro caso solo necesitamos extraer estructura clave, no validar
 * schema completo CDA. Robusto para 80% de variaciones reales.
 */

export interface CdaPaciente {
  nombre: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  fecha_nacimiento: string | null;
  sexo: "M" | "F" | "O" | null;
  externalId: string | null;
  telefono: string | null;
}

export interface CdaSeccion {
  titulo: string;
  codigo: string | null;
  texto: string;
}

export interface CdaDocumento {
  paciente: CdaPaciente | null;
  fecha: string | null;
  secciones: CdaSeccion[];
  warnings: string[];
}

// =================================================================
// Regex-based XML helpers
// =================================================================

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function stripXmlTags(s: string): string {
  return decodeXmlEntities(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function getAttr(tag: string, attr: string): string | null {
  const re = new RegExp(`${attr}\\s*=\\s*"([^"]*)"`, "i");
  const m = tag.match(re);
  return m ? m[1]! : null;
}

function getFirstTag(xml: string, tagName: string): string | null {
  const re = new RegExp(`<${tagName}\\b[^>]*\\/?>`, "i");
  const m = xml.match(re);
  return m ? m[0]! : null;
}

function getFirstElementContent(xml: string, tagName: string): string | null {
  const re = new RegExp(
    `<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`,
    "i",
  );
  const m = xml.match(re);
  return m ? m[1]! : null;
}

function getAllElements(xml: string, tagName: string): string[] {
  const results: string[] = [];
  const re = new RegExp(
    `<${tagName}\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`,
    "gi",
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    results.push(m[0]!);
  }
  return results;
}

function parseCdaDate(s: string | null | undefined): string | null {
  if (!s) return null;
  const clean = s.replace(/[^\d]/g, "");
  if (clean.length < 8) return null;
  const yyyy = clean.slice(0, 4);
  const mm = clean.slice(4, 6);
  const dd = clean.slice(6, 8);
  return `${yyyy}-${mm}-${dd}`;
}

function parseCdaSex(s: string | null | undefined): "M" | "F" | "O" | null {
  if (!s) return null;
  const c = s.trim().toUpperCase();
  if (c === "M") return "M";
  if (c === "F") return "F";
  if (c === "UN" || c === "OTH" || c === "O") return "O";
  return null;
}

// =================================================================
// Patient parser
// =================================================================

function parsePatientFromRecordTarget(
  recordTargetXml: string,
): CdaPaciente | null {
  const patientRoleXml = getFirstElementContent(
    recordTargetXml,
    "patientRole",
  );
  if (!patientRoleXml) return null;

  // External ID — del primer <id extension="..." />
  const idTag = getFirstTag(patientRoleXml, "id");
  const externalId = idTag ? getAttr(idTag, "extension") : null;

  // Teléfono opcional — <telecom value="tel:..." use="HP" />
  const telecomTag = getFirstTag(patientRoleXml, "telecom");
  const telecomVal = telecomTag ? getAttr(telecomTag, "value") : null;
  const telefono = telecomVal?.replace(/^tel:/, "") ?? null;

  const patientBlock = getFirstElementContent(patientRoleXml, "patient");
  if (!patientBlock) return null;

  // Name parsing — puede haber múltiples <name>; tomamos el primero
  const nameBlock = getFirstElementContent(patientBlock, "name");
  let nombre = "Sin nombre";
  let apellido_paterno: string | null = null;
  let apellido_materno: string | null = null;
  if (nameBlock) {
    const given = getFirstElementContent(nameBlock, "given");
    const familyAll = nameBlock.match(/<family[^>]*>([\s\S]*?)<\/family>/gi);
    if (given) nombre = stripXmlTags(given);
    if (familyAll && familyAll.length > 0) {
      const fams = familyAll.map((f) =>
        stripXmlTags(f.replace(/^<family[^>]*>/, "").replace(/<\/family>$/, "")),
      );
      apellido_paterno = fams[0] ?? null;
      apellido_materno = fams.slice(1).join(" ") || null;
    }
  }

  // Sexo
  const sexTag = getFirstTag(patientBlock, "administrativeGenderCode");
  const sexCode = sexTag ? getAttr(sexTag, "code") : null;
  const sexo = parseCdaSex(sexCode);

  // Fecha de nacimiento
  const dobTag = getFirstTag(patientBlock, "birthTime");
  const dobValue = dobTag ? getAttr(dobTag, "value") : null;
  const fecha_nacimiento = parseCdaDate(dobValue);

  return {
    nombre,
    apellido_paterno,
    apellido_materno,
    fecha_nacimiento,
    sexo,
    externalId,
    telefono,
  };
}

// =================================================================
// Sections parser
// =================================================================

function parseSection(sectionXml: string): CdaSeccion | null {
  const titulo = stripXmlTags(
    getFirstElementContent(sectionXml, "title") ?? "Sección",
  );
  const codeTag = getFirstTag(sectionXml, "code");
  const codigo = codeTag ? getAttr(codeTag, "code") : null;
  // El text de la sección — puede ser <text>...html-like...</text>
  const textBlock = getFirstElementContent(sectionXml, "text") ?? "";
  const texto = stripXmlTags(textBlock).slice(0, 2000);
  if (!titulo && !texto) return null;
  return { titulo, codigo, texto };
}

function parseAllSections(structuredBodyXml: string): CdaSeccion[] {
  const componentBlocks = getAllElements(structuredBodyXml, "component");
  const sections: CdaSeccion[] = [];
  for (const comp of componentBlocks) {
    const sectionXml = getFirstElementContent(comp, "section");
    if (!sectionXml) continue;
    const parsed = parseSection(sectionXml);
    if (parsed) sections.push(parsed);
  }
  return sections;
}

// =================================================================
// Main parser
// =================================================================

export function parseCda(content: string): CdaDocumento {
  const warnings: string[] = [];

  // Verificación rápida de que es CDA-like
  if (!content.includes("ClinicalDocument") && !content.includes("recordTarget")) {
    return {
      paciente: null,
      fecha: null,
      secciones: [],
      warnings: ["El archivo no parece ser un CDA válido (sin <ClinicalDocument> ni <recordTarget>)"],
    };
  }

  // Fecha del documento — <effectiveTime value="..."/>
  const effTag = getFirstTag(content, "effectiveTime");
  const effVal = effTag ? getAttr(effTag, "value") : null;
  const fecha = parseCdaDate(effVal);

  // Paciente
  const recordTargetXml = getFirstElementContent(content, "recordTarget");
  let paciente: CdaPaciente | null = null;
  if (recordTargetXml) {
    paciente = parsePatientFromRecordTarget(recordTargetXml);
  } else {
    warnings.push("No se encontró <recordTarget> — sin datos del paciente");
  }

  // Secciones del cuerpo estructurado
  const structuredBodyXml = getFirstElementContent(content, "structuredBody");
  let secciones: CdaSeccion[] = [];
  if (structuredBodyXml) {
    secciones = parseAllSections(structuredBodyXml);
  } else {
    warnings.push("No se encontró <structuredBody> — sin secciones clínicas");
  }

  return {
    paciente,
    fecha,
    secciones,
    warnings,
  };
}

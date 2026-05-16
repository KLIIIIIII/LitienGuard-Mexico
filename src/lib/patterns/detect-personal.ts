/**
 * Detección de patrones personales desde la data del médico.
 *
 * Lee las consultas, diferenciales y recetas del médico y extrae
 * patrones emergentes que él NO puede ver fácilmente:
 *
 *   - DiagnósticoFrecuencia: qué enfermedades ve más
 *   - CoOcurrencia: qué dx aparecen juntos en mismo paciente
 *   - PpvPersonal: cuando el motor te puso X como top-1, ¿se confirmó?
 *   - OverridePattern: cuándo te apartas del motor (top-1 vs lo elegido)
 *   - LoopCalidad: % cerrados con outcome, override rate, latencia
 *
 * Todo se calcula server-side. La data llega ya descifrada — el
 * cifrado de notas_scribe NO bloquea estos análisis porque
 * diferencial_sessions y recetas guardan dx en texto plano (no PHI).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface DiagnosticoFrecuencia {
  label: string;
  count: number;
}

export interface CoOcurrenciaEntry {
  dxA: string;
  dxB: string;
  count: number;
}

export interface PpvPersonalEntry {
  disease: string;
  label: string;
  total: number;
  confirmados: number;
  refutados: number;
  parciales: number;
  /** PPV personal: confirmados / (confirmados + refutados + parciales). */
  ppv: number;
}

export interface OverridePatternEntry {
  motorPropuso: string;
  medicoEligio: string;
  count: number;
  razones: string[];
}

export interface LoopCalidad {
  total: number;
  conOutcome: number;
  conDx: number;
  overrides: number;
  pendientesRecordatorio: number;
  latenciaPromedioDias: number | null;
}

export interface PersonalPatterns {
  total: number;
  diagnosticosFrecuentes: DiagnosticoFrecuencia[];
  coOcurrencias: CoOcurrenciaEntry[];
  ppvPersonal: PpvPersonalEntry[];
  overridePatterns: OverridePatternEntry[];
  loop: LoopCalidad;
  /** Si está abajo de este umbral, mostramos empty-state. */
  hasEnoughData: boolean;
}

const MIN_CASES_FOR_PATTERNS = 5;

interface DiferencialRow {
  id: string;
  paciente_iniciales: string | null;
  paciente_edad: number | null;
  consulta_id: string | null;
  top_diagnoses:
    | Array<{ disease: string; label: string; posterior: number }>
    | null;
  medico_diagnostico_principal: string | null;
  override_razonamiento: string | null;
  outcome_confirmado: string | null;
  outcome_confirmado_at: string | null;
  created_at: string;
}

interface RecetaRow {
  diagnostico: string | null;
  paciente_iniciales: string | null;
  created_at: string;
}

// Combining diacritical marks Unicode range U+0300..U+036F
const DIACRITICS_RE = /[̀-ͯ]/g;

function normalizeLabel(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_RE, "")
    .slice(0, 80);
}

export async function detectPersonalPatterns(
  supa: SupabaseClient,
  medicoId: string,
): Promise<PersonalPatterns> {
  const [{ data: difsRaw }, { data: recetasRaw }] = await Promise.all([
    supa
      .from("diferencial_sessions")
      .select(
        "id, paciente_iniciales, paciente_edad, consulta_id, top_diagnoses, medico_diagnostico_principal, override_razonamiento, outcome_confirmado, outcome_confirmado_at, created_at",
      )
      .eq("medico_id", medicoId)
      .limit(2000),
    supa
      .from("recetas")
      .select("diagnostico, paciente_iniciales, created_at")
      .eq("medico_id", medicoId)
      .limit(2000),
  ]);

  const difs = (difsRaw ?? []) as DiferencialRow[];
  const recetas = (recetasRaw ?? []) as RecetaRow[];
  const total = difs.length;

  // ---------------- diagnosticosFrecuentes ----------------
  const dxCount = new Map<string, { label: string; count: number }>();
  for (const d of difs) {
    const raw = d.medico_diagnostico_principal?.trim();
    if (!raw) continue;
    const key = normalizeLabel(raw);
    const entry = dxCount.get(key) ?? { label: raw, count: 0 };
    entry.count += 1;
    if (raw.length < entry.label.length) entry.label = raw;
    dxCount.set(key, entry);
  }
  for (const r of recetas) {
    const raw = r.diagnostico?.trim();
    if (!raw) continue;
    const key = normalizeLabel(raw);
    const entry = dxCount.get(key) ?? { label: raw, count: 0 };
    entry.count += 1;
    dxCount.set(key, entry);
  }
  const diagnosticosFrecuentes: DiagnosticoFrecuencia[] = Array.from(
    dxCount.values(),
  )
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((v) => ({ label: v.label, count: v.count }));

  // ---------------- coOcurrencias ----------------
  // Agrupa por paciente_iniciales (mejor por paciente_id si lo tuviéramos
  // siempre, pero iniciales+edad es una proxy razonable).
  const dxsPorPaciente = new Map<string, Set<string>>();
  function pacienteKey(
    iniciales: string | null,
    edad: number | null,
  ): string | null {
    if (!iniciales) return null;
    return `${iniciales.toUpperCase().trim()}|${edad ?? "?"}`;
  }
  for (const d of difs) {
    const pk = pacienteKey(d.paciente_iniciales, d.paciente_edad);
    const raw = d.medico_diagnostico_principal?.trim();
    if (!pk || !raw) continue;
    const set = dxsPorPaciente.get(pk) ?? new Set<string>();
    set.add(normalizeLabel(raw));
    dxsPorPaciente.set(pk, set);
  }
  for (const r of recetas) {
    const pk = pacienteKey(r.paciente_iniciales, null);
    const raw = r.diagnostico?.trim();
    if (!pk || !raw) continue;
    const set = dxsPorPaciente.get(pk) ?? new Set<string>();
    set.add(normalizeLabel(raw));
    dxsPorPaciente.set(pk, set);
  }
  const pairCount = new Map<string, { a: string; b: string; count: number }>();
  // Para cada paciente con ≥2 dx, contar pares ordenados alfabéticamente
  for (const dxsSet of dxsPorPaciente.values()) {
    const dxs = Array.from(dxsSet).sort();
    if (dxs.length < 2) continue;
    for (let i = 0; i < dxs.length; i++) {
      for (let j = i + 1; j < dxs.length; j++) {
        const a = dxs[i]!;
        const b = dxs[j]!;
        const key = `${a}|${b}`;
        const entry = pairCount.get(key) ?? { a, b, count: 0 };
        entry.count += 1;
        pairCount.set(key, entry);
      }
    }
  }
  // Para mostrar bonito, mapeamos de vuelta a labels originales
  function originalLabel(norm: string): string {
    const found = dxCount.get(norm);
    return found?.label ?? norm;
  }
  const coOcurrencias: CoOcurrenciaEntry[] = Array.from(pairCount.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((p) => ({
      dxA: originalLabel(p.a),
      dxB: originalLabel(p.b),
      count: p.count,
    }));

  // ---------------- ppvPersonal ----------------
  const ppvMap = new Map<
    string,
    {
      label: string;
      total: number;
      confirmados: number;
      refutados: number;
      parciales: number;
    }
  >();
  for (const d of difs) {
    const top = d.top_diagnoses?.[0];
    if (!top) continue;
    const entry = ppvMap.get(top.disease) ?? {
      label: top.label,
      total: 0,
      confirmados: 0,
      refutados: 0,
      parciales: 0,
    };
    entry.total += 1;
    if (d.outcome_confirmado === "confirmado") entry.confirmados += 1;
    if (d.outcome_confirmado === "refutado") entry.refutados += 1;
    if (d.outcome_confirmado === "parcial") entry.parciales += 1;
    ppvMap.set(top.disease, entry);
  }
  const ppvPersonal: PpvPersonalEntry[] = Array.from(ppvMap.entries())
    .filter(([, v]) => v.total >= 2)
    .map(([disease, v]) => {
      const denom = v.confirmados + v.refutados + v.parciales;
      return {
        disease,
        label: v.label,
        total: v.total,
        confirmados: v.confirmados,
        refutados: v.refutados,
        parciales: v.parciales,
        ppv: denom === 0 ? 0 : v.confirmados / denom,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // ---------------- overridePatterns ----------------
  const overrideMap = new Map<
    string,
    { motor: string; medico: string; count: number; razones: string[] }
  >();
  for (const d of difs) {
    const override = d.override_razonamiento?.trim();
    const motorTop = d.top_diagnoses?.[0]?.label?.trim();
    const medicoDx = d.medico_diagnostico_principal?.trim();
    if (!override || !motorTop || !medicoDx) continue;
    const motorN = normalizeLabel(motorTop);
    const medicoN = normalizeLabel(medicoDx);
    if (motorN === medicoN) continue;
    const key = `${motorN}->${medicoN}`;
    const entry = overrideMap.get(key) ?? {
      motor: motorTop,
      medico: medicoDx,
      count: 0,
      razones: [],
    };
    entry.count += 1;
    if (entry.razones.length < 3 && override.length > 8) {
      const trimmed = override.slice(0, 140);
      if (!entry.razones.includes(trimmed)) entry.razones.push(trimmed);
    }
    overrideMap.set(key, entry);
  }
  const overridePatterns: OverridePatternEntry[] = Array.from(
    overrideMap.values(),
  )
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((o) => ({
      motorPropuso: o.motor,
      medicoEligio: o.medico,
      count: o.count,
      razones: o.razones,
    }));

  // ---------------- loopCalidad ----------------
  const conOutcome = difs.filter(
    (d) => d.outcome_confirmado && d.outcome_confirmado !== "pendiente",
  ).length;
  const conDx = difs.filter(
    (d) => (d.medico_diagnostico_principal ?? "").trim().length > 0,
  ).length;
  const overrides = difs.filter(
    (d) => (d.override_razonamiento ?? "").trim().length > 0,
  ).length;
  const ahora = Date.now();
  const pendientesRecordatorio = difs.filter(
    (d) =>
      !d.outcome_confirmado &&
      (d.medico_diagnostico_principal ?? "").trim().length > 0 &&
      ahora - new Date(d.created_at).getTime() > 7 * 24 * 60 * 60 * 1000,
  ).length;
  const latencias = difs
    .filter((d) => d.outcome_confirmado_at)
    .map(
      (d) =>
        (new Date(d.outcome_confirmado_at as string).getTime() -
          new Date(d.created_at).getTime()) /
        (1000 * 60 * 60 * 24),
    )
    .filter((n) => Number.isFinite(n) && n >= 0);
  const latenciaPromedioDias =
    latencias.length === 0
      ? null
      : Math.round(
          (latencias.reduce((s, v) => s + v, 0) / latencias.length) * 10,
        ) / 10;

  return {
    total,
    diagnosticosFrecuentes,
    coOcurrencias,
    ppvPersonal,
    overridePatterns,
    loop: {
      total,
      conOutcome,
      conDx,
      overrides,
      pendientesRecordatorio,
      latenciaPromedioDias,
    },
    hasEnoughData: total >= MIN_CASES_FOR_PATTERNS,
  };
}

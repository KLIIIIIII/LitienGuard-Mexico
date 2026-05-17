/**
 * Sprint Z-β — Engine detector de cruces clínicos multivariable.
 *
 * Función pura: recibe la lista de diagnósticos confirmados del paciente
 * + contexto opcional, devuelve los cruces aplicables del catálogo
 * curado en `cruces-clinicos.ts`.
 *
 * Filosofía:
 *   - SIN I/O. Sin Supabase, sin descifrado, sin LLM. Todo eso vive en
 *     la capa de surface (Sprint γ/ε).
 *   - Idempotente y determinístico — mismo input → mismo output.
 *   - Testeable con Vitest sin mocks.
 *
 * Reglas de matching:
 *   1. `diseaseIds` — AND entre arrays externos × OR entre IDs internos.
 *      Si el array externo está vacío, el cruce depende solo del
 *      `contextoRequerido` (caso de cruces basados en findings libres).
 *   2. `contextoRequerido` — todos los filtros aplicados son AND con
 *      el bloque de diseaseIds.
 *   3. `workflowsAplicables` — si el contexto trae un workflow y el
 *      cruce no es "todos", el workflow debe estar en la lista.
 *
 * Defensa contra data buggy:
 *   - Si un cruce tiene `diseaseIds: []` Y ningún filtro de contexto,
 *     NO se dispara (fail closed — sería bug del catálogo).
 */

import {
  CRUCES_CLINICOS,
  type CruceClinico,
  type SeveridadCruce,
} from "./cruces-clinicos";
import type { DiseaseId } from "./types";
import type { ModuloHospital } from "../modulos-eventos";

// ---------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------

export interface DetectorContext {
  /** Workflow operacional donde se ejecuta la detección */
  workflow?: ModuloHospital;
  /** Estado de embarazo del paciente, si conocido */
  embarazo?: boolean;
  /** Edad en años del paciente, si conocida */
  edad?: number;
  /**
   * Snippets clínicos en texto libre del paciente.
   * Ej. ["EPOC moderado", "TFG 45 mL/min", "valproato 500 mg c/12h"]
   * El detector busca los `findingsAny` de cada cruce como substring
   * case-insensitive sobre estos snippets.
   */
  findingsLibres?: string[];
}

export interface CruceDetectado {
  cruce: CruceClinico;
  /** Razones por las que el cruce matched — útil para debugging UI */
  motivosMatch: string[];
}

// ---------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------

function normalizarTexto(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * ¿Tiene el cruce al menos UN criterio efectivo (dx o filtro de contexto
 * no trivial)? Evita disparos falsos por catálogo mal formado.
 */
function tieneCriterioEfectivo(c: CruceClinico): boolean {
  const tieneDx = c.diseaseIds.some((grupo) => grupo.length > 0);
  const ctx = c.contextoRequerido;
  const tieneCtx =
    !!ctx &&
    ((ctx.findingsAny?.length ?? 0) > 0 ||
      ctx.embarazo !== undefined ||
      ctx.edadMin !== undefined ||
      ctx.edadMax !== undefined);
  return tieneDx || tieneCtx;
}

function matchDxs(
  cruce: CruceClinico,
  activos: Set<DiseaseId>,
): { ok: boolean; idsMatched: DiseaseId[] } {
  const matched: DiseaseId[] = [];
  for (const grupo of cruce.diseaseIds) {
    if (grupo.length === 0) continue; // grupo vacío = sin restricción
    const hit = grupo.find((id) => activos.has(id));
    if (!hit) return { ok: false, idsMatched: matched };
    matched.push(hit);
  }
  return { ok: true, idsMatched: matched };
}

function matchContexto(
  cruce: CruceClinico,
  ctx: DetectorContext,
): { ok: boolean; reasons: string[] } {
  const req = cruce.contextoRequerido;
  if (!req) return { ok: true, reasons: [] };

  const reasons: string[] = [];

  if (req.embarazo === true) {
    if (ctx.embarazo !== true) return { ok: false, reasons };
    reasons.push("embarazo confirmado");
  }
  if (req.embarazo === false) {
    if (ctx.embarazo !== false) return { ok: false, reasons };
    reasons.push("estado no embarazo");
  }

  if (req.edadMin !== undefined) {
    if (ctx.edad === undefined || ctx.edad < req.edadMin) {
      return { ok: false, reasons };
    }
    reasons.push(`edad ≥ ${req.edadMin}`);
  }
  if (req.edadMax !== undefined) {
    if (ctx.edad === undefined || ctx.edad > req.edadMax) {
      return { ok: false, reasons };
    }
    reasons.push(`edad ≤ ${req.edadMax}`);
  }

  if (req.findingsAny && req.findingsAny.length > 0) {
    const haystack = (ctx.findingsLibres ?? []).map(normalizarTexto);
    if (haystack.length === 0) return { ok: false, reasons };
    const hit = req.findingsAny.find((needle) => {
      const n = normalizarTexto(needle);
      return haystack.some((s) => s.includes(n));
    });
    if (!hit) return { ok: false, reasons };
    reasons.push(`finding "${hit}"`);
  }

  return { ok: true, reasons };
}

function matchWorkflow(
  cruce: CruceClinico,
  ctx: DetectorContext,
): boolean {
  if (!ctx.workflow) return true;
  if (cruce.workflowsAplicables === "todos") return true;
  return cruce.workflowsAplicables.includes(ctx.workflow);
}

// ---------------------------------------------------------------
// API pública
// ---------------------------------------------------------------

/**
 * Detecta cruces clínicos aplicables a un paciente.
 *
 * @param diseaseIdsActivos diagnósticos confirmados del paciente
 * @param contexto contexto opcional (workflow, embarazo, edad, findings)
 * @returns lista de cruces detectados con motivos del match
 */
export function detectarCrucesActivos(
  diseaseIdsActivos: readonly DiseaseId[],
  contexto: DetectorContext = {},
): CruceDetectado[] {
  const activos = new Set<DiseaseId>(diseaseIdsActivos);
  const detectados: CruceDetectado[] = [];

  for (const cruce of CRUCES_CLINICOS) {
    if (!tieneCriterioEfectivo(cruce)) continue;

    const dxMatch = matchDxs(cruce, activos);
    if (!dxMatch.ok) continue;

    const ctxMatch = matchContexto(cruce, contexto);
    if (!ctxMatch.ok) continue;

    if (!matchWorkflow(cruce, contexto)) continue;

    const motivosMatch: string[] = [
      ...dxMatch.idsMatched.map((id) => `dx confirmado: ${id}`),
      ...ctxMatch.reasons,
    ];

    detectados.push({ cruce, motivosMatch });
  }

  return ordenarPorSeveridad(detectados);
}

/**
 * Ordena cruces detectados por severidad descendente (crítica primero)
 * y por nombre alfabético para empates.
 */
function ordenarPorSeveridad(arr: CruceDetectado[]): CruceDetectado[] {
  const rank: Record<SeveridadCruce, number> = {
    critica: 0,
    importante: 1,
    informativa: 2,
  };
  return [...arr].sort((a, b) => {
    const r = rank[a.cruce.severidad] - rank[b.cruce.severidad];
    if (r !== 0) return r;
    return a.cruce.nombre.localeCompare(b.cruce.nombre, "es");
  });
}

// ---------------------------------------------------------------
// Helper para Sprint γ — agregar cruces de varios pacientes
// ---------------------------------------------------------------

/**
 * Acumula cuántos cruces de cada severidad están activos a través de
 * una lista de detecciones (por paciente). Útil para el KPI del hub.
 */
export function agregarPorSeveridad(
  detecciones: CruceDetectado[],
): Record<SeveridadCruce, number> {
  const acc: Record<SeveridadCruce, number> = {
    critica: 0,
    importante: 0,
    informativa: 0,
  };
  for (const d of detecciones) acc[d.cruce.severidad] += 1;
  return acc;
}

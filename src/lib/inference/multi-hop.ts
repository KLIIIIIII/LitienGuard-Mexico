/**
 * D7 — Multi-hop reasoning con citas cruzadas.
 *
 * Encadena razonamiento clínico en pasos verificables:
 *
 *   HOP 1 — Diagnóstico:
 *     Findings extraídos → motor bayesiano → top 3 dx con posterior
 *
 *   HOP 2 — Evidencia:
 *     Para cada dx → cerebro retrieve (hybrid BM25+vector) → guías
 *     clínicas relevantes con cita verbatim
 *
 *   HOP 3 — Manejo:
 *     Para cada dx → farmacos-mx.ts → fármacos Cuadro Básico
 *     correspondientes con presentación IMSS, alertas y cobertura
 *
 * El resultado es un árbol de razonamiento que el médico revisa paso
 * a paso. Cada nodo cita su fuente — el motor NO inventa.
 */

import { searchCerebroHybrid } from "@/lib/bm25";
import {
  farmacosParaDiagnostico,
  type FarmacoMx,
} from "./farmacos-mx";

interface DxInput {
  id: string;
  label: string;
  posterior: number;
}

export interface MultiHopGuidelineCitation {
  source: string;
  page: string;
  title: string;
  snippet: string;
  score: number;
}

export interface MultiHopDxNode {
  dx: DxInput;
  /** Hop 2 — citas verbatim del cerebro relacionadas a este dx */
  guidelines: MultiHopGuidelineCitation[];
  /** Hop 3 — fármacos Cuadro Básico para este dx */
  farmacos: FarmacoMx[];
  /** Hop 3 — fármacos fuera de Cuadro Básico (paciente paga privado) */
  farmacosFueraCB: FarmacoMx[];
}

export interface MultiHopResult {
  chain: MultiHopDxNode[];
  latencyMs: number;
}

/**
 * Ejecuta el pipeline multi-hop sobre los top N dx del diferencial
 * bayesiano. Best-effort: si un hop falla, los demás continúan.
 */
export async function multiHopReasoning(
  topDx: DxInput[],
  options: { maxDx?: number; guidelinesPerDx?: number } = {},
): Promise<MultiHopResult> {
  const maxDx = options.maxDx ?? 3;
  const guidelinesPerDx = options.guidelinesPerDx ?? 2;
  const t0 = Date.now();

  const dxToProcess = topDx.slice(0, maxDx);

  const chain: MultiHopDxNode[] = await Promise.all(
    dxToProcess.map(async (dx) => {
      // HOP 2 — guías clínicas (best-effort)
      let guidelines: MultiHopGuidelineCitation[] = [];
      try {
        const hits = await searchCerebroHybrid(dx.label, guidelinesPerDx);
        guidelines = hits.map((h) => ({
          source: h.doc.source,
          page: h.doc.page,
          title: h.doc.title,
          snippet: h.snippet,
          score: Number(h.score.toFixed(3)),
        }));
      } catch (e) {
        console.warn(`[multi-hop] guidelines failed for ${dx.id}:`, e);
      }

      // HOP 3 — fármacos del Cuadro Básico
      const allFarmacos = farmacosParaDiagnostico(dx.id);
      const farmacos = allFarmacos.filter((f) => f.cuadroBasico);
      const farmacosFueraCB = allFarmacos.filter((f) => !f.cuadroBasico);

      return {
        dx,
        guidelines,
        farmacos,
        farmacosFueraCB,
      };
    }),
  );

  return {
    chain,
    latencyMs: Date.now() - t0,
  };
}

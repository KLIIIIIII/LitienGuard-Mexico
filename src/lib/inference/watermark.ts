/**
 * Watermark forense del knowledge-base de inferencia.
 *
 * Por cada deploy de producción aplicamos una perturbación determinística
 * micro al 4º-5º decimal de dos LRs del catálogo. Si los LRs se filtran a
 * otra plataforma con exactamente estos decimales raros, tenemos prueba
 * forense de origen.
 *
 * Determinismo: el `seed` (VERCEL_GIT_COMMIT_SHA en producción) decide qué
 * LRs perturbar y con qué magnitud. Sin seed (dev/preview/local) los LRs
 * originales pasan sin tocar — no queremos branching de respuestas entre
 * deploys de preview.
 *
 * Magnitud clínicamente irrelevante: agregar 0.00001 a un LR de 12.0 mueve
 * el log-odds en <1e-6 — invisible para el motor bayesiano y para el
 * médico, pero distintivo en un dump del cerebro.
 *
 * Recuperación forense: `describeWatermark(lrs, seed)` reconstruye qué
 * perturbaciones se aplicaron dado un seed conocido. Cruza con el dump
 * sospechoso → prueba de copia.
 */

import type { LikelihoodRatio } from "./types";

const WATERMARK_SLOTS = 2;
const MIN_SEED_LENGTH = 4;

function djb2Hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

export interface WatermarkPerturbation {
  slot: number;
  index: number;
  finding: string;
  disease: string;
  field: "lrPlus" | "lrMinus";
  original: number;
  watermarked: number;
  delta: number;
}

export interface WatermarkApplication {
  seed: string;
  perturbations: WatermarkPerturbation[];
}

function planSlot(
  seed: string,
  slot: number,
  lrs: readonly LikelihoodRatio[],
): { index: number; field: "lrPlus" | "lrMinus"; delta: number } {
  const slotHash = djb2Hash(`${seed}:${slot}`);
  const index = slotHash % lrs.length;
  const field: "lrPlus" | "lrMinus" =
    (slotHash & 1) === 0 ? "lrPlus" : "lrMinus";
  // Delta in [1e-5, 99e-5] — never zero, always sub-clinical.
  const delta = (((slotHash >>> 16) % 99) + 1) / 100_000;
  return { index, field, delta };
}

/**
 * Aplica watermark forense al array de LRs sin mutar el original.
 * Si `seed` es nulo/corto, devuelve copia 1:1 (dev/preview).
 */
export function applyWatermark(
  lrs: readonly LikelihoodRatio[],
  seed: string | undefined | null,
): LikelihoodRatio[] {
  const out = lrs.map((lr) => ({ ...lr }));
  if (!seed || seed.length < MIN_SEED_LENGTH) return out;

  for (let slot = 0; slot < WATERMARK_SLOTS; slot++) {
    const { index, field, delta } = planSlot(seed, slot, out);
    const before = out[index][field];
    out[index] = {
      ...out[index],
      [field]: Number((before + delta).toFixed(6)),
    };
  }
  return out;
}

/**
 * Describe el plan de perturbaciones que `applyWatermark` produciría con
 * el `seed` dado, contra los LRs originales. Para análisis forense.
 */
export function describeWatermark(
  lrs: readonly LikelihoodRatio[],
  seed: string | undefined | null,
): WatermarkApplication | null {
  if (!seed || seed.length < MIN_SEED_LENGTH) return null;

  const perturbations: WatermarkPerturbation[] = [];
  for (let slot = 0; slot < WATERMARK_SLOTS; slot++) {
    const { index, field, delta } = planSlot(seed, slot, lrs);
    const original = lrs[index][field];
    perturbations.push({
      slot,
      index,
      finding: lrs[index].finding,
      disease: lrs[index].disease,
      field,
      original,
      watermarked: Number((original + delta).toFixed(6)),
      delta,
    });
  }
  return { seed, perturbations };
}

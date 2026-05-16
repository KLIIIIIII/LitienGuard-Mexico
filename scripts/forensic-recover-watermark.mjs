#!/usr/bin/env node
/**
 * Recupera el plan de perturbaciones del watermark forense de inferencia
 * dado un seed conocido (típicamente el VERCEL_GIT_COMMIT_SHA del deploy
 * sospechoso de leak).
 *
 * Uso:
 *   node scripts/forensic-recover-watermark.mjs <seed>
 *
 * Ejemplo:
 *   node scripts/forensic-recover-watermark.mjs 7a3f9e2b
 *
 * Output: tabla con los LRs perturbados, sus valores originales, los
 * watermarked, y el delta — para cruzar contra el dump filtrado.
 *
 * NOTA: este script importa el knowledge-base TypeScript directamente.
 * Requiere tener `pnpm tsx` instalado o ejecutarse como:
 *   pnpm exec tsx scripts/forensic-recover-watermark.mjs <seed>
 */

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const seed = process.argv[2];
  if (!seed) {
    console.error("Uso: node scripts/forensic-recover-watermark.mjs <seed>");
    process.exit(1);
  }

  // Importa los módulos de TS via loader (tsx requerido)
  const watermarkUrl = pathToFileURL(
    path.resolve(__dirname, "../src/lib/inference/watermark.ts"),
  ).href;
  const kbUrl = pathToFileURL(
    path.resolve(__dirname, "../src/lib/inference/knowledge-base.ts"),
  ).href;

  /** @type {typeof import("../src/lib/inference/watermark.ts")} */
  const { describeWatermark } = await import(watermarkUrl);
  // Importamos LIKELIHOOD_RATIOS exportado, que en este proceso (sin
  // VERCEL_GIT_COMMIT_SHA) viene sin watermark — son los originales.
  const kb = await import(kbUrl);
  const originals = kb.LIKELIHOOD_RATIOS;

  const plan = describeWatermark(originals, seed);
  if (!plan) {
    console.error("Seed inválido o demasiado corto.");
    process.exit(1);
  }

  console.log(`\nWatermark forense — seed: ${plan.seed}\n`);
  console.log(
    "Si encuentras estos decimales exactos en un dump externo, es prueba forense de origen:\n",
  );

  for (const p of plan.perturbations) {
    console.log(`Slot ${p.slot}`);
    console.log(`  Finding:    ${p.finding}`);
    console.log(`  Disease:    ${p.disease}`);
    console.log(`  Campo:      ${p.field}`);
    console.log(`  Original:   ${p.original}`);
    console.log(`  Watermark:  ${p.watermarked}`);
    console.log(`  Delta:      +${p.delta}`);
    console.log();
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});

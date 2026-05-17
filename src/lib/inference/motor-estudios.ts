/**
 * K1 — Motor de matching de patrones multi-estudio.
 *
 * Toma la lista de estudios + resultados ingresados por el médico y
 * devuelve patrones canónicos que aplican (parcial o completamente).
 *
 * Algoritmo:
 *   1. Por cada patrón, calcula qué % de estudios clave están presentes
 *      con hallazgo positivo
 *   2. Distingue requeridos (peso alto) vs complementarios (peso bajo)
 *   3. Ranking por score combinado
 *   4. Filtra los que pasan umbral mínimo
 *
 * El motor NO diagnostica — sugiere patrones para que el médico decida.
 */

import {
  PATRONES_MULTI_ESTUDIO,
  type PatronMultiEstudio,
} from "./patrones-multi-estudio";

/**
 * Estado de un estudio ingresado por el médico.
 */
export interface EstudioIngresado {
  estudioId: string;
  /** Si el hallazgo esperado del patrón está presente en este estudio */
  hallazgoPresente: boolean;
  /** Texto libre que el médico escribió como resultado (opcional) */
  resultadoTexto?: string;
}

/**
 * Cobertura del patrón con los estudios ingresados.
 */
export interface PatronCobertura {
  patron: PatronMultiEstudio;
  /** % de estudios requeridos con hallazgo positivo */
  requeridosCubiertos: number;
  /** % de estudios complementarios con hallazgo positivo */
  complementariosCubiertos: number;
  /** Score combinado 0-100 */
  score: number;
  /** Estudios que apoyan el patrón */
  estudiosFavorables: Array<{
    estudioId: string;
    hallazgoEsperado: string;
    requerido: boolean;
  }>;
  /** Estudios del patrón que aún no se han evaluado */
  estudiosFaltantes: Array<{
    estudioId: string;
    hallazgoEsperado: string;
    requerido: boolean;
  }>;
}

const PESO_REQUERIDO = 0.75;
const PESO_COMPLEMENTARIO = 0.25;
const SCORE_MINIMO = 25;

/**
 * Para cada patrón canónico, calcula qué tanto coincide con los
 * estudios que el médico ya tiene + ingresó.
 *
 * Devuelve TOP N patrones rankeados, omitiendo los que no llegan al
 * score mínimo.
 */
export function evaluarPatrones(
  estudiosIngresados: EstudioIngresado[],
  topN: number = 5,
): PatronCobertura[] {
  const mapaIngresados = new Map<string, EstudioIngresado>();
  for (const e of estudiosIngresados) {
    mapaIngresados.set(e.estudioId, e);
  }

  const resultados: PatronCobertura[] = [];

  for (const patron of PATRONES_MULTI_ESTUDIO) {
    const requeridos = patron.estudiosClave.filter((e) => e.requerido);
    const complementarios = patron.estudiosClave.filter((e) => !e.requerido);

    const reqFavorables = requeridos.filter((e) => {
      const ingreso = mapaIngresados.get(e.estudioId);
      return ingreso?.hallazgoPresente === true;
    });

    const compFavorables = complementarios.filter((e) => {
      const ingreso = mapaIngresados.get(e.estudioId);
      return ingreso?.hallazgoPresente === true;
    });

    const pctRequeridos =
      requeridos.length === 0
        ? 100
        : Math.round((reqFavorables.length / requeridos.length) * 100);

    const pctComplementarios =
      complementarios.length === 0
        ? 100
        : Math.round((compFavorables.length / complementarios.length) * 100);

    const score = Math.round(
      pctRequeridos * PESO_REQUERIDO + pctComplementarios * PESO_COMPLEMENTARIO,
    );

    if (score < SCORE_MINIMO) continue;

    const estudiosFavorables = [...reqFavorables, ...compFavorables];
    const estudiosFaltantes = patron.estudiosClave.filter((e) => {
      const ingreso = mapaIngresados.get(e.estudioId);
      return !ingreso || ingreso.hallazgoPresente !== true;
    });

    resultados.push({
      patron,
      requeridosCubiertos: pctRequeridos,
      complementariosCubiertos: pctComplementarios,
      score,
      estudiosFavorables,
      estudiosFaltantes,
    });
  }

  resultados.sort((a, b) => b.score - a.score);
  return resultados.slice(0, topN);
}

/**
 * Dada una sospecha clínica (diseaseId), sugiere los estudios canónicos
 * a pedir basado en los patrones que apuntan a ese dx.
 */
export function sugerirEstudiosParaSospecha(
  diseaseId: string,
): Array<{
  estudioId: string;
  hallazgoEsperado: string;
  requerido: boolean;
  patronRelacionado: string;
}> {
  const patronesAplicables = PATRONES_MULTI_ESTUDIO.filter(
    (p) => p.diagnosticoSugerido === diseaseId,
  );
  if (patronesAplicables.length === 0) return [];

  const conteo = new Map<
    string,
    { hallazgoEsperado: string; requerido: boolean; patronRelacionado: string }
  >();

  for (const patron of patronesAplicables) {
    for (const e of patron.estudiosClave) {
      if (!conteo.has(e.estudioId)) {
        conteo.set(e.estudioId, {
          hallazgoEsperado: e.hallazgoEsperado,
          requerido: e.requerido,
          patronRelacionado: patron.nombre,
        });
      }
    }
  }

  return Array.from(conteo.entries()).map(([estudioId, info]) => ({
    estudioId,
    ...info,
  }));
}

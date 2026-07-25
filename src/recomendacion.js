/**
 * Arma la recomendación final: categoría + Q3 + Q4 → el objeto que se pinta.
 *
 * Regla del brief, y lo que aseguran los tests: Q3 y Q4 NUNCA cambian la
 * categoría. Q3 solo toca el texto de tiempo; Q4 solo toca el de validación.
 * Cada uno tiene su campo y no se mete con el del otro.
 */

import { obtenerCategoria } from './categorias.js';
import { resolverCategoria } from './arbol.js';

/**
 * Nota que se anexa a "cómo validarlo" cuando la persona prefiere colaborar.
 * Copy del prototipo validado en vivo — no se reescribe.
 */
export const NOTA_COLABORADORES =
  '. Como prefieres colaborar, alinea primero con tu equipo quién hace qué antes de escribir código.';

/** Los 7 campos que el brief exige en pantalla, ya renderizados a texto. */
export const CAMPOS_RECOMENDACION = Object.freeze([
  'usuario',
  'problema',
  'resultado',
  'mvp',
  'fuera',
  'tiempo',
  'validacion',
]);

/**
 * El brief: "extremo alto si bajo, extremo bajo si alto". Con pocas horas por
 * semana el trabajo se estira al tope del rango; con muchas, se aprieta al piso.
 */
const TIEMPO_POR_HORAS = {
  bajo: ({ max }) =>
    `${max} días (con menos de 5h/semana, ve con calma hacia el extremo alto)`,
  medio: ({ min, max }) => `${min} a ${max} días`,
  alto: ({ min }) =>
    `${min} días (con más de 10h/semana, puedes apuntar al extremo bajo)`,
};

const VALIDACION_POR_MODO = {
  solo: (validacion) => validacion,
  colaboradores: (validacion) => validacion + NOTA_COLABORADORES,
};

/**
 * @param {object} respuestas
 * @param {string} respuestas.q1 - id de la opción elegida en Q1
 * @param {string|null} respuestas.q2 - id de la opción en la Q2 de esa rama, o null
 * @param {'bajo'|'medio'|'alto'} respuestas.q3
 * @param {'solo'|'colaboradores'} respuestas.q4
 */
export function construirRecomendacion({ q1, q2 = null, q3, q4 }) {
  const formatearTiempo = TIEMPO_POR_HORAS[q3];
  if (!formatearTiempo) {
    throw new Error(`Valor de Q3 desconocido: ${JSON.stringify(q3)}`);
  }

  const ajustarValidacion = VALIDACION_POR_MODO[q4];
  if (!ajustarValidacion) {
    throw new Error(`Valor de Q4 desconocido: ${JSON.stringify(q4)}`);
  }

  // La categoría sale solo de Q1 + Q2. Q3 y Q4 no participan de esta línea.
  const categoria = obtenerCategoria(resolverCategoria(q1, q2));

  return Object.freeze({
    categoria: categoria.id,
    tag: categoria.tag,
    title: categoria.title,
    usuario: categoria.usuario,
    problema: categoria.problema,
    resultado: categoria.resultado,
    mvp: categoria.mvp,
    fuera: categoria.fuera,
    tiempo: formatearTiempo(categoria.tiempoBase),
    validacion: ajustarValidacion(categoria.validacion),
    pasos: categoria.pasos,
  });
}

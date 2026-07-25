/**
 * El árbol de decisión de GPS Imperial.
 *
 * Dato + ruteo puro: cero DOM, cero estado. Quién guarda las respuestas y quién
 * sabe volver atrás es `motor.js`; aquí solo vive "dado esto, ¿qué sigue?".
 *
 * Regla crítica del brief: ninguna pregunta pide el tipo de solución. La
 * categoría siempre se infiere de audiencia (Q1) + necesidad (Q2).
 * Q3 y Q4 se preguntan siempre y NO votan categoría — solo matizan el texto
 * de tiempo y el de validación (ver `recomendacion.js`).
 */

const congelarPregunta = (pregunta) =>
  Object.freeze({
    ...pregunta,
    opciones: Object.freeze(pregunta.opciones.map((o) => Object.freeze(o))),
  });

export const PREGUNTAS = Object.freeze({
  Q1: congelarPregunta({
    id: 'Q1',
    texto: '¿Para quién es esto, hoy mismo?',
    opciones: [
      { id: 'mi', label: 'Para mí — lo uso yo mismo', rama: 'Q2_yo' },
      {
        id: 'sector',
        label: 'Para gente de mi mismo oficio o sector',
        categoria: 'D',
      },
      {
        id: 'cliente',
        label: 'Para un cliente o negocio externo que te pagaría',
        rama: 'Q2_cliente',
      },
      {
        id: 'audiencia',
        label: 'Para una audiencia amplia, sin contacto directo todavía',
        rama: 'Q2_audiencia',
      },
    ],
  }),

  Q2_yo: congelarPregunta({
    id: 'Q2_yo',
    texto: 'De lo que haces a mano, ¿qué te quita más tiempo?',
    opciones: [
      {
        id: 'repetitiva',
        label: 'Una tarea repetitiva que podrías automatizar',
        categoria: 'A',
      },
      {
        id: 'informacion',
        label: 'Buscar o cruzar información que tienes dispersa',
        categoria: 'B',
      },
    ],
  }),

  Q2_cliente: congelarPregunta({
    id: 'Q2_cliente',
    texto: '¿Qué necesita ese negocio de ti?',
    opciones: [
      { id: 'clientes', label: 'Conseguir o calificar más clientes', categoria: 'C' },
      {
        id: 'preguntas',
        label: 'Atender preguntas repetidas de sus usuarios',
        categoria: 'E',
      },
      {
        id: 'puntual',
        label: 'Algo puntual y pequeño que pagaría por usar',
        categoria: 'F',
      },
    ],
  }),

  Q2_audiencia: congelarPregunta({
    id: 'Q2_audiencia',
    texto: '¿Qué esperaría esa audiencia de ti?',
    opciones: [
      { id: 'respuestas', label: 'Respuestas rápidas a sus preguntas', categoria: 'E' },
      {
        id: 'organizar',
        label: 'Un lugar para organizar o consultar información',
        categoria: 'B',
      },
    ],
  }),

  Q3: congelarPregunta({
    id: 'Q3',
    texto: '¿Cuántas horas tienes por semana para esto?',
    opciones: [
      { id: 'menos5', label: 'Menos de 5', valor: 'bajo' },
      { id: 'entre5y10', label: 'Entre 5 y 10', valor: 'medio' },
      { id: 'mas10', label: 'Más de 10', valor: 'alto' },
    ],
  }),

  Q4: congelarPregunta({
    id: 'Q4',
    texto: '¿Prefieres trabajar solo o buscar colaboradores?',
    opciones: [
      { id: 'solo', label: 'Solo, algo que pueda terminar yo mismo', valor: 'solo' },
      {
        id: 'colaboradores',
        label: 'Buscando colaboradores que compartan el problema',
        valor: 'colaboradores',
      },
    ],
  }),
});

export const IDS_PREGUNTAS_Q2 = Object.freeze([
  'Q2_yo',
  'Q2_cliente',
  'Q2_audiencia',
]);

export function obtenerPregunta(id) {
  const pregunta = Object.prototype.hasOwnProperty.call(PREGUNTAS, id)
    ? PREGUNTAS[id]
    : undefined;
  if (!pregunta) {
    throw new Error(`Pregunta desconocida: ${JSON.stringify(id)}`);
  }
  return pregunta;
}

export function obtenerOpcion(idPregunta, idOpcion) {
  const opcion = obtenerPregunta(idPregunta).opciones.find(
    (o) => o.id === idOpcion,
  );
  if (!opcion) {
    throw new Error(
      `Opción desconocida ${JSON.stringify(idOpcion)} en ${idPregunta}`,
    );
  }
  return opcion;
}

/**
 * Qué Q2 toca después de Q1, o `null` si esa respuesta ya define la categoría
 * (la rama "sector", que salta directo a Q3).
 */
export function ramaTrasQ1(idOpcionQ1) {
  return obtenerOpcion('Q1', idOpcionQ1).rama ?? null;
}

/**
 * La única función que decide categoría. `respuestaQ2` es `null` en la rama
 * que no tiene Q2. Cualquier combinación incoherente revienta: nunca se cae
 * en una categoría por defecto en silencio.
 */
export function resolverCategoria(respuestaQ1, respuestaQ2) {
  const opcionQ1 = obtenerOpcion('Q1', respuestaQ1);
  const rama = opcionQ1.rama ?? null;

  if (rama === null) {
    if (respuestaQ2 !== null && respuestaQ2 !== undefined) {
      throw new Error(
        `La rama "${respuestaQ1}" no tiene segunda pregunta, pero llegó ${JSON.stringify(respuestaQ2)}`,
      );
    }
    return opcionQ1.categoria;
  }

  if (respuestaQ2 === null || respuestaQ2 === undefined) {
    throw new Error(`Falta la respuesta de ${rama} para la rama "${respuestaQ1}"`);
  }

  return obtenerOpcion(rama, respuestaQ2).categoria;
}

/** Las 8 rutas hoja del árbol, en el orden en que aparecen las opciones. */
export const RUTAS_HOJA = Object.freeze(
  PREGUNTAS.Q1.opciones.flatMap((opcionQ1) => {
    if (!opcionQ1.rama) {
      return [
        Object.freeze({ q1: opcionQ1.id, q2: null, categoria: opcionQ1.categoria }),
      ];
    }
    return PREGUNTAS[opcionQ1.rama].opciones.map((opcionQ2) =>
      Object.freeze({
        q1: opcionQ1.id,
        q2: opcionQ2.id,
        categoria: opcionQ2.categoria,
      }),
    );
  }),
);

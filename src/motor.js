/**
 * La máquina de estados del diagnóstico: qué pantalla toca, qué se respondió,
 * y cómo volver atrás.
 *
 * Sigue sin conocer el DOM. Por eso el botón "volver" —que es lógica de
 * navegación, no de pintura— se puede testear sin navegador: `web/app.js`
 * solo llama a `volver()` y repinta lo que este motor diga.
 *
 * El historial guarda una instantánea del estado ANTES de aplicar cada
 * respuesta. Así, volver no solo cambia de pantalla: deshace la respuesta.
 * Eso es lo que impide que cambiar Q1 deje pegada una Q2 de la rama anterior.
 */

import { PREGUNTAS, obtenerOpcion, ramaTrasQ1 } from './arbol.js';
import { construirRecomendacion } from './recomendacion.js';

export const PANTALLA_RESULTADO = 'RESULTADO';

/** La rama "sector" salta Q2, así que su diagnóstico son 3 preguntas, no 4. */
const PASOS_RAMA_CORTA = 3;
const PASOS_RAMA_LARGA = 4;

const estadoInicial = () => ({
  pantalla: 'Q1',
  respuestas: { q1: null, q2: null, q3: null, q4: null },
  secuencia: [],
});

const clonar = (estado) => ({
  pantalla: estado.pantalla,
  respuestas: { ...estado.respuestas },
  secuencia: [...estado.secuencia],
});

export function crearMotor() {
  let estado = estadoInicial();
  let historial = [];

  const terminado = () => estado.pantalla === PANTALLA_RESULTADO;

  /**
   * Aplica una respuesta y devuelve el estado siguiente.
   * No muta nada: si algo revienta a mitad de camino, el estado actual queda
   * intacto y el historial no se ensucia.
   */
  function siguienteEstado(idOpcion) {
    const opcion = obtenerOpcion(estado.pantalla, idOpcion);
    const siguiente = clonar(estado);
    siguiente.secuencia.push(estado.pantalla);

    switch (estado.pantalla) {
      case 'Q1': {
        siguiente.respuestas.q1 = idOpcion;
        const rama = ramaTrasQ1(idOpcion);
        siguiente.respuestas.q2 = null;
        siguiente.pantalla = rama ?? 'Q3';
        break;
      }
      case 'Q3':
        siguiente.respuestas.q3 = opcion.valor;
        siguiente.pantalla = 'Q4';
        break;
      case 'Q4':
        siguiente.respuestas.q4 = opcion.valor;
        siguiente.pantalla = PANTALLA_RESULTADO;
        break;
      default:
        // Las tres ramas Q2_*: siempre desembocan en Q3.
        siguiente.respuestas.q2 = idOpcion;
        siguiente.pantalla = 'Q3';
        break;
    }

    return siguiente;
  }

  return {
    estado() {
      const totalPasos =
        estado.respuestas.q1 !== null && ramaTrasQ1(estado.respuestas.q1) === null
          ? PASOS_RAMA_CORTA
          : PASOS_RAMA_LARGA;

      return Object.freeze({
        pantalla: estado.pantalla,
        pregunta: terminado() ? null : PREGUNTAS[estado.pantalla],
        paso: terminado() ? null : estado.secuencia.length + 1,
        totalPasos,
        puedeVolver: historial.length > 0,
        terminado: terminado(),
        respuestas: Object.freeze({ ...estado.respuestas }),
      });
    },

    /** Los ids de las preguntas ya respondidas, en orden. */
    preguntasHechas() {
      return [...estado.secuencia];
    },

    responder(idOpcion) {
      if (terminado()) {
        throw new Error('El diagnóstico ya terminó: reinicia o vuelve atrás.');
      }
      const siguiente = siguienteEstado(idOpcion);
      historial.push(clonar(estado));
      estado = siguiente;
      return this.estado();
    },

    /** @returns {boolean} si de verdad se pudo volver. */
    volver() {
      if (historial.length === 0) return false;
      estado = historial.pop();
      return true;
    },

    reiniciar() {
      estado = estadoInicial();
      historial = [];
    },

    /** La recomendación final, o `null` si el diagnóstico sigue en curso. */
    resultado() {
      if (!terminado()) return null;
      return construirRecomendacion(estado.respuestas);
    },
  };
}

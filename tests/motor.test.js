import { describe, it, expect } from 'vitest';
import { crearMotor, PANTALLA_RESULTADO } from '../src/motor.js';
import { RUTAS_HOJA, PREGUNTAS } from '../src/arbol.js';

const HORAS = { bajo: 'menos5', medio: 'entre5y10', alto: 'mas10' };
const MODOS = { solo: 'solo', colaboradores: 'colaboradores' };

/** Recorre una ruta completa y devuelve el motor listo para consultarse. */
function recorrer(ruta, q3, q4) {
  const motor = crearMotor();
  motor.responder(ruta.q1);
  if (ruta.q2) motor.responder(ruta.q2);
  motor.responder(HORAS[q3]);
  motor.responder(MODOS[q4]);
  return motor;
}

const rutaComoNombre = (r) => `${r.q1}${r.q2 ? '+' + r.q2 : ''}`;

const combinaciones = RUTAS_HOJA.flatMap((ruta) =>
  Object.keys(HORAS).flatMap((q3) =>
    Object.keys(MODOS).map((q4) => [
      `${rutaComoNombre(ruta)} · ${q3} · ${q4}`,
      ruta,
      q3,
      q4,
    ]),
  ),
);

describe('motor', () => {
  it('arranca en Q1, sin respuestas y sin poder volver', () => {
    const motor = crearMotor();
    const estado = motor.estado();
    expect(estado.pantalla).toBe('Q1');
    expect(estado.pregunta.id).toBe('Q1');
    expect(estado.paso).toBe(1);
    expect(estado.puedeVolver).toBe(false);
    expect(estado.terminado).toBe(false);
    expect(motor.resultado()).toBeNull();
  });

  // Test 13 — el requisito grande del brief
  describe('las 48 combinaciones Q1×Q2×Q3×Q4', () => {
    it('son exactamente 48', () => {
      expect(combinaciones).toHaveLength(48);
    });

    it.each(combinaciones)('%s termina en la categoría correcta', (_n, ruta, q3, q4) => {
      const motor = recorrer(ruta, q3, q4);
      const estado = motor.estado();
      const resultado = motor.resultado();

      expect(estado.terminado).toBe(true);
      expect(estado.pantalla).toBe(PANTALLA_RESULTADO);
      expect(resultado).not.toBeNull();
      expect(resultado).toBeDefined();
      expect(resultado.categoria).toBe(ruta.categoria);
    });

    it.each(combinaciones)('%s nunca queda sin resultado', (_n, ruta, q3, q4) => {
      const resultado = recorrer(ruta, q3, q4).resultado();
      expect(resultado.tag).toBeTruthy();
      expect(resultado.tiempo).toBeTruthy();
      expect(resultado.validacion).toBeTruthy();
      expect(resultado.pasos).toHaveLength(4);
    });
  });

  // Test 14 — ningún estado alcanzable es callejón sin salida
  it('ningún estado alcanzable se queda sin pregunta ni resultado', () => {
    let visitados = 0;

    const explorar = (respuestasPrevias) => {
      const motor = crearMotor();
      for (const r of respuestasPrevias) motor.responder(r);

      const estado = motor.estado();
      visitados += 1;

      if (estado.terminado) {
        expect(estado.pregunta).toBeNull();
        expect(motor.resultado()).not.toBeNull();
        return;
      }

      expect(estado.pregunta).not.toBeNull();
      expect(estado.pregunta.opciones.length).toBeGreaterThan(0);
      expect(motor.resultado()).toBeNull();

      for (const opcion of estado.pregunta.opciones) {
        explorar([...respuestasPrevias, opcion.id]);
      }
    };

    explorar([]);
    // 1 (Q1) + 4 (tras Q1) + 8 rutas × (Q3:1 + Q4:3 + RESULTADO:6)... el número
    // exacto no importa; lo que importa es que se exploró de verdad.
    expect(visitados).toBeGreaterThan(48);
  });

  // Test 15 — la rama sector salta Q2
  it('la rama sector hace exactamente Q1, Q3 y Q4 — y da D', () => {
    const motor = crearMotor();
    motor.responder('sector');
    expect(motor.estado().pantalla).toBe('Q3');

    motor.responder('entre5y10');
    motor.responder('solo');

    expect(motor.preguntasHechas()).toEqual(['Q1', 'Q3', 'Q4']);
    expect(motor.preguntasHechas()).toHaveLength(3);
    expect(motor.resultado().categoria).toBe('D');
  });

  // Test 16 — las otras 3 ramas sí hacen las 4
  it.each(RUTAS_HOJA.filter((r) => r.q2).map((r) => [rutaComoNombre(r), r]))(
    '%s hace las 4 preguntas',
    (_n, ruta) => {
      const motor = recorrer(ruta, 'medio', 'solo');
      const hechas = motor.preguntasHechas();
      expect(hechas).toHaveLength(4);
      expect(hechas[0]).toBe('Q1');
      expect(hechas[1]).toMatch(/^Q2_/);
      expect(hechas.slice(2)).toEqual(['Q3', 'Q4']);
    },
  );

  // Test 17 — el contador de pasos no miente en la rama sector
  describe('total de pasos', () => {
    it('es 3 en la rama sector', () => {
      const motor = crearMotor();
      motor.responder('sector');
      expect(motor.estado().totalPasos).toBe(3);
      expect(motor.estado().paso).toBe(2); // Q3 es el paso 2 de 3
    });

    it('es 4 en las demás ramas', () => {
      const motor = crearMotor();
      motor.responder('mi');
      expect(motor.estado().totalPasos).toBe(4);
      expect(motor.estado().paso).toBe(2); // Q2_yo es el paso 2 de 4
    });

    it('en Q1, antes de saber la rama, asume el camino largo', () => {
      expect(crearMotor().estado().totalPasos).toBe(4);
    });
  });

  describe('volver', () => {
    // Test 18 — el caso que el contador de pasos hacía frágil
    it('desde Q3 en la rama sector regresa a Q1, no a una Q2 inexistente', () => {
      const motor = crearMotor();
      motor.responder('sector');
      expect(motor.estado().pantalla).toBe('Q3');

      expect(motor.volver()).toBe(true);
      expect(motor.estado().pantalla).toBe('Q1');
      expect(motor.estado().respuestas.q1).toBeNull();
    });

    // Test 19 — cambiar Q1 no puede dejar una Q2 vieja pegada
    it('desde Q2 regresa a Q1 y borra la respuesta de Q2', () => {
      const motor = crearMotor();
      motor.responder('mi');
      motor.responder('repetitiva');
      expect(motor.estado().pantalla).toBe('Q3');

      motor.volver();
      expect(motor.estado().pantalla).toBe('Q2_yo');
      expect(motor.estado().respuestas.q2).toBeNull();

      motor.volver();
      expect(motor.estado().pantalla).toBe('Q1');
      expect(motor.estado().respuestas.q1).toBeNull();

      // Y ahora cambiar de rama llega a otra categoría, sin rastro de la anterior
      motor.responder('cliente');
      expect(motor.estado().pantalla).toBe('Q2_cliente');
      motor.responder('puntual');
      motor.responder('entre5y10');
      motor.responder('solo');
      expect(motor.resultado().categoria).toBe('F');
    });

    // Test 20
    it('volver hasta el inicio deja el motor como recién arrancado', () => {
      const motor = crearMotor();
      motor.responder('cliente');
      motor.responder('clientes');
      motor.responder('mas10');

      while (motor.estado().puedeVolver) motor.volver();

      expect(motor.estado()).toEqual(crearMotor().estado());
      expect(motor.preguntasHechas()).toEqual([]);
    });

    // Test 21 — el arreglo: el resultado también tiene volver
    it('desde el resultado regresa a Q4 y permite cambiar la respuesta', () => {
      const motor = crearMotor();
      motor.responder('sector');
      motor.responder('entre5y10');
      motor.responder('solo');

      const antes = motor.resultado().validacion;
      expect(motor.estado().puedeVolver).toBe(true);

      motor.volver();
      expect(motor.estado().pantalla).toBe('Q4');
      expect(motor.estado().terminado).toBe(false);
      expect(motor.resultado()).toBeNull();

      motor.responder('colaboradores');
      const despues = motor.resultado();
      expect(despues.categoria).toBe('D');
      expect(despues.validacion).not.toBe(antes);
      expect(despues.validacion.startsWith(antes)).toBe(true);
    });

    // Test 22
    it('no se puede volver desde Q1, y el motor lo reporta sin reventar', () => {
      const motor = crearMotor();
      expect(motor.estado().puedeVolver).toBe(false);
      expect(motor.volver()).toBe(false);
      expect(motor.estado().pantalla).toBe('Q1');
    });
  });

  // Test 23
  it('reiniciar deja el motor idéntico a recién arrancado', () => {
    const motor = crearMotor();
    motor.responder('audiencia');
    motor.responder('organizar');
    motor.responder('menos5');
    motor.responder('colaboradores');
    expect(motor.estado().terminado).toBe(true);

    motor.reiniciar();

    expect(motor.estado()).toEqual(crearMotor().estado());
    expect(motor.estado().puedeVolver).toBe(false);
    expect(motor.preguntasHechas()).toEqual([]);
    expect(motor.resultado()).toBeNull();
  });

  describe('respuestas inválidas', () => {
    it('rechaza una opción que no pertenece a la pantalla actual', () => {
      const motor = crearMotor();
      expect(() => motor.responder('repetitiva')).toThrow(/opción desconocida/i);
      expect(motor.estado().pantalla).toBe('Q1');
    });

    it('rechaza responder cuando ya terminó', () => {
      const motor = crearMotor();
      motor.responder('sector');
      motor.responder('menos5');
      motor.responder('solo');
      expect(() => motor.responder('solo')).toThrow(/ya terminó/i);
    });

    it('una respuesta rechazada no ensucia el historial', () => {
      const motor = crearMotor();
      motor.responder('mi');
      expect(() => motor.responder('clientes')).toThrow();
      expect(motor.estado().pantalla).toBe('Q2_yo');
      motor.volver();
      expect(motor.estado().pantalla).toBe('Q1');
      expect(motor.estado().puedeVolver).toBe(false);
    });
  });

  it('el estado que expone no se puede mutar desde fuera', () => {
    const motor = crearMotor();
    const estado = motor.estado();
    expect(() => {
      estado.respuestas.q1 = 'sector';
    }).toThrow();
    expect(motor.estado().respuestas.q1).toBeNull();
  });

  it('cada pantalla de pregunta expone la pregunta real del árbol', () => {
    const motor = crearMotor();
    expect(motor.estado().pregunta).toBe(PREGUNTAS.Q1);
    motor.responder('audiencia');
    expect(motor.estado().pregunta).toBe(PREGUNTAS.Q2_audiencia);
  });
});

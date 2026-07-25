import { describe, it, expect } from 'vitest';
import {
  CATEGORIAS,
  IDS_CATEGORIAS,
  CAMPOS_ACCIONABLES,
} from '../src/categorias.js';
import { construirRecomendacion } from '../src/recomendacion.js';
import { RUTAS_HOJA } from '../src/arbol.js';

// Estos campos NO vienen del prototipo: son copy nuevo, añadido para que el
// destino se pueda accionar. Por eso no están en el candado de copy literal de
// categorias.test.js — pero sí tienen que existir, ser propios de cada
// categoría, y sobrevivir a Q3 y Q4 como cualquier otro contenido.

const todas = () => IDS_CATEGORIAS.map((id) => [id, CATEGORIAS[id]]);

describe('campos accionables del destino', () => {
  it('son ejemplo y herramientas', () => {
    expect([...CAMPOS_ACCIONABLES]).toEqual(['ejemplo', 'herramientas']);
  });

  it.each(todas())('%s los tiene, con contenido de verdad', (_id, cat) => {
    for (const campo of CAMPOS_ACCIONABLES) {
      expect(typeof cat[campo]).toBe('string');
      // Un ejemplo concreto no cabe en una línea: si alguien lo recorta a una
      // frase genérica, deja de servir para lo que se añadió.
      expect(cat[campo].trim().length).toBeGreaterThan(120);
    }
  });

  it.each(CAMPOS_ACCIONABLES.map((c) => [c]))(
    'el %s de cada categoría es distinto al de las demás',
    (campo) => {
      const textos = IDS_CATEGORIAS.map((id) => CATEGORIAS[id][campo]);
      expect(new Set(textos).size).toBe(6);
    },
  );

  it('el ejemplo no promete nada que el MVP deje fuera', () => {
    // El ejemplo aterriza el MVP, no lo agranda: si menciona varias fuentes,
    // varios idiomas o planes de pago, contradice el "Lo que queda fuera".
    for (const id of IDS_CATEGORIAS) {
      const { ejemplo } = CATEGORIAS[id];
      expect(ejemplo.toLowerCase()).not.toContain('multi-idioma');
      expect(ejemplo.toLowerCase()).not.toContain('varias fuentes');
    }
  });

  describe('llegan al resultado en las 48 combinaciones', () => {
    const combinaciones = RUTAS_HOJA.flatMap((ruta) =>
      ['bajo', 'medio', 'alto'].flatMap((q3) =>
        ['solo', 'colaboradores'].map((q4) => [
          `${ruta.q1}${ruta.q2 ? '+' + ruta.q2 : ''} · ${q3} · ${q4}`,
          ruta,
          q3,
          q4,
        ]),
      ),
    );

    it.each(combinaciones)('%s trae ejemplo y herramientas', (_n, ruta, q3, q4) => {
      const rec = construirRecomendacion({ ...ruta, q3, q4 });
      for (const campo of CAMPOS_ACCIONABLES) {
        expect(rec[campo]).toBe(CATEGORIAS[ruta.categoria][campo]);
      }
    });
  });

  it('ni Q3 ni Q4 los tocan', () => {
    const ruta = RUTAS_HOJA[0];
    const base = construirRecomendacion({ ...ruta, q3: 'medio', q4: 'solo' });
    for (const q3 of ['bajo', 'medio', 'alto']) {
      for (const q4 of ['solo', 'colaboradores']) {
        const otra = construirRecomendacion({ ...ruta, q3, q4 });
        expect(otra.ejemplo).toBe(base.ejemplo);
        expect(otra.herramientas).toBe(base.herramientas);
      }
    }
  });
});

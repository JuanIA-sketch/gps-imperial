import { describe, it, expect } from 'vitest';
import {
  construirRecomendacion,
  CAMPOS_RECOMENDACION,
} from '../src/recomendacion.js';
import { RUTAS_HOJA } from '../src/arbol.js';
import { CATEGORIAS, IDS_CATEGORIAS } from '../src/categorias.js';

const HORAS = ['bajo', 'medio', 'alto'];
const MODOS = ['solo', 'colaboradores'];

const rutaComoNombre = (r) => `${r.q1}${r.q2 ? '+' + r.q2 : ''}`;
const rutas = RUTAS_HOJA.map((r) => [rutaComoNombre(r), r]);

const sinCampo = (objeto, campo) => {
  const { [campo]: _omitido, ...resto } = objeto;
  return resto;
};

describe('recomendación', () => {
  // Test 24 — requisito explícito del brief
  it.each(rutas)('%s: los 3 valores de Q3 dan la misma categoría', (_n, ruta) => {
    const categorias = HORAS.map(
      (q3) => construirRecomendacion({ ...ruta, q3, q4: 'solo' }).categoria,
    );
    expect(categorias).toEqual([ruta.categoria, ruta.categoria, ruta.categoria]);
  });

  // Test 25 — requisito explícito del brief
  it.each(rutas)('%s: los 2 valores de Q4 dan la misma categoría', (_n, ruta) => {
    const categorias = MODOS.map(
      (q4) => construirRecomendacion({ ...ruta, q3: 'medio', q4 }).categoria,
    );
    expect(categorias).toEqual([ruta.categoria, ruta.categoria]);
  });

  // Test 26 — Q3 sí cambia el texto de tiempo, en las 6 categorías.
  // Cada categoría se alcanza por una ruta real del árbol: nada de puertas
  // traseras para forzar una categoría desde el test.
  describe('Q3 ajusta el tiempo estimado', () => {
    const porCategoria = IDS_CATEGORIAS.map((id) => {
      const ruta = RUTAS_HOJA.find((r) => r.categoria === id);
      return [id, ruta, CATEGORIAS[id]];
    });

    it('las 6 categorías tienen una ruta real que las alcanza', () => {
      expect(porCategoria.every(([, ruta]) => ruta)).toBe(true);
    });

    it.each(porCategoria)('%s: pocas horas → el extremo alto del rango', (_id, ruta, cat) => {
      const rec = construirRecomendacion({ ...ruta, q3: 'bajo', q4: 'solo' });
      expect(rec.tiempo).toBe(
        `${cat.tiempoBase.max} días (con menos de 5h/semana, ve con calma hacia el extremo alto)`,
      );
    });

    // 5-10 h/semana no mueve el rango, pero el texto tiene que reconocer la
    // respuesta: si saliera idéntico a no haber preguntado, Q3 sobraría.
    it.each(porCategoria)('%s: horas medias → el rango completo, y lo dice', (_id, ruta, cat) => {
      const rec = construirRecomendacion({ ...ruta, q3: 'medio', q4: 'solo' });
      expect(rec.tiempo).toBe(
        `${cat.tiempoBase.min} a ${cat.tiempoBase.max} días (tu ritmo estándar, sin ajustes)`,
      );
    });

    it.each(porCategoria)('%s: ninguna respuesta de Q3 deja el texto pelado', (_id, ruta, cat) => {
      const pelado = `${cat.tiempoBase.min} a ${cat.tiempoBase.max} días`;
      for (const q3 of HORAS) {
        const rec = construirRecomendacion({ ...ruta, q3, q4: 'solo' });
        expect(rec.tiempo).not.toBe(pelado);
      }
    });

    it.each(porCategoria)('%s: muchas horas → el extremo bajo del rango', (_id, ruta, cat) => {
      const rec = construirRecomendacion({ ...ruta, q3: 'alto', q4: 'solo' });
      expect(rec.tiempo).toBe(
        `${cat.tiempoBase.min} días (con más de 10h/semana, puedes apuntar al extremo bajo)`,
      );
    });

    it.each(porCategoria)('%s: los 3 textos son distintos entre sí', (_id, ruta) => {
      const textos = HORAS.map(
        (q3) => construirRecomendacion({ ...ruta, q3, q4: 'solo' }).tiempo,
      );
      expect(new Set(textos).size).toBe(3);
    });
  });

  // Test 27 — Q3 no toca nada más
  it.each(rutas)('%s: Q3 no cambia ningún campo salvo el tiempo', (_n, ruta) => {
    const base = construirRecomendacion({ ...ruta, q3: 'medio', q4: 'solo' });
    for (const q3 of HORAS) {
      const otra = construirRecomendacion({ ...ruta, q3, q4: 'solo' });
      expect(sinCampo(otra, 'tiempo')).toEqual(sinCampo(base, 'tiempo'));
    }
  });

  // Test 28 — Q4 con colaboradores anexa la nota DE SU CATEGORÍA, sin perder
  // el texto original
  it.each(rutas)('%s: colaboradores anexa la nota a la validación', (_n, ruta) => {
    const categoria = CATEGORIAS[ruta.categoria];
    const rec = construirRecomendacion({
      ...ruta,
      q3: 'medio',
      q4: 'colaboradores',
    });
    expect(rec.validacion.startsWith(categoria.validacion)).toBe(true);
    expect(rec.validacion).toBe(categoria.validacion + categoria.notaColaboradores);
  });

  it('cada categoría tiene su propia nota de colaboradores, no una genérica', () => {
    const notas = IDS_CATEGORIAS.map((id) => CATEGORIAS[id].notaColaboradores);
    expect(new Set(notas).size).toBe(6);
    for (const nota of notas) {
      expect(nota.startsWith('. ')).toBe(true);
      expect(nota.trim().length).toBeGreaterThan(60);
    }
  });

  // Test 29 — solo deja la validación intacta
  it.each(rutas)('%s: solo deja la validación idéntica', (_n, ruta) => {
    const categoria = CATEGORIAS[ruta.categoria];
    const rec = construirRecomendacion({ ...ruta, q3: 'medio', q4: 'solo' });
    expect(rec.validacion).toBe(categoria.validacion);
    expect(rec.validacion).not.toContain(categoria.notaColaboradores);
  });

  // Test 30 — Q4 no toca nada más
  it.each(rutas)('%s: Q4 no cambia ningún campo salvo la validación', (_n, ruta) => {
    const soloRec = construirRecomendacion({ ...ruta, q3: 'medio', q4: 'solo' });
    const colabRec = construirRecomendacion({
      ...ruta,
      q3: 'medio',
      q4: 'colaboradores',
    });
    expect(sinCampo(colabRec, 'validacion')).toEqual(sinCampo(soloRec, 'validacion'));
  });

  // Test 31 — las 48 combinaciones traen todo lo que la pantalla necesita
  describe('las 48 combinaciones traen la recomendación completa', () => {
    const combinaciones = RUTAS_HOJA.flatMap((ruta) =>
      HORAS.flatMap((q3) =>
        MODOS.map((q4) => [`${rutaComoNombre(ruta)} · ${q3} · ${q4}`, ruta, q3, q4]),
      ),
    );

    it('son exactamente 48', () => {
      expect(combinaciones).toHaveLength(48);
    });

    it.each(combinaciones)('%s está completa', (_n, ruta, q3, q4) => {
      const rec = construirRecomendacion({ ...ruta, q3, q4 });

      expect(rec.categoria).toBe(ruta.categoria);
      expect(rec.tag.trim()).not.toBe('');
      expect(rec.title.trim()).not.toBe('');
      expect(rec.pasos).toHaveLength(4);

      expect(CAMPOS_RECOMENDACION).toHaveLength(7);
      for (const campo of CAMPOS_RECOMENDACION) {
        expect(typeof rec[campo], `"${campo}" debería ser texto`).toBe('string');
        expect(rec[campo].trim(), `"${campo}" está vacío`).not.toBe('');
      }
      for (const paso of rec.pasos) {
        expect(paso.trim()).not.toBe('');
      }
    });
  });

  describe('entradas inválidas', () => {
    it('rechaza un valor de Q3 desconocido', () => {
      expect(() =>
        construirRecomendacion({ q1: 'sector', q2: null, q3: 'muchísimo', q4: 'solo' }),
      ).toThrow(/q3 desconocido/i);
    });

    it('rechaza un valor de Q4 desconocido', () => {
      expect(() =>
        construirRecomendacion({ q1: 'sector', q2: null, q3: 'medio', q4: 'quizás' }),
      ).toThrow(/q4 desconocido/i);
    });

    it('rechaza que falte Q3 o Q4 en vez de inventar un valor', () => {
      expect(() =>
        construirRecomendacion({ q1: 'sector', q2: null, q4: 'solo' }),
      ).toThrow(/q3 desconocido/i);
      expect(() =>
        construirRecomendacion({ q1: 'sector', q2: null, q3: 'medio' }),
      ).toThrow(/q4 desconocido/i);
    });

    it('propaga el rechazo de una ruta inválida del árbol', () => {
      expect(() =>
        construirRecomendacion({ q1: 'mi', q2: null, q3: 'medio', q4: 'solo' }),
      ).toThrow(/falta la respuesta/i);
    });
  });
});

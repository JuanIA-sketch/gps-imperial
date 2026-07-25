import { describe, it, expect } from 'vitest';
import {
  PREGUNTAS,
  IDS_PREGUNTAS_Q2,
  obtenerPregunta,
  obtenerOpcion,
  ramaTrasQ1,
  resolverCategoria,
  RUTAS_HOJA,
} from '../src/arbol.js';
import { CATEGORIAS, IDS_CATEGORIAS } from '../src/categorias.js';

describe('árbol de decisión', () => {
  // Test 8
  it('Q1 ofrece exactamente las 4 opciones del brief', () => {
    expect(PREGUNTAS.Q1.opciones.map((o) => o.id)).toEqual([
      'mi',
      'sector',
      'cliente',
      'audiencia',
    ]);
  });

  // Test 9
  it.each([
    ['Q2_yo', 2],
    ['Q2_cliente', 3],
    ['Q2_audiencia', 2],
  ])('%s ofrece %i opciones', (id, cuantas) => {
    expect(PREGUNTAS[id].opciones).toHaveLength(cuantas);
  });

  it('Q3 ofrece bajo/medio/alto y Q4 solo/colaboradores', () => {
    expect(PREGUNTAS.Q3.opciones.map((o) => o.valor)).toEqual([
      'bajo',
      'medio',
      'alto',
    ]);
    expect(PREGUNTAS.Q4.opciones.map((o) => o.valor)).toEqual([
      'solo',
      'colaboradores',
    ]);
  });

  it('toda pregunta tiene texto y toda opción tiene id y label no vacíos', () => {
    for (const [id, pregunta] of Object.entries(PREGUNTAS)) {
      expect(pregunta.texto.trim(), `${id} sin texto`).not.toBe('');
      expect(pregunta.opciones.length).toBeGreaterThan(1);
      for (const opcion of pregunta.opciones) {
        expect(opcion.id.trim()).not.toBe('');
        expect(opcion.label.trim()).not.toBe('');
      }
    }
  });

  // Test 10 — el candado sobre la regla crítica del brief:
  // "ninguna pregunta pide directamente qué tipo de solución prefieres"
  describe('regla crítica: la categoría se infiere, nunca se pregunta', () => {
    const textos = Object.values(PREGUNTAS).flatMap((p) => [
      p.texto,
      ...p.opciones.map((o) => o.label),
    ]);

    it('ninguna pregunta ni opción nombra una categoría', () => {
      const nombresDeCategoria = IDS_CATEGORIAS.flatMap((id) => [
        CATEGORIAS[id].tag,
        CATEGORIAS[id].title,
      ]);
      for (const texto of textos) {
        for (const nombre of nombresDeCategoria) {
          expect(
            texto.toLowerCase().includes(nombre.toLowerCase()),
            `"${texto}" delata la categoría "${nombre}"`,
          ).toBe(false);
        }
      }
    });

    it('ninguna pregunta ni opción nombra un tipo de solución', () => {
      const tiposDeSolucion = [
        'saas',
        'chatbot',
        'aplicación web',
        'app web',
        'script',
        'cli',
        'crm',
        'qué tipo de solución',
        'qué quieres construir',
      ];
      // Palabra completa: "cli" no debe dar positivo dentro de "cliente".
      for (const texto of textos) {
        for (const tipo of tiposDeSolucion) {
          const comoPalabra = new RegExp(
            `\\b${tipo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
            'i',
          );
          expect(
            comoPalabra.test(texto),
            `"${texto}" pide el tipo de solución ("${tipo}")`,
          ).toBe(false);
        }
      }
    });
  });

  // Test 11 — las 8 rutas hoja, una aserción explícita cada una
  describe('tabla de ruteo Q1×Q2 → categoría', () => {
    it('mí + tarea repetitiva → A', () => {
      expect(resolverCategoria('mi', 'repetitiva')).toBe('A');
    });
    it('mí + información dispersa → B', () => {
      expect(resolverCategoria('mi', 'informacion')).toBe('B');
    });
    it('sector → D, sin pasar por Q2', () => {
      expect(resolverCategoria('sector', null)).toBe('D');
    });
    it('cliente + conseguir clientes → C', () => {
      expect(resolverCategoria('cliente', 'clientes')).toBe('C');
    });
    it('cliente + preguntas repetidas → E', () => {
      expect(resolverCategoria('cliente', 'preguntas')).toBe('E');
    });
    it('cliente + algo puntual que pagaría → F', () => {
      expect(resolverCategoria('cliente', 'puntual')).toBe('F');
    });
    it('audiencia + respuestas rápidas → E', () => {
      expect(resolverCategoria('audiencia', 'respuestas')).toBe('E');
    });
    it('audiencia + organizar información → B', () => {
      expect(resolverCategoria('audiencia', 'organizar')).toBe('B');
    });

    it('RUTAS_HOJA lista exactamente esas 8 rutas', () => {
      expect(RUTAS_HOJA).toHaveLength(8);
      expect(
        RUTAS_HOJA.map((r) => [r.q1, r.q2, r.categoria]),
      ).toEqual([
        ['mi', 'repetitiva', 'A'],
        ['mi', 'informacion', 'B'],
        ['sector', null, 'D'],
        ['cliente', 'clientes', 'C'],
        ['cliente', 'preguntas', 'E'],
        ['cliente', 'puntual', 'F'],
        ['audiencia', 'respuestas', 'E'],
        ['audiencia', 'organizar', 'B'],
      ]);
    });

    it('cada ruta hoja apunta a una categoría que existe', () => {
      for (const ruta of RUTAS_HOJA) {
        expect(IDS_CATEGORIAS).toContain(ruta.categoria);
      }
    });

    it('las 6 categorías son alcanzables desde alguna ruta', () => {
      const alcanzables = new Set(RUTAS_HOJA.map((r) => r.categoria));
      expect([...alcanzables].sort()).toEqual([...IDS_CATEGORIAS]);
    });
  });

  describe('ramaTrasQ1', () => {
    it.each([
      ['mi', 'Q2_yo'],
      ['cliente', 'Q2_cliente'],
      ['audiencia', 'Q2_audiencia'],
    ])('%s lleva a %s', (q1, rama) => {
      expect(ramaTrasQ1(q1)).toBe(rama);
    });

    it('sector no lleva a ninguna Q2', () => {
      expect(ramaTrasQ1('sector')).toBeNull();
    });

    it('IDS_PREGUNTAS_Q2 son las 3 ramas', () => {
      expect([...IDS_PREGUNTAS_Q2].sort()).toEqual([
        'Q2_audiencia',
        'Q2_cliente',
        'Q2_yo',
      ]);
    });
  });

  // Test 12 — nada cae en una categoría por defecto en silencio
  describe('respuestas inválidas', () => {
    it('rechaza una opción desconocida de Q1', () => {
      expect(() => resolverCategoria('marcianos', 'repetitiva')).toThrow(
        /opción desconocida/i,
      );
      expect(() => ramaTrasQ1('marcianos')).toThrow(/opción desconocida/i);
    });

    it('rechaza una opción de Q2 que no pertenece a esa rama', () => {
      // "clientes" existe, pero en Q2_cliente, no en Q2_yo
      expect(() => resolverCategoria('mi', 'clientes')).toThrow(
        /opción desconocida/i,
      );
    });

    it('rechaza que falte Q2 cuando la rama sí la exige', () => {
      expect(() => resolverCategoria('mi', null)).toThrow(/falta la respuesta/i);
    });

    it('rechaza una Q2 respondida en la rama sector, que no la tiene', () => {
      expect(() => resolverCategoria('sector', 'repetitiva')).toThrow(
        /no tiene segunda pregunta/i,
      );
    });

    it('obtenerPregunta y obtenerOpcion revientan con ids desconocidos', () => {
      expect(() => obtenerPregunta('Q9')).toThrow(/pregunta desconocida/i);
      expect(() => obtenerOpcion('Q1', 'nope')).toThrow(/opción desconocida/i);
    });
  });
});

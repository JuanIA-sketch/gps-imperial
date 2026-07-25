import { describe, it, expect } from 'vitest';
import { BANCO } from '../src/banco.js';
import { crearMotor } from '../src/motor.js';

describe('banco de proyectos', () => {
  // Test 32
  it('tiene las 4 entradas curadas', () => {
    expect(BANCO).toHaveLength(4);
    expect(BANCO.map((e) => e.nombre)).toEqual([
      'El Arquitecto',
      'Las Llantas',
      'El Filtro',
      'El Doctor',
    ]);
  });

  it.each(BANCO.map((e) => [e.nombre, e]))(
    '%s tiene nombre y descripción no vacíos',
    (_n, entrada) => {
      expect(entrada.nombre.trim()).not.toBe('');
      expect(entrada.descripcion.trim()).not.toBe('');
    },
  );

  // Test 33 — o link de verdad, o estado declarado. Nunca un link muerto.
  it.each(BANCO.map((e) => [e.nombre, e]))(
    '%s tiene link válido o estado declarado, nunca un hueco',
    (_n, entrada) => {
      const tieneLink = entrada.link !== null;
      const tieneEstado = entrada.estado !== null;

      expect(
        tieneLink !== tieneEstado,
        'debe tener exactamente uno de los dos: link o estado',
      ).toBe(true);

      if (tieneLink) {
        expect(entrada.link).toMatch(/^https:\/\/\S+$/);
        expect(() => new URL(entrada.link)).not.toThrow();
      } else {
        expect(entrada.estado.trim()).not.toBe('');
      }
    },
  );

  it('los links apuntan a donde dijo Charly', () => {
    const porNombre = Object.fromEntries(BANCO.map((e) => [e.nombre, e]));
    expect(porNombre['El Arquitecto'].link).toBe('https://el-arquitecto.vercel.app');
    expect(porNombre['Las Llantas'].link).toBe(
      'https://github.com/JuanIA-sketch/las-llantas',
    );
    expect(porNombre['El Filtro'].estado).toBe('en construcción');
    expect(porNombre['El Doctor'].estado).toBe('publicado');
  });

  // Test 34 — es vitrina, no parte del diagnóstico
  describe('es dato puro', () => {
    it('está congelado', () => {
      expect(Object.isFrozen(BANCO)).toBe(true);
      expect(BANCO.every((e) => Object.isFrozen(e))).toBe(true);
    });

    it('un diagnóstico completo no lo toca', () => {
      const antes = JSON.stringify(BANCO);

      const motor = crearMotor();
      motor.responder('cliente');
      motor.responder('puntual');
      motor.responder('mas10');
      motor.responder('colaboradores');
      expect(motor.resultado().categoria).toBe('F');

      expect(JSON.stringify(BANCO)).toBe(antes);
    });

    it('el resultado del diagnóstico no depende del banco', () => {
      // Ninguna entrada del banco aparece en la recomendación: son secciones
      // independientes de la página.
      const motor = crearMotor();
      motor.responder('sector');
      motor.responder('entre5y10');
      motor.responder('solo');
      const comoTexto = JSON.stringify(motor.resultado());

      for (const entrada of BANCO) {
        expect(comoTexto).not.toContain(entrada.nombre);
      }
    });
  });
});

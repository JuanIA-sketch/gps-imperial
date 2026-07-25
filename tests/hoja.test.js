/**
 * La matemática del arrastre de la hoja inferior (móvil).
 *
 * El tirador se arrastra de verdad: sube y baja la hoja y al soltar se acomoda
 * al tope más cercano. Esas dos decisiones son aritmética pura y viven fuera
 * del manejador de eventos, así que se testean sin navegador — igual que todo
 * lo demás en este proyecto.
 */

import { describe, expect, it } from 'vitest';
import { alturaArrastrada, topeMasCercano } from '../web/hoja.js';

describe('alturaArrastrada', () => {
  const limites = { minima: 200, maxima: 800 };

  it('arrastrar hacia arriba agranda la hoja', () => {
    // El dedo sube 120px: en pantalla, "arriba" es y decreciente, y por eso
    // el desplazamiento que recibe es positivo cuando la hoja debe crecer.
    expect(
      alturaArrastrada({ inicial: 400, desplazamiento: 120, ...limites }),
    ).toBe(520);
  });

  it('arrastrar hacia abajo encoge la hoja', () => {
    expect(
      alturaArrastrada({ inicial: 400, desplazamiento: -150, ...limites }),
    ).toBe(250);
  });

  it('no pasa del máximo por mucho que se siga arrastrando', () => {
    expect(
      alturaArrastrada({ inicial: 400, desplazamiento: 9999, ...limites }),
    ).toBe(800);
  });

  it('no baja del mínimo por mucho que se siga arrastrando', () => {
    expect(
      alturaArrastrada({ inicial: 400, desplazamiento: -9999, ...limites }),
    ).toBe(200);
  });

  it('un arrastre de cero deja la hoja donde estaba', () => {
    expect(
      alturaArrastrada({ inicial: 400, desplazamiento: 0, ...limites }),
    ).toBe(400);
  });
});

describe('topeMasCercano', () => {
  const topes = [300, 600];

  it('se acomoda al tope de abajo cuando quedó más cerca de él', () => {
    expect(topeMasCercano(380, topes)).toBe(300);
  });

  it('se acomoda al tope de arriba cuando quedó más cerca de él', () => {
    expect(topeMasCercano(520, topes)).toBe(600);
  });

  it('en el punto medio exacto se queda con el primero, sin titubear', () => {
    // Importa que sea determinístico: media hoja no puede depender del orden
    // de comparación ni quedarse a medio camino.
    expect(topeMasCercano(450, topes)).toBe(300);
  });

  it('un solo tope es siempre la respuesta', () => {
    expect(topeMasCercano(999, [420])).toBe(420);
  });
});

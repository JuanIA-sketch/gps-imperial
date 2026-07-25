/**
 * La hoja inferior arrastrable (solo móvil).
 *
 * El tirador de la hoja se veía arrastrable y no lo era: era un `::before`,
 * un pseudo-elemento que ni siquiera puede recibir un puntero. Aquí se vuelve
 * un elemento real que se arrastra de verdad y se acomoda al soltarlo.
 *
 * Capa de vista, como `mapa.js`. La aritmética del arrastre vive arriba, sin
 * DOM, para poder testearla en Node; lo que toca el documento vive dentro de
 * `crearHoja()` y no se ejecuta al importar el módulo.
 */

/** Altura resultante de un arrastre, sin salirse de los límites. */
export function alturaArrastrada({ inicial, desplazamiento, minima, maxima }) {
  return Math.min(maxima, Math.max(minima, inicial + desplazamiento));
}

/**
 * El tope al que se acomoda la hoja al soltarla.
 *
 * En un empate se queda con el primero de la lista: media hoja no puede
 * depender del orden en que se comparen los topes.
 */
export function topeMasCercano(altura, topes) {
  return topes.reduce((mejor, tope) =>
    Math.abs(tope - altura) < Math.abs(mejor - altura) ? tope : mejor,
  );
}

/* ---------- De aquí para abajo sí hay DOM, pero solo dentro de la función ---------- */

/** Hasta dónde puede estirarse o encogerse la hoja, en fracción de pantalla. */
const TOPE_MAXIMO = 0.92;
const TOPE_MINIMO = 0.3;

/** Un arrastre por debajo de esto fue un toque, no un arrastre. */
const UMBRAL_ARRASTRE_PX = 4;

export function crearHoja(panel) {
  const raiz = document.documentElement;

  const tirador = document.createElement('button');
  tirador.className = 'tirador';
  tirador.type = 'button';
  tirador.setAttribute('aria-label', 'Ajustar el alto del panel');
  tirador.setAttribute('aria-expanded', 'false');
  tirador.appendChild(document.createElement('span')).className = 'tirador-barra';

  let inicioY = null;
  let alturaInicial = 0;
  let arrastro = false;

  /**
   * El alto que la hoja tiene por CSS, ya resuelto a píxeles.
   *
   * Se lee del `max-height` computado en vez de repetir aquí el `62dvh`: el
   * valor vive en una sola parte, y el breakpoint de pantallas bajas —que lo
   * sube a 74dvh— sigue mandando sin que este archivo se entere.
   */
  function alturaDeCSS() {
    const propio = raiz.style.getPropertyValue('--hoja-alto');
    raiz.style.removeProperty('--hoja-alto');
    const base = Number.parseFloat(getComputedStyle(panel).maxHeight);
    if (propio) raiz.style.setProperty('--hoja-alto', propio);
    return base;
  }

  function limites() {
    return {
      minima: window.innerHeight * TOPE_MINIMO,
      maxima: window.innerHeight * TOPE_MAXIMO,
    };
  }

  function fijar(altura) {
    raiz.style.setProperty('--hoja-alto', `${Math.round(altura)}px`);
  }

  /** Acomodarse a un tope sí se anima; seguir el dedo no. */
  function acomodar(altura) {
    panel.classList.add('hoja-acomodando');
    fijar(altura);
    panel.addEventListener(
      'transitionend',
      () => panel.classList.remove('hoja-acomodando'),
      { once: true },
    );
  }

  function estaVisible() {
    return tirador.offsetParent !== null;
  }

  tirador.addEventListener('pointerdown', (evento) => {
    if (!estaVisible()) return;
    inicioY = evento.clientY;
    alturaInicial = panel.getBoundingClientRect().height;
    arrastro = false;
    tirador.setPointerCapture(evento.pointerId);
    panel.classList.remove('hoja-acomodando');
  });

  tirador.addEventListener('pointermove', (evento) => {
    if (inicioY === null) return;
    // Hacia arriba la hoja crece, y hacia arriba `clientY` baja.
    const desplazamiento = inicioY - evento.clientY;
    if (Math.abs(desplazamiento) > UMBRAL_ARRASTRE_PX) arrastro = true;
    if (!arrastro) return;
    fijar(alturaArrastrada({ inicial: alturaInicial, desplazamiento, ...limites() }));
  });

  function soltar() {
    if (inicioY === null) return;
    inicioY = null;
    if (!arrastro) return;

    const base = alturaDeCSS();
    const { maxima } = limites();
    const destino = topeMasCercano(panel.getBoundingClientRect().height, [base, maxima]);
    acomodar(destino);
    tirador.setAttribute('aria-expanded', String(destino > base));
  }

  tirador.addEventListener('pointerup', soltar);
  tirador.addEventListener('pointercancel', soltar);

  /** Sin arrastre —click, Enter, Espacio— la hoja alterna entre sus dos topes. */
  tirador.addEventListener('click', () => {
    if (arrastro) {
      arrastro = false;
      return;
    }
    const base = alturaDeCSS();
    const { maxima } = limites();
    const expandida = tirador.getAttribute('aria-expanded') === 'true';
    acomodar(expandida ? base : maxima);
    tirador.setAttribute('aria-expanded', String(!expandida));
  });

  window.addEventListener('resize', () => {
    // Un alto en píxeles de la pantalla anterior no significa nada en la nueva.
    raiz.style.removeProperty('--hoja-alto');
    tirador.setAttribute('aria-expanded', 'false');
  });

  return { tirador };
}

/**
 * La ruta dibujada: la carretera, las paradas, el tramo recorrido y el pin.
 *
 * Capa de vista. No sabe qué pregunta se está respondiendo — recibe en qué
 * parada va y de cuántas, y dibuja el viaje.
 *
 * La carretera se GENERA a partir de la rama: un diagnóstico de 3 preguntas y
 * uno de 4 son recorridos distintos, así que se dibujan distintos. Y cada
 * parada cae en un giro, no a mitad de un tramo recto — como una maniobra real.
 *
 * Las POSICIONES van en unidades del viewBox (se escalan solas con el SVG),
 * pero los GROSORES y RADIOS se fijan en píxeles reales: entre un móvil y un
 * monitor ancho el SVG se escala varias veces, y un radio fijo en unidades de
 * viewBox saldría diminuto en una punta y enorme en la otra.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Radios en píxeles de pantalla, no en unidades del viewBox. */
const RADIOS_PX = {
  parada: 4.5,
  destino: 8,
  onda: 19,
  halo: 10.5,
  nucleo: 6.5,
};

/**
 * Grosores, también en píxeles de pantalla.
 *
 * No se usa `vector-effect: non-scaling-stroke`, que sería lo obvio: con eso
 * el `stroke-dasharray` pasa a medirse en píxeles de pantalla mientras que
 * `getTotalLength()` sigue devolviendo unidades de viewBox, y el tramo
 * recorrido se dibuja como una fila de guiones en vez de una línea continua.
 */
const GROSORES_PX = {
  ruta: 7,
  parada: 3,
  destino: 3.5,
};

/** Radio de los giros, en unidades del viewBox. Nunca más de medio tramo. */
const RADIO_GIRO = 7;

/**
 * Una carretera por rama.
 *
 * Los tramos tienen largos distintos a propósito: un recorrido con todos los
 * tramos iguales se lee como un patrón, no como un camino. `V` sube (la y baja),
 * `H` va a la derecha. Los ángulos siguen siendo rectos y el trazo esquemático.
 *
 * Las dos rutas arrancan y terminan en el mismo sitio, (14,102) → (84,20), así
 * que ocupan el mismo encuadre y cambiar de rama no descoloca el mapa.
 */
const CARRETERAS = {
  // Tres maniobras: sube poco, cruza largo, sube el resto.
  3: { inicio: [14, 102], tramos: [['V', -30], ['H', 70], ['V', -52]] },
  // Cuatro maniobras en escalera: 32, 26, 50, 44 — ningún tramo se repite.
  4: { inicio: [14, 102], tramos: [['V', -32], ['H', 26], ['V', -50], ['H', 44]] },
};

/** Los vértices del recorrido: aquí es donde cae cada parada. */
function vertices({ inicio, tramos }) {
  const puntos = [[...inicio]];
  let [x, y] = inicio;
  for (const [eje, avance] of tramos) {
    if (eje === 'V') y += avance;
    else x += avance;
    puntos.push([x, y]);
  }
  return puntos;
}

/** Un punto a `r` de la esquina, en dirección al vecino. */
function retranqueo([cx, cy], [tx, ty], r) {
  const dx = tx - cx;
  const dy = ty - cy;
  const distancia = Math.hypot(dx, dy);
  const k = Math.min(r, distancia / 2) / distancia;
  return [+(cx + dx * k).toFixed(2), +(cy + dy * k).toFixed(2)];
}

/** Convierte los vértices en una "d" con los giros redondeados. */
function dibujarCarretera(puntos, r) {
  let d = `M ${puntos[0][0]} ${puntos[0][1]}`;

  for (let i = 1; i < puntos.length - 1; i += 1) {
    const antes = retranqueo(puntos[i], puntos[i - 1], r);
    const despues = retranqueo(puntos[i], puntos[i + 1], r);
    d += ` L ${antes[0]} ${antes[1]}`;
    d += ` Q ${puntos[i][0]} ${puntos[i][1]} ${despues[0]} ${despues[1]}`;
  }

  const fin = puntos[puntos.length - 1];
  return `${d} L ${fin[0]} ${fin[1]}`;
}

export function crearMapa() {
  const svg = document.querySelector('.ruta');
  const trazado = document.getElementById('ruta-trazado');
  const recorrido = document.getElementById('ruta-hecha');
  const contenedorParadas = document.getElementById('paradas');
  const pin = document.getElementById('pin');

  let carreteraActual = null;
  let largo = 0;
  let distancias = [];

  /** Cuántas unidades de viewBox mide un píxel de pantalla, ahora mismo. */
  function unidadesPorPixel() {
    const ctm = svg.getScreenCTM();
    // Si el SVG todavía no está en pantalla, CTM viene nulo o en cero.
    if (!ctm || !ctm.a) return 1;
    return 1 / ctm.a;
  }

  /** Traduce los tamaños en píxeles a unidades del viewBox, a la escala actual. */
  function aplicarEscala() {
    const u = unidadesPorPixel();

    trazado.style.strokeWidth = `${GROSORES_PX.ruta * u}`;
    recorrido.style.strokeWidth = `${GROSORES_PX.ruta * u}`;

    pin.querySelector('.pin-onda').setAttribute('r', RADIOS_PX.onda * u);
    pin.querySelector('.pin-halo').setAttribute('r', RADIOS_PX.halo * u);
    pin.querySelector('.pin-nucleo').setAttribute('r', RADIOS_PX.nucleo * u);

    for (const parada of contenedorParadas.children) {
      const esDestino = parada.classList.contains('parada-destino');
      parada.setAttribute(
        'r',
        (esDestino ? RADIOS_PX.destino : RADIOS_PX.parada) * u,
      );
      parada.style.strokeWidth = `${
        (esDestino ? GROSORES_PX.destino : GROSORES_PX.parada) * u
      }`;
    }
  }

  /**
   * A qué distancia del arranque cae cada vértice.
   *
   * Se busca por muestreo en vez de calcularlo: el giro redondeado recorta la
   * esquina, así que el vértice teórico no queda exactamente sobre la línea, y
   * lo que hace falta es el punto del trazado más cercano a él. Solo corre al
   * cambiar de rama, no en cada avance.
   */
  function medirParadas(puntos) {
    const MUESTRAS = 1200;
    return puntos.map(([px, py]) => {
      let mejor = 0;
      let minimo = Infinity;
      for (let i = 0; i <= MUESTRAS; i += 1) {
        const s = (largo * i) / MUESTRAS;
        const pt = trazado.getPointAtLength(s);
        const d = Math.hypot(pt.x - px, pt.y - py);
        if (d < minimo) {
          minimo = d;
          mejor = s;
        }
      }
      return mejor;
    });
  }

  /** Rehace la carretera entera para una rama de N preguntas. */
  function trazarRama(totalPasos) {
    const carretera = CARRETERAS[totalPasos] ?? CARRETERAS[4];
    const puntos = vertices(carretera);
    const d = dibujarCarretera(puntos, RADIO_GIRO);

    trazado.setAttribute('d', d);
    recorrido.setAttribute('d', d);

    largo = trazado.getTotalLength();
    distancias = medirParadas(puntos);

    recorrido.style.strokeDasharray = `${largo}`;

    // El pin recorre la carretera, no la línea recta entre dos paradas.
    pin.style.offsetPath = `path("${d}")`;

    contenedorParadas.replaceChildren();
    puntos.forEach((_, i) => {
      const punto = trazado.getPointAtLength(distancias[i]);
      const esDestino = i === puntos.length - 1;
      const parada = document.createElementNS(SVG_NS, 'circle');
      parada.setAttribute('cx', punto.x);
      parada.setAttribute('cy', punto.y);
      parada.setAttribute('class', esDestino ? 'parada parada-destino' : 'parada');
      parada.dataset.indice = String(i);
      contenedorParadas.appendChild(parada);
    });

    carreteraActual = totalPasos;
  }

  /** Coloca el pin y el tramo recorrido en la parada que toca. */
  function situar({ paso, totalPasos, terminado }) {
    const indice = terminado ? distancias.length - 1 : paso - 1;
    const avance = distancias[indice] ?? 0;

    recorrido.style.strokeDashoffset = `${largo - avance}`;
    pin.style.offsetDistance = `${(avance / largo) * 100}%`;
    pin.classList.toggle('pin-llegado', terminado);

    for (const parada of contenedorParadas.children) {
      parada.classList.toggle(
        'parada-alcanzada',
        Number(parada.dataset.indice) <= indice,
      );
    }

    aplicarEscala();
  }

  /** Cambia algo sin animarlo: para los saltos que no son un viaje. */
  function sinTransicion(hacer) {
    recorrido.style.transition = 'none';
    pin.style.transition = 'none';
    hacer();
    void svg.getBoundingClientRect(); // fuerza el reflujo
    recorrido.style.transition = '';
    pin.style.transition = '';
  }

  window.addEventListener('resize', () => {
    if (carreteraActual !== null) aplicarEscala();
  });

  return {
    /**
     * @param {number} paso        parada actual, 1-based (null si ya llegó)
     * @param {number} totalPasos  cuántas paradas tiene esta rama
     * @param {boolean} terminado  si ya está en el destino
     */
    actualizar(estado) {
      if (estado.totalPasos !== carreteraActual) {
        // La rama cambió: esto es OTRO recorrido, no un avance dentro del
        // mismo. Se redibuja de golpe (no se puede interpolar entre dos
        // carreteras distintas) y se avisa con un parpadeo, como el
        // "recalculando ruta" de cualquier navegador.
        const primeraVez = carreteraActual === null;
        sinTransicion(() => {
          trazarRama(estado.totalPasos);
          situar(estado);
        });
        if (!primeraVez) {
          svg.classList.remove('ruta-recalculada');
          void svg.getBoundingClientRect();
          svg.classList.add('ruta-recalculada');
        }
        return;
      }
      situar(estado);
    },
  };
}

/**
 * La capa de interfaz: lee el motor y lo pinta.
 *
 * Este es el ÚNICO archivo que toca el DOM (junto a `mapa.js`, que solo mueve
 * el dibujo de la ruta). No decide categorías, no conoce el árbol y no tiene
 * un solo `if` sobre el contenido: pregunta al motor qué pantalla toca y
 * dibuja lo que le den. Toda la lógica vive en `src/`, sin DOM, y por eso se
 * testea con Vitest.
 */

import { crearMotor } from '../src/motor.js';
import { BANCO } from '../src/banco.js';
import { crearMapa } from './mapa.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const motor = crearMotor();
const app = document.getElementById('app');
const estadoViaje = document.getElementById('estado-viaje');
const mapa = crearMapa();

/** El primer pintado no debe robarle el foco a nadie; los siguientes sí. */
let esPrimerPintado = true;

// ---------- Ayudas mínimas de DOM ----------

/**
 * Crea un elemento. El texto entra siempre como nodo de texto, nunca como
 * HTML: así no hay superficie de inyección aunque el contenido cambie.
 */
function crear(etiqueta, { clase, texto, atributos } = {}, hijos = []) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  for (const [nombre, valor] of Object.entries(atributos ?? {})) {
    nodo.setAttribute(nombre, valor);
  }
  for (const hijo of hijos) nodo.appendChild(hijo);
  return nodo;
}

function icono(clase, trazos) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('class', clase);
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', trazos);
  svg.appendChild(path);
  return svg;
}

/**
 * Glifo de maniobra por pregunta. Es decisión de presentación, no de negocio:
 * la forma de la maniobra ilustra el tipo de decisión que se está tomando.
 * Si aparece una pregunta nueva sin glifo, cae en "seguir recto" y no rompe.
 */
const MANIOBRAS = {
  Q1: 'M12 22V13 M12 13L5 6 M5 6v4 M5 6h4 M12 13l7-7 M19 6v4 M19 6h-4', // bifurcación
  Q2_yo: 'M18 22v-9a5 5 0 0 0-5-5H6 M10 4L5 8l5 4', // giro a la izquierda: hacia adentro
  Q2_cliente: 'M6 22v-9a5 5 0 0 1 5-5h7 M14 4l5 4-5 4', // giro a la derecha: hacia afuera
  Q2_audiencia: 'M6 22v-9a5 5 0 0 1 5-5h7 M14 4l5 4-5 4',
  Q3: 'M12 22V4 M6 10l6-6 6 6', // seguir recto: es ritmo, no dirección
  Q4: 'M6 22l5-9 M18 22l-5-9 M12 13V4 M8 8l4-4 4 4', // incorporación
};
const MANIOBRA_POR_DEFECTO = MANIOBRAS.Q3;

/** Bandera de meta: el destino no es una maniobra más. */
const GLIFO_DESTINO = 'M6 22V3 M6 4h12l-2.8 4.2L18 12.5H6z';

const FLECHA_SALIDA = 'M4 12h15 M13 6l6 6-6 6';

// ---------- Tarjeta de maniobra ----------

function botonVolver() {
  const boton = crear('button', {
    clase: 'volver',
    texto: 'Volver',
    atributos: { type: 'button' },
  });
  boton.prepend(icono('volver-glifo', 'M11 6l-6 6 6 6 M5 12h14'));
  boton.addEventListener('click', () => {
    motor.volver();
    pintar();
  });
  return boton;
}

function pintarPregunta(estado) {
  const cabecera = crear('div', { clase: 'maniobra-cabecera' }, [
    crear('span', { clase: 'maniobra-glifo' }, [
      icono('', MANIOBRAS[estado.pregunta.id] ?? MANIOBRA_POR_DEFECTO),
    ]),
    crear('span', {
      clase: 'maniobra-cuenta',
      texto: `Parada ${estado.paso} de ${estado.totalPasos}`,
    }),
  ]);

  const instruccion = crear('h1', {
    clase: 'instruccion',
    texto: estado.pregunta.texto,
    atributos: { tabindex: '-1', id: 'paso-actual' },
  });

  const salidas = crear('ul', {
    clase: 'salidas',
    atributos: { 'aria-labelledby': 'paso-actual' },
  });

  for (const opcion of estado.pregunta.opciones) {
    const boton = crear('button', {
      clase: 'salida',
      atributos: { type: 'button' },
    }, [
      crear('span', { clase: 'salida-texto', texto: opcion.label }),
      icono('salida-flecha', FLECHA_SALIDA),
    ]);
    boton.addEventListener('click', () => {
      motor.responder(opcion.id);
      pintar();
    });
    salidas.appendChild(crear('li', {}, [boton]));
  }

  const controles = crear('div', { clase: 'controles' });
  if (estado.puedeVolver) controles.appendChild(botonVolver());

  return crear('section', { clase: 'tarjeta tarjeta-maniobra' }, [
    cabecera,
    instruccion,
    salidas,
    controles,
  ]);
}

// ---------- Pantalla de destino ----------

function ficha(etiqueta, valor) {
  return crear('div', { clase: 'ficha' }, [
    crear('dt', { clase: 'ficha-etiqueta', texto: etiqueta }),
    crear('dd', { clase: 'ficha-valor', texto: valor }),
  ]);
}

function pintarBanco() {
  const lista = crear('ul', { clase: 'banco-lista' });

  for (const entrada of BANCO) {
    const cierre = entrada.link
      ? crear('a', {
          clase: 'banco-link',
          texto: 'Ver proyecto',
          atributos: {
            href: entrada.link,
            target: '_blank',
            rel: 'noopener noreferrer',
            // Cuatro links dicen lo mismo: el nombre los distingue para quien
            // los recorre fuera de contexto.
            'aria-label': `Ver ${entrada.nombre}`,
          },
        })
      : crear('span', { clase: 'banco-estado', texto: entrada.estado });

    lista.appendChild(
      crear('li', { clase: 'banco-item' }, [
        crear('p', { clase: 'banco-nombre', texto: entrada.nombre }),
        crear('p', { clase: 'banco-desc', texto: entrada.descripcion }),
        cierre,
      ]),
    );
  }

  return crear('section', { clase: 'banco' }, [
    crear('h2', { clase: 'banco-titulo', texto: 'Así se ve un proyecto terminado' }),
    crear('p', {
      clase: 'banco-intro',
      texto:
        'No es un portafolio — son ejemplos reales de la comunidad para calibrar qué significa "terminado" antes de que construyas el tuyo.',
    }),
    crear('p', {
      clase: 'banco-cta',
      texto:
        '¿Ya terminaste el tuyo? Publícalo como Logro y pide que lo sumen aquí — el envío automático todavía no existe, esto se cura a mano por ahora.',
    }),
    lista,
  ]);
}

function pintarDestino() {
  const recomendacion = motor.resultado();

  const pasos = crear('ol', { clase: 'pasos' });
  for (const paso of recomendacion.pasos) {
    pasos.appendChild(crear('li', { texto: paso }));
  }

  const reiniciar = crear('button', {
    clase: 'reiniciar',
    texto: 'Repetir diagnóstico',
    atributos: { type: 'button' },
  });
  reiniciar.addEventListener('click', () => {
    motor.reiniciar();
    pintar();
  });

  // El brief pide "volver" en cada paso del árbol — el destino incluido.
  const controles = crear('div', { clase: 'controles controles-destino' }, [
    botonVolver(),
    reiniciar,
  ]);

  const enPractica = crear('section', { clase: 'bloque bloque-practica' }, [
    crear('h2', { clase: 'bloque-titulo', texto: 'Cómo se ve en la práctica' }),
    crear('p', { clase: 'bloque-texto', texto: recomendacion.ejemplo }),
  ]);

  const conQue = crear('section', { clase: 'bloque' }, [
    crear('h2', { clase: 'bloque-titulo', texto: 'Con qué construirlo' }),
    crear('p', { clase: 'bloque-texto', texto: recomendacion.herramientas }),
  ]);

  const datos = crear('dl', { clase: 'fichas' }, [
    ficha('Usuario', recomendacion.usuario),
    ficha('Problema', recomendacion.problema),
    ficha('Resultado', recomendacion.resultado),
    ficha('MVP', recomendacion.mvp),
    ficha('Lo que queda fuera', recomendacion.fuera),
    ficha('Tiempo estimado', recomendacion.tiempo),
    ficha('Cómo validarlo', recomendacion.validacion),
  ]);

  return crear('section', { clase: 'tarjeta tarjeta-destino' }, [
    crear('div', { clase: 'llegada' }, [
      crear('span', { clase: 'llegada-glifo' }, [icono('', GLIFO_DESTINO)]),
      crear('span', { clase: 'llegada-texto', texto: 'Has llegado' }),
    ]),
    crear('p', { clase: 'placa', texto: recomendacion.tag }),
    crear('h1', {
      clase: 'destino-titulo',
      texto: recomendacion.title,
      atributos: { tabindex: '-1', id: 'paso-actual' },
    }),
    enPractica,
    datos,
    conQue,
    crear('section', { clase: 'bloque' }, [
      crear('h2', { clase: 'bloque-titulo', texto: 'Próximos pasos' }),
      pasos,
    ]),
    controles,
    pintarBanco(),
  ]);
}

// ---------- Pintado principal ----------

function pintar() {
  const estado = motor.estado();

  mapa.actualizar(estado);

  estadoViaje.textContent = estado.terminado
    ? 'Has llegado a tu destino.'
    : `Parada ${estado.paso} de ${estado.totalPasos}.`;

  app.replaceChildren(
    estado.terminado ? pintarDestino() : pintarPregunta(estado),
  );

  // El panel scrollea por dentro; al cambiar de pantalla vuelve arriba.
  app.scrollTop = 0;

  if (esPrimerPintado) {
    esPrimerPintado = false;
    return;
  }

  // `preventScroll` no es un detalle: sin él, enfocar el encabezado arrastra
  // el scroll para "acercarlo", corre la escena fija hacia arriba (le corta la
  // firma) y en el destino se salta el "Has llegado" antes de que se lea.
  document.getElementById('paso-actual')?.focus({ preventScroll: true });
  app.scrollTop = 0;
}

pintar();

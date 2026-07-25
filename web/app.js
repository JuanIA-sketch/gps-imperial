/**
 * La capa de interfaz: lee el motor y lo pinta.
 *
 * Este es el ÚNICO archivo que toca el DOM. No decide categorías, no conoce
 * el árbol y no tiene un solo `if` sobre el contenido: pregunta al motor qué
 * pantalla toca y dibuja lo que le den. Toda la lógica vive en `src/`, sin
 * DOM, y por eso se testea con Vitest.
 */

import { crearMotor } from '../src/motor.js';
import { BANCO } from '../src/banco.js';

const motor = crearMotor();

const app = document.getElementById('app');
const routeTrack = document.getElementById('route-track');
const routeFill = document.getElementById('route-fill');
const routeLabel = document.getElementById('route-label');

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

function campo(etiqueta, valor) {
  return crear('div', { clase: 'field' }, [
    crear('div', { clase: 'field-label', texto: etiqueta }),
    crear('div', { clase: 'field-value', texto: valor }),
  ]);
}

/**
 * Encabezado del paso. Recibe foco al cambiar de pantalla para que quien
 * navega por teclado no quede tirado al principio del documento.
 */
function encabezado(clase, texto) {
  return crear('h2', {
    clase,
    texto,
    atributos: { tabindex: '-1', id: 'paso-actual' },
  });
}

function botonVolver() {
  const boton = crear('button', {
    clase: 'back-btn',
    texto: '← Volver',
    atributos: { type: 'button' },
  });
  boton.addEventListener('click', () => {
    motor.volver();
    pintar();
  });
  return boton;
}

// ---------- Pantallas ----------

function pintarPregunta(estado) {
  const titulo = encabezado('qtext', estado.pregunta.texto);

  const opciones = crear('div', {
    clase: 'options',
    atributos: { role: 'group', 'aria-labelledby': 'paso-actual' },
  });

  for (const opcion of estado.pregunta.opciones) {
    const boton = crear('button', {
      clase: 'opt',
      texto: opcion.label,
      atributos: { type: 'button' },
    });
    boton.addEventListener('click', () => {
      motor.responder(opcion.id);
      pintar();
    });
    opciones.appendChild(boton);
  }

  const navegacion = crear('div', { clase: 'nav-row' });
  if (estado.puedeVolver) navegacion.appendChild(botonVolver());

  return crear('section', { clase: 'card' }, [titulo, opciones, navegacion]);
}

function pintarResultado() {
  const recomendacion = motor.resultado();

  const pasos = crear('ol', { clase: 'pasos' });
  for (const paso of recomendacion.pasos) {
    pasos.appendChild(crear('li', { texto: paso }));
  }

  const reiniciar = crear('button', {
    clase: 'restart-btn',
    texto: 'Repetir diagnóstico',
    atributos: { type: 'button' },
  });
  reiniciar.addEventListener('click', () => {
    motor.reiniciar();
    pintar();
  });

  // El brief pide "volver" en cada paso del árbol — el resultado incluido.
  const navegacion = crear('div', { clase: 'nav-row' }, [
    botonVolver(),
    reiniciar,
  ]);

  return crear('section', { clase: 'card' }, [
    crear('p', { clase: 'result-tag', texto: recomendacion.tag }),
    encabezado('result-title', recomendacion.title),
    campo('Usuario', recomendacion.usuario),
    campo('Problema', recomendacion.problema),
    campo('Resultado', recomendacion.resultado),
    campo('MVP', recomendacion.mvp),
    campo('Lo que queda fuera', recomendacion.fuera),
    campo('Tiempo estimado', recomendacion.tiempo),
    campo('Cómo validarlo', recomendacion.validacion),
    crear('div', { clase: 'field' }, [
      crear('div', { clase: 'field-label', texto: 'Próximos pasos' }),
      pasos,
    ]),
    navegacion,
  ]);
}

// ---------- Barra de ruta ----------

function pintarRuta(estado) {
  // El total lo dice el motor: la rama "sector" son 3 pasos, no 4.
  const avance = estado.terminado
    ? 100
    : Math.round(((estado.paso - 1) / estado.totalPasos) * 100);

  routeFill.style.width = `${avance}%`;
  routeTrack.setAttribute('aria-valuenow', String(avance));
  routeLabel.textContent = estado.terminado
    ? 'Destino'
    : `Paso ${estado.paso} de ${estado.totalPasos}`;
}

// ---------- Pintado principal ----------

function pintar() {
  const estado = motor.estado();

  pintarRuta(estado);

  app.replaceChildren(
    estado.terminado ? pintarResultado() : pintarPregunta(estado),
  );

  if (esPrimerPintado) {
    esPrimerPintado = false;
    return;
  }
  document.getElementById('paso-actual')?.focus();
}

function pintarBanco() {
  const grid = document.getElementById('banco-grid');

  grid.replaceChildren(
    ...BANCO.map((entrada) => {
      const cierre = entrada.link
        ? crear('a', {
            texto: 'Ver proyecto →',
            atributos: {
              href: entrada.link,
              target: '_blank',
              rel: 'noopener noreferrer',
              // Cuatro links dicen "Ver proyecto": el nombre los distingue
              // para quien los recorre fuera de contexto.
              'aria-label': `Ver ${entrada.nombre}`,
            },
          })
        : crear('p', { clase: 'status', texto: entrada.estado });

      return crear('li', { clase: 'banco-card' }, [
        crear('p', { clase: 'name', texto: entrada.nombre }),
        crear('p', { clase: 'desc', texto: entrada.descripcion }),
        cierre,
      ]);
    }),
  );
}

pintar();
pintarBanco();

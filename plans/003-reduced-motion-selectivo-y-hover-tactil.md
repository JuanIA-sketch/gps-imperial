# 003 — Reduced-motion selectivo y hover que no dispare en táctil

- **Status**: DONE
- **Commit**: a4ddbe2
- **Severity**: MEDIUM
- **Category**: 6. Accessibility
- **Estimated scope**: 1 archivo, ~12 líneas

## Problem

**(a) El bloque de movimiento reducido apaga todo, incluido lo que informa.**

```css
/* web/estilos.css — actual */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
    scroll-behavior: auto !important;
  }
  .pin-onda { display: none; }
}
```

Movimiento reducido significa **menos movimiento y más suave, no cero**: se
quita el desplazamiento, se conserva lo que ayuda a entender. Aquí el comodín
`*` también mata el relleno del tramo recorrido, que no es desplazamiento —
es un cambio de longitud y color que comunica "avanzaste una parada". Quien
active la preferencia pierde esa lectura y el mapa cambia de golpe sin explicar
nada.

Lo que sí está bien y **no se toca**: apagar el `latido` del `.pin-onda` por
completo (una pulsación infinita es exactamente lo que la preferencia pide
eliminar).

**(b) El hover de las opciones se dispara en táctil.**

```css
/* web/estilos.css — actual */
.salida:hover {
  background: color-mix(in srgb, var(--ruta) 11%, transparent);
  border-color: var(--ruta);
  transform: translateX(3px);
}
```

Sin puerta de medios. En móvil, tocar una opción dispara un hover falso y la
opción se desplaza justo cuando el dedo la está pulsando — y en algunos casos
el estilo se queda pegado hasta que se toca otra cosa.

## Target

```css
/* target — reemplaza el bloque de reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
    scroll-behavior: auto !important;
  }

  /* Estos dos no son desplazamiento: cuentan que avanzaste una parada.
     Se conservan, cortos. El que sí se elimina es el viaje del pin, que
     se queda en el 0.01ms del comodín de arriba. */
  .ruta-hecha { transition-duration: 200ms !important; }
  .parada { transition-duration: 200ms !important; }

  /* Una pulsación infinita es justo lo que la preferencia pide quitar. */
  .pin-onda { display: none; }
}
```

```css
/* target — sustituye la regla .salida:hover */
@media (hover: hover) and (pointer: fine) {
  .salida:hover {
    background: color-mix(in srgb, var(--ruta) 11%, transparent);
    border-color: var(--ruta);
    transform: translateX(3px);
  }

  .salida:hover .salida-flecha {
    stroke: var(--ruta);
    transform: translateX(3px);
  }
}
```

## Repo conventions to follow

- Los bloques de medios van al final de `web/estilos.css`, cada uno con un
  comentario de sección en español (`/* ---------- Movimiento reducido ---------- */`).
  Mantén ese formato.
- El archivo ya usa `@media (max-width: 900px)` para el patrón de hoja inferior;
  añade la puerta de hover **junto a la regla que modifica**, no al final, para
  que se lea seguido.
- Los comentarios de este repo explican **por qué**, no qué. Sigue ese tono.

## Steps

1. En `web/estilos.css`, localiza la regla `.salida:hover` y la regla
   `.salida:hover .salida-flecha`. Envuelve **las dos** en
   `@media (hover: hover) and (pointer: fine) { … }`, tal cual el apartado Target.

2. En el bloque `@media (prefers-reduced-motion: reduce)`, después del comodín,
   añade las dos reglas de `.ruta-hecha` y `.parada` con `transition-duration:
   200ms !important;` y el comentario que explica por qué se conservan.

3. Comprueba que `.pin-onda { display: none; }` sigue dentro del bloque de
   movimiento reducido y no se ha movido.

## Boundaries

- NO toques `src/`, `web/app.js` ni `web/mapa.js`.
- NO quites el comodín `*` del bloque de movimiento reducido: es la red de
  seguridad para todo lo que no esté enumerado. Solo se le añaden excepciones.
- NO conviertas el viaje del pin en una excepción: ese sí es desplazamiento y
  debe desaparecer con la preferencia activa.
- NO añadas dependencias.

## Verification

- **Mecánica**: `npm test` sigue en 329 verdes.
- **Feel check**: sirve la página.
  - En DevTools → Rendering → `prefers-reduced-motion: reduce`, responde una
    pregunta: el pin **salta** a la parada nueva sin recorrido, pero el tramo
    verde **sí crece** en un cambio corto, y el punto de la parada cambia de
    color. Nada pulsa.
  - Sin la preferencia, todo se mueve como antes.
  - En un viewport táctil (DevTools → modo dispositivo, 390×844), toca una
    opción: no debe desplazarse 3px bajo el dedo ni quedarse resaltada después.
  - Con ratón en escritorio, el hover sigue funcionando igual que antes.
- **Done when**: con movimiento reducido activo no hay ni un desplazamiento en
  pantalla, pero el avance de la ruta sigue siendo legible.

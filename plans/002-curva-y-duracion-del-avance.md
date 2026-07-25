# 002 — Corregir la curva y la duración del avance de ruta

- **Status**: DONE
- **Commit**: a4ddbe2
- **Severity**: HIGH
- **Category**: 2. Easing & duration · 7. Cohesion & tokens
- **Estimated scope**: 1 archivo, ~10 líneas

## Problem

**(a) 720ms es demasiado para la respuesta principal de la interfaz.**

```css
/* web/estilos.css — actual */
.ruta-hecha { transition: stroke-dashoffset 0.72s var(--curva); }
.pin        { transition: transform 0.72s var(--curva); }
```

El avance de la ruta se dispara **en cada respuesta** — 3 o 4 veces por
diagnóstico, y la gente lo repite. El presupuesto es: interfaz por debajo de
300ms, cajones y modales 200–500ms. 720ms se pasa de largo incluso del techo
más generoso.

Y hay un desfase peor que la cifra: la tarjeta de la pregunta se cambia de golpe
(`app.replaceChildren`, sin transición) mientras el mapa sigue deslizándose casi
tres cuartos de segundo. La narración va por detrás de lo que narra.

**(b) La curva es de cajón, no de desplazamiento.**

```css
/* web/estilos.css — actual */
--curva: cubic-bezier(.32, .72, 0, 1);
```

Ese valor es exactamente la curva de cajón tipo iOS (`--ease-drawer` del
catálogo), pensada para hojas que **entran** en pantalla. El pin no entra: se
mueve de un punto a otro ya visible. Para eso corresponde `ease-in-out`. La cola
larguísima de la curva de cajón es justo lo que hace que el pin parezca
arrastrarse al llegar a la parada.

**(c) Un solo token hace tres trabajos distintos.**

`--curva` se usa para el viaje del pin, para el `translateX(3px)` del hover de
`.salida` y para la flecha de la salida. Tres tipos de movimiento, una sola
curva de cajón. Además `.parada` usa un `0.4s ease` a mano para un cambio de
color: 400ms es el doble del presupuesto de un cambio de color.

## Target

Tres tokens con nombre, cada uno con su trabajo, copiados literalmente del
catálogo:

```css
/* target — web/estilos.css, en :root */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);       /* entradas y salidas */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);   /* desplazamiento en pantalla */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);    /* la hoja inferior en móvil */
```

```css
/* target */
.ruta-hecha { transition: stroke-dashoffset 420ms var(--ease-in-out); }
.pin        { transition: offset-distance 420ms var(--ease-in-out); }
.parada     { transition: stroke 180ms ease; }
.salida     { transition: background 180ms ease, border-color 180ms ease, transform 180ms var(--ease-out); }
.salida-flecha { transition: stroke 180ms ease, transform 180ms var(--ease-out); }
```

420ms: es motivo explicativo (cuenta un avance), así que se gana la parte alta
del rango de cajón — pero no más.

**El pin y el tramo recorrido deben compartir duración y curva exactas.** Si se
separan, se despegan visualmente, que es justo lo que arregla el plan 001.

## Repo conventions to follow

- Los tokens viven en el bloque `:root` de `web/estilos.css` (líneas ~14–36),
  agrupados con comentario. Exemplar a imitar: el bloque
  `/* Dos acentos, dos trabajos distintos: el recorrido y la maniobra. */`
  — nombra el token por su **trabajo**, no por su forma.
- Los nombres de token de este repo están en español (`--asfalto`, `--senal`,
  `--maniobra`). Los de easing son la excepción aceptada: mantén `--ease-*` en
  inglés, que es como se leen en el catálogo, y coméntalos en español.
- Las duraciones se escriben con unidad explícita en ms para valores por debajo
  del segundo.

## Steps

1. En `web/estilos.css`, en `:root`, sustituye la línea
   `--curva: cubic-bezier(.32, .72, 0, 1);` por los tres tokens del apartado
   Target, con un comentario corto en español que diga para qué es cada uno.

2. Busca **todas** las apariciones de `var(--curva)` en `web/estilos.css` y
   sustitúyelas así:
   - `.ruta-hecha` y `.pin` → `var(--ease-in-out)`, duración `420ms`.
   - `.salida` y `.salida-flecha` (la parte de `transform`) → `var(--ease-out)`,
     duración `180ms`.
   - Cualquier otra → `var(--ease-out)`.
   Al terminar no debe quedar ni un `var(--curva)` en el archivo.

3. En `.parada`, cambia `transition: stroke 0.4s ease;` por
   `transition: stroke 180ms ease;`.

4. En `.salida`, cambia las duraciones de `0.18s` a `180ms` (misma cifra, unidad
   coherente con el resto).

## Boundaries

- NO toques `src/`, `web/app.js` ni `web/mapa.js`.
- NO cambies colores, tamaños, ni la geometría del trazado.
- NO toques el bloque `@media (prefers-reduced-motion: reduce)` (eso es el plan 003).
- NO toques la animación `latido` del `.pin-onda`: su ritmo lento es ambiental a
  propósito, no es motivo de interfaz.
- NO añadas dependencias.

## Verification

- **Mecánica**: `grep -c "var(--curva)" web/estilos.css` devuelve `0`.
  `npm test` sigue en 329 verdes.
- **Feel check**: sirve la página y recorre el diagnóstico entero.
  - El mapa termina de moverse **casi a la vez** que aparece la pregunta nueva,
    no medio segundo después.
  - El pin ya no se arrastra al final del recorrido: frena y para.
  - Responde rápido dos preguntas seguidas: el avance debe re-encaminarse desde
    donde estaba, sin saltos ni reinicios (son transiciones, no keyframes).
  - En DevTools → Animations al 10%, el pin y la punta verde arrancan y paran
    en el mismo instante.
- **Done when**: no queda ninguna duración por encima de 500ms en movimiento de
  interfaz, y `--curva` ha desaparecido del repo.

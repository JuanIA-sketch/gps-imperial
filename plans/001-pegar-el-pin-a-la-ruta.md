# 001 — Pegar el pin a la ruta con offset-path

- **Status**: DONE
- **Commit**: a4ddbe2
- **Severity**: HIGH
- **Category**: 3. Physicality & origin
- **Estimated scope**: 2 archivos, ~15 líneas

## Problem

El pin de "estás aquí" **se sale de la carretera** mientras viaja entre paradas.

`web/mapa.js` posiciona el pin con un `translate` en unidades del viewBox, y
`web/estilos.css` lo anima con una transición de `transform`:

```js
/* web/mapa.js:114 — actual */
pin.style.transform = `translate(${punto.x}px, ${punto.y}px)`;
```

```css
/* web/estilos.css — actual */
.pin {
  transition: transform 0.72s var(--curva);
}
```

CSS interpola `translate(x1,y1) → translate(x2,y2)` en **línea recta**. Pero la
ruta no es recta: el trazado de `index.html` tiene giros de 90° redondeados
(`Q 14 71 22 71`, `Q 48 71 48 63`, …). Resultado: el pin corta la curva en
diagonal, atraviesa el fondo por fuera del asfalto y vuelve a caer sobre la
línea al final.

Peor todavía: el pin y la punta verde del tramo recorrido son conceptualmente
**el mismo punto**. La punta verde sí sigue el trazado (va por `stroke-dashoffset`),
así que durante toda la transición se ven separados.

Medido en Chromium a 1440×900, avanzando de la parada 1 a la 2:

```
t=  5ms  pin=(16.7, 92.87)  separación del trazado = 2.71 u
PEOR: 6.18 unidades de viewBox a los 126ms
```

La ruta mide 7px de grosor y la escala es ~8px por unidad de viewBox: el pin se
despega hasta **~49px**, siete veces el ancho de la propia carretera.

## Target

El pin viaja **sobre el trazado**, no entre dos puntos. Se usa CSS Motion Path:
el mismo `d` del trazado como `offset-path`, y se anima `offset-distance` en
porcentaje — que es exactamente la misma fracción que ya alimenta el
`stroke-dashoffset`, así que el pin y la punta verde quedan pegados por
construcción.

```css
/* target — web/estilos.css */
.pin {
  /* offset-path lo fija mapa.js leyendo el "d" real del trazado, para no
     duplicar la geometría en dos archivos. */
  offset-rotate: 0deg;
  transition: offset-distance 0.72s var(--curva);
}
```

```js
/* target — web/mapa.js */
pin.style.offsetPath = `path("${trazado.getAttribute('d')}")`;  // una sola vez
pin.style.offsetDistance = `${fraccion * 100}%`;                // en cada avance
```

`offset-rotate: 0deg` es obligatorio: el valor por defecto es `auto`, que rota
el elemento según la tangente del trazado y rompería el escalado de `.pin-onda`
(que usa `transform-box: fill-box`).

## Repo conventions to follow

- `web/mapa.js` es el único archivo que toca la geometría de la ruta; `web/app.js`
  no sabe nada de esto y no se toca.
- Las medidas en píxeles se traducen a unidades de viewBox en `aplicarEscala()`
  (`web/mapa.js:63`). `offset-distance` va en **porcentaje**, así que no necesita
  esa traducción — no lo metas ahí.
- La geometría vive en un solo sitio: el atributo `d` de `#ruta-trazado` en
  `index.html`. Exemplar de esa regla: `web/mapa.js:46` hace
  `trazado.getTotalLength()` en vez de recalcular el largo a mano. Sigue ese
  patrón — lee el `d` del DOM, no lo copies al CSS ni al JS.
- La fracción de avance ya está calculada en `web/mapa.js:110`
  (`const fraccion = terminado ? 1 : (paso - 1) / totalPasos;`). Reutilízala:
  no la vuelvas a derivar.

## Steps

1. En `web/estilos.css`, en la regla `.pin`, sustituye
   `transition: transform 0.72s var(--curva);` por
   `transition: offset-distance 0.72s var(--curva);` y añade `offset-rotate: 0deg;`.

2. En `web/mapa.js`, dentro de `crearMapa()`, justo después de la línea
   `const largo = trazado.getTotalLength();`, fija el trazado del pin una sola vez:

   ```js
   // El pin recorre la carretera, no la línea recta entre dos paradas.
   pin.style.offsetPath = `path("${trazado.getAttribute('d')}")`;
   ```

3. En `web/mapa.js`, en la función `pintar()`, sustituye la línea
   `pin.style.transform = \`translate(${punto.x}px, ${punto.y}px)\`;`
   por:

   ```js
   pin.style.offsetDistance = `${fraccion * 100}%`;
   ```

4. En esa misma función, la variable `punto` queda sin uso para el pin. Compruébalo:
   si ya no la usa nadie más, borra la línea
   `const punto = trazado.getPointAtLength(largo * fraccion);`. Si sí la usa otra
   cosa, déjala.

## Boundaries

- NO toques `src/` — ahí vive la lógica testeada y no tiene nada que ver con esto.
- NO toques `web/app.js`.
- NO cambies el `d` del trazado en `index.html`, ni la duración ni la curva
  (eso es el plan 002).
- NO añadas dependencias.
- Si `offset-path` no mueve el pin en absoluto al probarlo (algún motor viejo
  ignora `offset-path` sobre elementos SVG), **PARA y reporta** en vez de
  improvisar: el respaldo previsto es muestrear `getPointAtLength()` con
  `requestAnimationFrame`, y eso es otro plan, no este.

## Verification

- **Mecánica**: `npm test` sigue en 329 verdes (esta capa no está cubierta por
  Vitest, pero no debe romperse nada).
- **Feel check**: sirve la página (`npm run dev`) y responde la primera pregunta.
  - El pin recorre la curva **por dentro del asfalto**, sin cortar el giro en diagonal.
  - El pin y la punta verde del tramo iluminado van **juntos**, como un solo punto,
    durante toda la transición.
  - En DevTools → Animations, baja la reproducción al 10% y sigue el pin cuadro a
    cuadro por el giro de 90°: no debe salirse del trazo en ningún momento.
  - Con `prefers-reduced-motion` activo (DevTools → Rendering), el pin salta
    directo a la parada nueva, sin recorrido.
- **Done when**: repitiendo la medición de separación, el máximo queda por debajo
  de **0.5 unidades de viewBox** (hoy son 6.18).

# Planes de animación — GPS Imperial

Auditoría `improve-animations quick` sobre el movimiento de la ruta
(`web/mapa.js` + `web/estilos.css`), commit `a4ddbe2`.

Alcance de la auditoría: el viaje del pin entre paradas y el llenado del tramo
recorrido. No se auditó el resto de la interfaz.

## Planes

| # | Título | Severidad | Categoría | Estado |
|---|---|---|---|---|
| [001](001-pegar-el-pin-a-la-ruta.md) | Pegar el pin a la ruta con offset-path | HIGH | Physicality & origin | **DONE** |
| [002](002-curva-y-duracion-del-avance.md) | Corregir la curva y la duración del avance | HIGH | Easing & duration · Tokens | **DONE** |
| [003](003-reduced-motion-selectivo-y-hover-tactil.md) | Reduced-motion selectivo y hover táctil | MEDIUM | Accessibility | **DONE** |

## Orden recomendado

**001 → 002 → 003.**

- **001 antes que 002**: el plan 001 cambia *qué propiedad* se anima en `.pin`
  (`transform` → `offset-distance`). El plan 002 ajusta la duración y la curva de
  esa transición; si se hace al revés, el paso 002 edita una línea que 001 va a
  reescribir y hay que tocarla dos veces.
- **003 es independiente** de los otros dos: se puede hacer en cualquier momento,
  pero va al final porque su verificación es más fácil con el movimiento ya
  corregido.

## Hallazgo con evidencia medida

El más grave (001) no es de gusto, es medible. Muestreando la posición del pin
durante el avance de la parada 1 a la 2, en Chromium a 1440×900:

```
PEOR: 6.18 unidades de viewBox a los 126ms  (~49px)
```

La carretera mide 7px de ancho. El pin se despega hasta siete veces ese ancho
porque CSS interpola `translate` en línea recta y la ruta gira 90°.

Criterio de "arreglado": esa separación máxima por debajo de **0.5 unidades**.

**Resultado tras aplicar 001**: `0.077 unidades (~0.6px)`. El pin va sobre el asfalto.

Desviación respecto al plan 002: no se añadió el token `--ease-drawer`. La hoja
inferior no anima nada, así que era una curva para un trabajo inexistente.

## Oportunidades no cubiertas por ningún plan

Aditivas, no correctivas. Ninguna se convirtió en plan todavía:

1. **La llegada al destino es el momento raro y emotivo** del producto y hoy solo
   cambia el color del pin de verde a ámbar. Es el sitio donde el catálogo
   permite gastar presupuesto de deleite: un destello único del anillo de destino
   al llegar (una sola vez, no en bucle) marcaría la diferencia entre "cambió un
   color" y "llegaste".
2. **La tarjeta de maniobra se sustituye de golpe** (`app.replaceChildren`, sin
   transición) mientras el mapa sí se mueve. Un fundido muy corto (~120ms de
   opacidad, sin desplazamiento) las ataría. **Cuidado**: es la respuesta directa
   a un clic y se ve muchas veces por sesión — si se pasa de 150ms o se le añade
   movimiento, estorba en vez de ayudar. Probar antes de adoptar.
3. **El cambio de rama redibuja las paradas de golpe**: al elegir "mi mismo oficio
   o sector" la ruta pasa de 5 paradas a 4 y las nuevas aparecen sin transición.
   Un fundido de opacidad de 150ms al redibujar explicaría que el viaje se acortó.

## Lo que se revisó y está bien

- El `latido` del `.pin-onda` es ambiental a propósito y coincide con la
  referencia (el punto de posición pulsa en las apps de navegación reales). No
  es un hallazgo.
- Se usan transiciones, no keyframes, para el avance: responder rápido dos veces
  seguidas re-encamina el movimiento desde donde estaba en vez de reiniciarlo.
  Correcto.
- Solo se animan `transform`, `opacity`, `stroke-dashoffset` y colores. No hay
  `transition: all` ni propiedades de layout animadas.

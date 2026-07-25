# GPS Imperial — CLAUDE.md

*El porqué del producto vive en `gps-imperial-BRIEF.md`. Este archivo es solo lo operativo: cómo está armado y qué no se toca.*

## Contexto de marca

- Comunidad: Imperio Agéntico (Skool) — serie **Juegos Imperiales**
- Copyright: Charly.marketing
- Paleta propia de este proyecto (viene del prototipo validado en vivo, **no** de la paleta morada de El Arquitecto): `--ink #12213B`, `--paper #EDEFF3`, `--amber #E8823D`, `--teal #3FA796`
- Tipografías: Space Grotesk (display), Inter (cuerpo), IBM Plex Mono (etiquetas)

## Reglas que no se negocian

1. **Cero IA, cero API keys.** El árbol es determinístico y así se queda. No hay "capa de personalización con LLM" en el roadmap de esta versión.
2. **El copy de las 6 categorías manda desde `gps-imperial-mvp.html`**, el prototipo validado en vivo — no desde el brief, que trae una versión abreviada. Decisión explícita de Charly. `tests/categorias.test.js` tiene el copy transcrito aparte como candado: si cambias una frase en `src/categorias.js` sin cambiar el fixture, el test falla. **Eso es intencional.** No "arregles" el test para que pase: confirma primero que el cambio de copy es deliberado.
3. **Ninguna pregunta puede pedir el tipo de solución.** La categoría se infiere de audiencia (Q1) + necesidad (Q2). Hay un test que revisa que ningún texto de pregunta u opción nombre una categoría ni un tipo de solución.
4. **Q3 y Q4 nunca votan categoría.** Solo ajustan el texto de tiempo y el de validación, cada uno el suyo.
5. **`git push`, `gh repo create` y cualquier deploy requieren confirmación explícita de Charly.** Sin excepción, aunque todo esté en verde.
6. Cero secretos reales en la sesión.

## Arquitectura

La regla que ordena todo: **`src/` no menciona `document`, `window` ni ningún evento.** Si un test necesitara el DOM, la lógica está en el archivo equivocado — muévela, no metas jsdom.

```
index.html            marcado semántico + carga de módulos
web/estilos.css       sistema visual
web/app.js            ÚNICO archivo con DOM. Pinta lo que el motor le da; no decide nada.
src/categorias.js     las 6 categorías (dato puro, Object.freeze)
src/arbol.js          preguntas + ruteo Q1×Q2 → categoría
src/motor.js          máquina de estados: responder / volver / reiniciar
src/recomendacion.js  Q3 → texto de tiempo, Q4 → texto de validación
src/banco.js          entradas del banco (dato puro)
```

`web/app.js` no tiene ni un `if` sobre categorías. Si te ves agregando uno, la decisión pertenece a `src/`.

**El botón "volver" vive en `motor.js`**, no en la interfaz: es navegación, no pintura. Por eso se testea sin navegador. El historial guarda una instantánea del estado *antes* de aplicar cada respuesta, así volver también deshace la respuesta — eso es lo que impide que cambiar Q1 deje pegada una Q2 de otra rama.

## Stack

- HTML/CSS/JS simple. **Sin frameworks, sin bundler, sin build step.** Módulos ES nativos que corren igual en el navegador y en Vitest.
- Vitest para la lógica. Única dependencia del proyecto, y solo de desarrollo.
- Node ≥ 20.

```bash
npm test          # 404 tests
npm run test:watch
npm run dev       # sirve la carpeta en localhost:3000
```

No sirve abrir `index.html` con `file://`: el navegador bloquea los módulos ES por CORS. Hace falta un servidor estático.

## Flujo de trabajo (igual que el resto de Juegos Imperiales)

1. Brief → plan mode
2. TDD rojo→verde (Vitest)
3. Demo real en navegador
4. Auditoría de La Alarma (`la-alarma`) sin hallazgos
5. Publish — **solo con confirmación explícita**

## Deploy

Vercel estático, sin build (`vercel.json` con `framework: null`). Se despliega con **Las Llantas** (`llantas`), que detecta el tipo por la presencia de `vercel.json`. Dominio objetivo: `gps-imperial.vercel.app`.

Esto es también otra validación real del deployer de Vercel de Las Llantas antes de su publish en npm.

## Estado actual

*Última actualización: 25 de julio de 2026, al cerrar la sesión.*

### 1. Construido y verificado

- **Arquitectura sostenida**: `src/` es lógica pura sin DOM (categorías, árbol, motor de estados, recomendación, banco); `web/app.js` es el único archivo que pinta, junto a `web/mapa.js` (dibujo de la ruta) y `web/hoja.js` (la hoja arrastrable). Ni un `if` de negocio en la capa de vista.
- **404 tests en verde** (`npm test`), en 7 archivos. Incluye las 48 combinaciones Q1×Q2×Q3×Q4, el candado de que Q3 y Q4 nunca cambian la categoría, la rama sector que salta Q2, el "volver" en cada paso, y el candado de copy literal por categoría. Los 9 más nuevos son la aritmética del arrastre: vive sin DOM en `web/hoja.js` justamente para poder testearla en Node.
- **La Alarma: sin hallazgos**, exit 0, sobre el árbol ya commiteado con todo lo de abajo incluido.
- **Rediseño visual completo**: navegación nocturna, mapa a pantalla completa (la página no scrollea nunca), ruta real generada **por rama** —4 maniobras en escalera 32-26-50-44, o 3 maniobras 30-70-52— con cada parada en un giro. Panel lateral en escritorio, hoja inferior anclada abajo en móvil.
- **Accesibilidad verificada en Chromium real**: foco visible recorriendo con Tab de verdad (no `.focus()` programático), `prefers-reduced-motion` en los dos sentidos, 320px y 390px sin desbordamiento horizontal, contraste AA en el texto pequeño. Reverificada entera tras el cambio del banco: el orden de Tab pasa por las 4 opciones antes que por la pastilla del banco, el diálogo cierra con Esc y deja el foco en su título, y la página sigue sin scrollear (v:0 h:0).
- **Movimiento**: los 3 planes de `plans/` aplicados. El pin va sobre el asfalto con `offset-path` (medido: 0,077 unidades de separación, antes 6,18). El avance dura 420ms, por encima del techo de 300ms de interfaz **a propósito**: es motivo explicativo, no bloquea (acepta otra respuesta a los 302ms con el pin en vuelo) y re-encamina en vez de reiniciar.
- **Commits locales hechos** (nada empujado a ningún remoto):
  - `a4ddbe2` GPS Imperial: diagnóstico determinístico de 4 preguntas
  - `fcf6db5` Contenido del destino: coherencia y campos accionables
  - `25b56f3` Rediseño visual: navegación nocturna a pantalla completa
  - `9249411` Arregla el color del pin: estaba ámbar desde la primera pregunta
  - `51662e9` Actualiza el estado del proyecto en CLAUDE.md al cerrar la sesión
  - `6d2040e` Saca el banco del destino y arregla el desbordamiento del panel

### 2. Instrucciones de Charly — APLICADAS el 25 de julio de 2026

Las cuatro, en el commit `6d2040e`. Medido en Chromium real, no estimado:

- **Banco fuera del destino**: vive en un `<dialog>` modal que abre una pastilla presente en las 4 preguntas y en el destino. `showModal()` da Esc, trampa de foco y devolución del foco al botón que lo abrió.
- **Scroll interno solo en el destino**: lo enciende la clase `.panel-destino`. Las preguntas no scrollean **y no se recortan**: la hoja se estira a lo que mida la tarjeta (`.panel:not(.panel-destino)`, tope 92dvh). Recorte medido: 0px en los 5 viewports.
- **"Próximos pasos" reordenado** a justo después del título, antes de los 7 campos, en ámbar de maniobra.
- **Animaciones #1 y #4**, solo esas. #2 y #3 siguen archivadas.

Resultados medidos, antes → después. "Fuera por abajo" es cuánto habría que scrollear para ver el final de "Próximos pasos"; negativo = sobra espacio.

| Viewport | Desborde del panel (antes) | Scroll interno (ahora) | "Próximos pasos" |
|---|---|---|---|
| 1920×1080 | +1.380px | 549px | −511px |
| 1440×900 | — | 729px | −331px |
| 1024×768 | — | 1.064px | −176px |
| 390×844 | — | 1.076px | −94px |
| 320×568 | +2.351px | 1.320px | **+51px** |

Cero desbordamiento horizontal en los 5. Antes, "Próximos pasos" caía bajo la línea de flotación en **todos**; ahora se ve entero sin tocar nada en 4 de 5, y en 320×568 pide 51px — el "scroll mínimo" que Charly aceptó.

**Tres decisiones de criterio que se tomaron al implementar** (no estaban en la instrucción):

1. **El tirador aparece solo en el destino.** En una pregunta la hoja se ciñe a su contenido: estirarla no revela nada y encogerla recortaría la pregunta. Un tirador ahí sería otra vez la promesa falsa que el cambio venía a quitar. Se descubrió midiendo: con el tirador en las preguntas, arrastrar no movía un píxel.
2. **La pastilla del banco vive en el mapa, no en la fila de la marca**, y bajo 400px es solo ícono. Las dos cosas revisadas y ratificadas por Charly. En móvil no puede anclarse al borde de abajo del mapa: la hoja lo invade (sube a 76dvh, y una pregunta larga más). La franja que siempre existe es la de entre la marca y la hoja — medido, el peor caso son 80px de alto en 320×568 en el destino, entre y=56 e y=136 — así que va fija a `top: 74px`. En apaisado, donde la marca está oculta y esa franja no existe, vuelve a la esquina de arriba. Conserva el nombre accesible (el `<span>` se recorta, no se oculta con `display:none`) y lleva `title`.
3. **La pastilla va después del panel en el marcado.** Con Tab se contesta la pregunta primero y se sale al banco después.

**Una excepción deliberada a "las preguntas no scrollean", solo en apaisado** (`max-height: 560px`): en 360px de alto una pregunta de cuatro opciones no cabe — medido, a 640×360 le faltan 33px. Con `overflow: hidden` eso escondía una opción para siempre. Ahí, y solo ahí, la pregunta scrollea. En vertical la regla se cumple entera: recorte 0px en los cinco viewports. Entre cumplir la regla al pie y no perder contenido, gana no perder contenido.

### 3. Detenido esperando confirmación explícita de Charly

Sin excepción, aunque todo lo demás esté en verde:

- `gh repo create`
- `git push`
- Deploy con Las Llantas

### 4. Decisiones cerradas — no reabrir

- El **árbol de 4 preguntas es definitivo**.
- Los **pasos se quedan en 4**, no 5-6.
- **Q4 no se toca.**
- **Hosting ya decidido**: Vercel vía Las Llantas.

### Notas operativas que siguen vigentes

- El banco de proyectos tiene 4 entradas curadas a mano. Agregar una es editar `src/banco.js`: `link` **o** `estado`, nunca los dos ni ninguno (hay test).
- `npm run dev` levanta un servidor estático en un puerto libre distinto en cada corrida e imprime la URL. Con `file://` no funciona: el navegador bloquea los módulos ES.

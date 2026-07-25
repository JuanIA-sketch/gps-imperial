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
npm test          # 329 tests
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

- **Arquitectura sostenida**: `src/` es lógica pura sin DOM (categorías, árbol, motor de estados, recomendación, banco); `web/app.js` es el único archivo que pinta, junto a `web/mapa.js` que solo mueve el dibujo de la ruta. Ni un `if` de negocio en la capa de vista.
- **395 tests en verde** (`npm test`), en 6 archivos. Incluye las 48 combinaciones Q1×Q2×Q3×Q4, el candado de que Q3 y Q4 nunca cambian la categoría, la rama sector que salta Q2, el "volver" en cada paso, y el candado de copy literal por categoría.
- **La Alarma: sin hallazgos**, exit 0.
- **Rediseño visual completo**: navegación nocturna, mapa a pantalla completa (la página no scrollea nunca), ruta real generada **por rama** —4 maniobras en escalera 32-26-50-44, o 3 maniobras 30-70-52— con cada parada en un giro. Panel lateral en escritorio, hoja inferior anclada abajo en móvil.
- **Accesibilidad verificada en Chromium real**: foco visible recorriendo con Tab de verdad (no `.focus()` programático), `prefers-reduced-motion` en los dos sentidos, 320px y 390px sin desbordamiento horizontal, contraste AA en el texto pequeño.
- **Movimiento**: los 3 planes de `plans/` aplicados. El pin va sobre el asfalto con `offset-path` (medido: 0,077 unidades de separación, antes 6,18). El avance dura 420ms, por encima del techo de 300ms de interfaz **a propósito**: es motivo explicativo, no bloquea (acepta otra respuesta a los 302ms con el pin en vuelo) y re-encamina en vez de reiniciar.
- **Commits locales hechos** (nada empujado a ningún remoto):
  - `a4ddbe2` GPS Imperial: diagnóstico determinístico de 4 preguntas
  - `fcf6db5` Contenido del destino: coherencia y campos accionables
  - `25b56f3` Rediseño visual: navegación nocturna a pantalla completa
  - `9249411` Arregla el color del pin: estaba ámbar desde la primera pregunta

### 2. Instrucciones de Charly TODAVÍA NO aplicadas

Copiadas literal. Nada de esto está hecho ni confirmado terminado:

- Sacar el banco de proyectos del panel de destino (31% del espacio, confirmado invisible en los 5 viewports medidos) hacia un enlace visible desde cualquier pregunta.
- Permitir scroll interno solo en el panel de destino (no en las preguntas) y reordenar para que "Próximos pasos" quede justo después del resultado, antes de los 7 campos detallados.
- Implementar animación #1 (:active táctil en las opciones) y #4 (arrastre real del tirador de la hoja). NO implementar #2 ni #3 — quedan archivadas para después de publicar.
- Reverificar los 5 viewports, confirmando que "Próximos pasos" es visible sin scroll o con scroll mínimo.

Contexto medido que motivó lo anterior: el panel de destino desborda en los 5 viewports (de +1.380px en 1920×1080 a +2.351px en 320×568), y "Próximos pasos" queda bajo la línea de flotación en **todos**. El reparto del alto: banco 31%, los 7 campos 25%, próximos pasos 12%, ejemplo + herramientas 13%. Las animaciones #1 a #4 son las de la tabla que devolvió `find-animation-opportunities`; #1 es `:active` en `.salida` (hoy no hay ni un `:active` en todo el CSS, y en táctil el hover está gateado, así que tocar una opción no da ninguna respuesta) y #4 es el arrastre del tirador de `.panel::before`, que hoy parece arrastrable y no lo es.

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

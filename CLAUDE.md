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

- Lógica completa y testeada; interfaz completa; accesibilidad verificada en Chromium real (foco por teclado con Tab, reduced-motion, 320px sin desbordamiento).
- El banco de proyectos tiene 4 entradas curadas a mano. Agregar una es editar `src/banco.js`: `link` **o** `estado`, nunca los dos ni ninguno (hay test).
- Pendiente: `git push` / repo remoto / deploy — todos esperando confirmación de Charly.

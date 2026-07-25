# GPS Imperial 🧭

Un diagnóstico de 4 preguntas que te dice **cuál** proyecto construir. Uno solo, no una lista.

El problema que resuelve: tener ideas sueltas y ningún proyecto concreto que puedas terminar. GPS Imperial no te pregunta qué quieres construir — te pregunta **para quién es** y **qué duele**, y deduce el resto.

> El GPS decide la ruta, no te pregunta el destino.

**100% determinístico: cero IA, cero API keys, cero backend.** Las mismas respuestas dan siempre la misma recomendación, y nada sale de tu navegador. Mismo estándar que El Filtro y Las Llantas.

## Frontera con El Arquitecto

No son la misma herramienta y no compiten — uno entra antes que el otro:

| | Cuándo entra | Qué hace |
|---|---|---|
| **GPS Imperial** | No tienes ninguna idea elegida | Decide **cuál** idea perseguir |
| **El Arquitecto** | Ya elegiste una idea | Pre-mortem: busca los riesgos **antes** de construir |

## Cómo se usa

Es una página estática. No hay build, no hay dependencias de runtime, no hay que instalar nada para usarla:

```bash
npm run dev     # sirve la carpeta en http://localhost:3000
```

O abre `index.html` con cualquier servidor estático. (Con `file://` no funciona: el navegador bloquea los módulos ES por CORS.)

## El árbol de decisión

Regla crítica: **ninguna pregunta pide el tipo de solución**. La categoría siempre se infiere de audiencia + necesidad. Hay un test que lo vigila.

```
Q1 — ¿Para quién es esto, hoy mismo?
├── Para mí ─────────────► Q2_yo ──┬── tarea repetitiva ──────────► A
│                                  └── información dispersa ──────► B
├── Mi mismo oficio ─────────────────────────────────────────────► D   (salta Q2)
├── Cliente externo ─────► Q2_cliente ─┬── conseguir clientes ────► C
│                                      ├── preguntas repetidas ───► E
│                                      └── algo puntual y pagable ► F
└── Audiencia amplia ────► Q2_audiencia ─┬── respuestas rápidas ──► E
                                         └── organizar info ──────► B

Q3 — ¿Cuántas horas por semana?   NO vota categoría → ajusta el tiempo estimado
Q4 — ¿Solo o con colaboradores?   NO vota categoría → ajusta cómo validarlo
```

**Q3** mueve el estimado dentro del rango base de la categoría: con menos de 5 h/semana va al extremo alto, con más de 10 al extremo bajo, en medio muestra el rango completo. **Q4**, si eliges colaboradores, anexa una nota a "cómo validarlo". Ninguno de los dos toca la categoría — hay tests explícitos de eso.

## Las 6 categorías

| | Categoría | Recomienda | Tiempo base |
|---|---|---|---|
| **A** | Automatización interna | Automatiza algo que ya haces a mano | 3–7 días |
| **B** | Agente de datos | Organiza información que hoy está dispersa | 7–14 días |
| **C** | Captación de leads | Ayuda a conseguir o calificar clientes | 10–14 días |
| **D** | Vertical de sector | Resuelve el problema de tu propio oficio | 7–14 días |
| **E** | Asistente de atención | Responde o atiende a usuarios reales | 7–10 días |
| **F** | Micro-SaaS | Construye algo que un tercero pagaría por usar | 14–21 días |

Cada una entrega 7 campos (usuario, problema, resultado, MVP, lo que queda fuera, tiempo, cómo validarlo) más una checklist de 4 próximos pasos.

## Arquitectura

La regla que ordena todo: **`src/` no toca el DOM.** Si un test necesita un navegador, la lógica está en el lugar equivocado.

```
index.html          marcado semántico
web/estilos.css     el sistema visual
web/app.js          ÚNICO archivo que toca el DOM: pinta y escucha clics
src/categorias.js   las 6 categorías (dato puro, congelado)
src/arbol.js        las preguntas y el ruteo Q1×Q2 → categoría
src/motor.js        máquina de estados: avanzar, volver, reiniciar
src/recomendacion.js aplica Q3 al tiempo y Q4 a la validación
src/banco.js        las entradas del banco de proyectos
```

Por eso el botón "volver" —que es navegación, no pintura— se testea sin navegador: vive en `motor.js`.

## Tests

```bash
npm test
```

329 tests, TDD rojo→verde. Lo que cubren:

- **Las 48 combinaciones** Q1×Q2×Q3×Q4: cada una cae en la categoría correcta y ninguna queda sin resultado.
- **Q3 y Q4 nunca cambian la categoría** — aserción explícita en las 8 rutas, para los 3 valores de Q3 y los 2 de Q4. Y al revés: Q3 solo toca el tiempo, Q4 solo toca la validación, ninguno pisa el campo del otro.
- **Las 6 categorías** tienen los 7 campos + 4 pasos, ninguno vacío, y el copy coincide **literal** con el prototipo validado (un fixture aparte lo vigila: si alguien "mejora" una frase, el test falla).
- **La rama sector** salta Q2 de verdad: hace exactamente `[Q1, Q3, Q4]`, no 4 preguntas, y el contador de pasos dice 3 de 3.
- **Volver** en cada punto, incluido volver desde el resultado y volver desde Q3 en la rama sector (que debe regresar a Q1, no a una Q2 que nunca existió). Volver borra la respuesta, así que cambiar Q1 no deja pegada una Q2 de la rama anterior.
- **Ningún callejón sin salida**: recorrido exhaustivo del árbol, todo estado tiene o pregunta o resultado.
- **Nada cae en una categoría por defecto en silencio**: una respuesta desconocida revienta.

## Accesibilidad

Parte de "terminado", no un extra. Verificado en Chromium real, no solo a ojo:

- ✅ Foco visible por teclado (`:focus-visible`) en **todos** los botones y links — comprobado recorriendo la página con Tab, no con `.focus()` programático (que no dispara `:focus-visible`).
- ✅ Al cambiar de paso el foco se mueve al encabezado del paso nuevo, para que quien navega por teclado no quede tirado al inicio del documento.
- ✅ `prefers-reduced-motion: reduce` apaga transiciones y animaciones — y sin la preferencia sí anima (la regla no está activa por accidente).
- ✅ Responsive real: sin scroll horizontal a 320px, incluida la pantalla de resultado con el texto más largo.
- ✅ Botón "volver" en cada paso: Q2, Q3, Q4 **y la pantalla de resultado**.
- ✅ Barra de progreso con `role="progressbar"` y `aria-valuenow`; el paso actual se anuncia por `role="status"`.
- ✅ Los colores de acento tienen variantes con contraste AA (≥4.5:1) donde cargan texto chico.

## Banco de proyectos

Vitrina curada a mano en `src/banco.js`. Sin backend: el envío automático de proyectos está fuera del alcance de esta versión, y las entradas sin URL pública se muestran con su estado en vez de un link muerto.

## Fuera de alcance (a propósito)

Motor de reglas dinámico, capa de IA para personalizar, backend para recibir proyectos, panel de avance/seguimiento.

## Deploy

Vercel, estático, sin build (`vercel.json`). Se despliega con [Las Llantas](https://github.com/JuanIA-sketch/las-llantas):

```bash
llantas --dry-run   # muestra qué haría, sin tocar producción
llantas
```

## Licencia

MIT — ver [LICENSE](LICENSE).

---

Parte de los **Juegos Imperiales** · [Imperio Agéntico](https://www.skool.com/imperio-agentico)

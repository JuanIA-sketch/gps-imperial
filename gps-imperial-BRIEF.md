# GPS Imperial — brief para Claude Code

## Problema
Miembros de Imperio Agéntico tienen ideas pero no un proyecto concreto que puedan terminar. GPS Imperial hace un diagnóstico corto (4 preguntas) y recomienda UN proyecto, no una lista.

## Frontera con El Arquitecto
El Arquitecto hace pre-mortem de una idea YA elegida (busca riesgos antes de construir). GPS Imperial decide CUÁL idea perseguir cuando no hay ninguna. Uno entra antes que el otro en el viaje del usuario — no son la misma herramienta.

## Alcance de esta versión (MVP)
**Dentro:**
- Diagnóstico de 4 preguntas (árbol de decisión determinístico, ver abajo)
- Recomendación de 1 sola categoría, con 7 campos + checklist de 4 próximos pasos
- Banco de proyectos como lista estática curada a mano

**Fuera (no construir todavía):**
- Motor de reglas dinámico / sistema de plantillas
- Capa de IA para personalizar (100% determinístico, sin API key — mismo estándar que El Filtro y Las Llantas)
- Envío real de proyectos al banco (backend) — hoy es solo vitrina curada a mano
- Panel de avance / seguimiento de estado

## Árbol de decisión (determinístico — regla crítica: ninguna pregunta pide directamente "qué tipo de solución prefieres", la categoría siempre se infiere de audiencia + necesidad)

**Q1 — siempre.** "¿Para quién es esto, hoy mismo?"
- Para mí, lo uso yo mismo → Q2_yo
- Para gente de mi mismo oficio o sector → categoría D directo (sin Q2)
- Para un cliente o negocio externo que te pagaría → Q2_cliente
- Para una audiencia amplia, sin contacto directo todavía → Q2_audiencia

**Q2_yo** — "De lo que haces a mano, ¿qué te quita más tiempo?"
- Tarea repetitiva automatizable → A
- Buscar/cruzar info dispersa → B

**Q2_cliente** — "¿Qué necesita ese negocio de ti?"
- Conseguir o calificar clientes → C
- Atender preguntas repetidas → E
- Algo puntual que pagaría por usar → F

**Q2_audiencia** — "¿Qué esperaría esa audiencia de ti?"
- Respuestas rápidas → E
- Organizar/consultar información → B

**Q3 — siempre, NO vota categoría.** "¿Cuántas horas por semana?" (bajo <5 / medio 5-10 / alto 10+) → solo ajusta el texto de tiempo estimado (extremo alto si bajo, extremo bajo si alto).

**Q4 — siempre, NO vota categoría.** "¿Solo o con colaboradores?" → solo agrega una nota a "cómo validarlo" si elige colaboradores.

## Contenido completo de las 6 categorías

### A — Automatización interna
- **Usuario:** Tú mismo, o alguien con tu mismo rol operativo
- **Problema:** Hay una tarea que repites cada semana con las mismas reglas siempre — no necesitas criterio distinto cada vez, solo ejecutar los mismos pasos rápido y sin error
- **Resultado:** Dejas de hacerlo a mano: el tiempo que hoy le dedicas cada semana se recorta a minutos de revisión
- **MVP:** Un script o CLI que hace esa tarea de punta a punta — entra el insumo, sale el resultado, sin que tú intervengas en medio
- **Fuera:** Interfaz gráfica, configuración para casos distintos al tuyo, manejo de excepciones raras
- **Tiempo base:** 3 a 7 días
- **Validación:** Reemplaza la tarea manual por el script una semana completa antes de mostrárselo a nadie
- **Pasos:** (1) Escribe en una frase qué entra y qué sale de la tarea hoy, a mano (2) Automatiza solo esa tarea, nada más (3) Corre el script en paralelo a tu proceso manual una semana, comparando resultados (4) Si coincide siempre, retira el proceso manual

### B — Agente de datos
- **Usuario:** Alguien que hoy pierde tiempo buscando o cruzando datos manualmente, empezando por ti mismo
- **Problema:** La información ya existe, pero está repartida en varios lugares y nadie la consulta sin esfuerzo
- **Resultado:** Una fuente única a la que le preguntas en lenguaje simple, en vez de buscar archivo por archivo
- **MVP:** Un agente que lee UNA sola fuente de datos y responde preguntas puntuales sobre ella
- **Fuera:** Conectar múltiples fuentes a la vez, editar datos desde el agente, permisos por usuario
- **Tiempo base:** 7 a 14 días
- **Validación:** Que alguien que no seas tú le haga 10 preguntas reales y anota dónde falla
- **Pasos:** (1) Elige UNA fuente de datos concreta (2) Lista las 10 preguntas que la gente hace más seguido sobre esos datos (3) Construye solo para responder esas 10 (4) Prueba con alguien ajeno antes de agregar una segunda fuente

### C — Captación de leads
- **Usuario:** Un negocio que necesita más clientes o mejores prospectos
- **Problema:** Encontrar o filtrar prospectos hoy se hace a mano, uno por uno
- **Resultado:** Un flujo que entrega una lista de prospectos ya filtrados, sin horas de búsqueda manual
- **MVP:** Automatización que busca o filtra prospectos según reglas fijas que tú defines — sin IA generativa todavía
- **Fuera:** CRM completo, outreach automático con IA, pagos o integraciones complejas
- **Tiempo base:** 10 a 14 días
- **Validación:** Consigue que un negocio real lo use con una lista real y te diga si los prospectos sirven
- **Pasos:** (1) Define 3 a 5 reglas que hoy usa alguien para decidir si un prospecto sirve (2) Automatiza solo el filtro, no el contacto (3) Entrega la primera lista filtrada a un negocio real (4) Ajusta las reglas según lo que digan que sí sirvió

### D — Vertical de sector
- **Usuario:** Colegas de tu misma industria o profesión
- **Problema:** Un dolor específico que solo alguien de tu mismo oficio reconoce de inmediato
- **Resultado:** Una herramienta que tu gremio adopta porque le habla en su propio lenguaje
- **MVP:** Una aplicación web simple enfocada en un solo caso de uso de tu sector
- **Fuera:** Soporte para otras industrias, personalización profunda, integraciones externas
- **Tiempo base:** 7 a 14 días
- **Validación:** Pruébalo con 3 colegas reales antes de construir cualquier función nueva
- **Pasos:** (1) Nombra a las 3 personas concretas de tu sector que lo usarían primero (2) Pregúntales qué parte les duele más, no asumas (3) Construye solo esa parte (4) Vuelve con ellos antes de agregar la siguiente función

### E — Asistente de atención
- **Usuario:** Un negocio o comunidad con volumen de preguntas repetidas
- **Problema:** Las mismas preguntas se responden una y otra vez a mano, sin registro de cuáles son
- **Resultado:** Respuestas consistentes e inmediatas, sin esperar a que alguien esté disponible
- **MVP:** Un asistente que cubre las 10 preguntas más frecuentes de un caso concreto
- **Fuera:** Cobertura de todas las preguntas posibles, escalamiento a humano, multi-idioma
- **Tiempo base:** 7 a 10 días
- **Validación:** Déjalo responder preguntas reales una semana y revisa cada vez que falló
- **Pasos:** (1) Reúne las 10 preguntas que más se repiten hoy (2) Escribe la respuesta correcta para cada una, a tu manera (3) Conecta el asistente solo a esas 10 (4) Cada pregunta nueva que falle, agrégala para la siguiente versión

### F — Micro-SaaS
- **Usuario:** Un cliente externo con un problema puntual y presupuesto
- **Problema:** Un dolor específico que hoy resuelven a mano, pagando de más, o aguantando
- **Resultado:** Una herramienta pequeña y cobrable que resuelve un solo trabajo, bien hecho
- **MVP:** Una función única, con login básico y una forma de cobrar aunque sea manual al inicio
- **Fuera:** Planes múltiples, panel de administración completo, escalar antes del primer cliente pagando
- **Tiempo base:** 14 a 21 días
- **Validación:** Consigue que alguien ajeno pague o se comprometa a pagar antes de seguir construyendo
- **Pasos:** (1) Encuentra a alguien dispuesto a pagar ANTES de programar la primera línea (2) Cóbrale manualmente la primera vez (3) Construye solo la función que resuelve su problema (4) Automatiza el cobro solo con 2 o 3 clientes reales

## Requisitos de testing (Vitest, TDD rojo→verde)
- Cada combinación Q1×Q2×Q3×Q4 posible: confirmar que cae en la categoría correcta y nunca queda sin resultado
- Q3 y Q4 NUNCA cambian la categoría, solo el texto de tiempo/validación — test explícito de esto
- Las 6 categorías tienen los 7 campos + 4 pasos, ninguno vacío
- Rama "sector" (D): confirmar que se salta Q2 correctamente

## Requisitos de UX / accesibilidad (no opcionales, parte de "terminado")
- Foco visible por teclado en todos los botones (`focus-visible`)
- `prefers-reduced-motion` respetado (sin animaciones si el sistema lo pide)
- Responsive real hasta móvil, sin desbordamiento horizontal
- Botón "volver" funcional en cada paso del árbol

## Entregables (mismo estándar que El Filtro y Las Llantas)
- README + LICENSE + CLAUDE.md
- `git init` + commit inicial
- Auditoría de La Alarma sin hallazgos antes de publish
- Confirmación explícita antes de cualquier `git push` o `gh repo create` (no negociable)
- Cero secretos reales en la sesión de Claude Code

## Hosting — recomendación
Vercel, dominio propio tipo `gps-imperial.vercel.app` (mismo patrón que El Arquitecto), desplegado con **Las Llantas** — su deployer de Vercel ya está validado de punta a punta contra Ancla Precios, así que esto de paso es otra validación real de Las Llantas antes de su publish en npm. Si prefieres otra ruta, dilo y la cambiamos.

## Stack y modelo
HTML/CSS/JS simple (como el prototipo), sin frameworks pesados. Vitest para la lógica del árbol de decisión. Opus 4.8 o Fable 5 en Claude Code, TDD rojo→verde.

## Adjunto
Prototipo funcional de referencia: gps-imperial-mvp.html (contiene el diseño y la lógica ya validados en vivo con el usuario)

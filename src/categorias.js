/**
 * Las 6 categorías de proyecto que GPS Imperial puede recomendar.
 *
 * Dato puro: cero lógica, cero DOM. El copy viene del prototipo validado en
 * vivo (gps-imperial-mvp.html) y los rangos de tiempo del brief.
 *
 * Tres textos se apartan del prototipo, con aprobación explícita de Charly:
 *   - el `resultado` de B, que prometía consolidar varias fuentes cuando el
 *     MVP y "lo que queda fuera" excluyen justamente eso;
 *   - el paso 1 de C y de F, ahora condicionales, para no mandar de vuelta a
 *     la casilla de salida a quien ya tiene un cliente esperando.
 * Y `ejemplo`, `herramientas` y `notaColaboradores` son campos nuevos.
 *
 * Nada de esto se reescribe ni se "mejora" sin cambiar también el fixture de
 * tests/categorias.test.js — ese es el candado.
 */

export const IDS_CATEGORIAS = Object.freeze(['A', 'B', 'C', 'D', 'E', 'F']);

/**
 * Campos añadidos DESPUÉS del prototipo, para que el destino sea accionable:
 * un ejemplo concreto y con qué construirlo. No vienen del brief ni del
 * prototipo — son copy nuevo, pendiente de revisión de Charly.
 */
export const CAMPOS_ACCIONABLES = Object.freeze(['ejemplo', 'herramientas']);

/** Los 7 campos que el brief exige en cada categoría. */
export const CAMPOS_CATEGORIA = Object.freeze([
  'usuario',
  'problema',
  'resultado',
  'mvp',
  'fuera',
  'tiempoBase',
  'validacion',
]);

const congelar = (categoria) =>
  Object.freeze({
    ...categoria,
    tiempoBase: Object.freeze({ ...categoria.tiempoBase, unidad: 'días' }),
    pasos: Object.freeze([...categoria.pasos]),
  });

export const CATEGORIAS = Object.freeze({
  A: congelar({
    id: 'A',
    tag: 'Automatización interna',
    title: 'Automatiza algo que ya haces a mano',
    ejemplo:
      'Cada lunes bajas los extractos de 12 clientes, los pegas en una hoja y marcas a mano los movimientos que no cuadran. El script hace las tres cosas: lee los archivos de una carpeta, aplica tus reglas y te deja solo la lista de excepciones para revisar.',
    herramientas:
      'Python con pandas, o un script suelto de Node — el que ya sepas leer. Para que corra solo: cron en Mac o Linux, Programador de tareas en Windows. Si los datos ya viven en Google Sheets, Apps Script te ahorra montar nada.',
    usuario: 'Tú mismo, o alguien con tu mismo rol operativo',
    problema:
      'Hay una tarea que repites cada semana con las mismas reglas siempre — no necesitas criterio distinto cada vez, solo ejecutar los mismos pasos rápido y sin error',
    resultado:
      'Dejas de hacerlo a mano: el tiempo que hoy le dedicas cada semana se recorta a minutos de revisión',
    mvp: 'Un script o CLI que hace esa tarea de punta a punta — entra el insumo, sale el resultado, sin que tú intervengas en medio',
    fuera:
      'Interfaz gráfica, configuración para casos distintos al tuyo, manejo de excepciones raras que casi nunca pasan',
    tiempoBase: { min: 3, max: 7 },
    notaColaboradores:
      '. Si sumas a alguien, que sea quien hoy hace esa misma tarea: comparen los resultados del script una semana antes de fiarse de él.',
    validacion:
      'Reemplaza la tarea manual por el script durante una semana completa, antes de mostrárselo a nadie',
    pasos: [
      'Escribe en una frase exacta qué entra y qué sale de la tarea hoy, a mano',
      'Automatiza solo esa tarea — nada más, aunque se te ocurran mejoras',
      'Corre el script en paralelo a tu proceso manual una semana, comparando resultados',
      'Si coincide siempre, retira el proceso manual',
    ],
  }),

  B: congelar({
    id: 'B',
    tag: 'Agente de datos',
    title: 'Organiza información que hoy está dispersa',
    ejemplo:
      'Tu tabla de precios es un Excel de 4.000 filas que nadie abre. En vez de buscar fila por fila, preguntas "¿cuánto vale el modelo X para el cliente Y?" y te responde con el dato y desde cuándo está vigente.',
    herramientas:
      'No empieces por una base de datos vectorial. Si la fuente cabe en una hoja, cárgala en memoria y filtra; Postgres con búsqueda de texto cuando crezca. Para preguntarle, un bot de Telegram o Slack llega antes que una web propia.',
    usuario:
      'Alguien que hoy pierde tiempo buscando o cruzando datos manualmente, empezando por ti mismo',
    problema:
      'La información que necesitas ya existe, pero está repartida en varios lugares y nadie la consulta sin esfuerzo',
    resultado:
      'Le preguntas en lenguaje simple a la fuente que hoy más te cuesta consultar, y te contesta al momento — en vez de abrirla y buscar a mano',
    mvp: 'Un agente que lee una sola fuente de datos (no varias) y responde preguntas puntuales sobre ella',
    fuera:
      'Conectar múltiples fuentes a la vez, editar los datos desde el agente, permisos distintos por usuario',
    tiempoBase: { min: 7, max: 14 },
    notaColaboradores:
      '. Si sumas a alguien, que sea quien más consulta esos datos: sus 10 preguntas valen más que las tuyas para decidir qué tiene que responder.',
    validacion:
      'Que alguien que no seas tú le haga 10 preguntas reales y anota dónde falla',
    pasos: [
      'Elige UNA fuente de datos concreta, no todas las que se te ocurran',
      'Haz una lista de las 10 preguntas que la gente hace más seguido sobre esos datos',
      'Construye solo para responder esas 10, nada más',
      'Prueba con alguien ajeno antes de agregar una segunda fuente',
    ],
  }),

  C: congelar({
    id: 'C',
    tag: 'Captación de leads',
    title: 'Ayuda a conseguir o calificar clientes',
    ejemplo:
      'El gimnasio quiere socios que trabajen a menos de 2 km. El flujo saca los negocios de esa zona, descarta los que tienen menos de 10 empleados y entrega una lista de 40 contactos ordenada por cercanía.',
    herramientas:
      'n8n o Make para encadenar los pasos sin levantar un servidor. La salida, en una hoja de cálculo: el negocio ya sabe usarla. Deja el scraping para el final — muchos directorios exportan si preguntas.',
    usuario: 'Un negocio que necesita más clientes o mejores prospectos',
    problema:
      'Encontrar o filtrar prospectos hoy se hace a mano, revisando uno por uno',
    resultado:
      'Un flujo que entrega una lista de prospectos ya filtrados, sin que alguien pase horas buscando',
    mvp: 'Una automatización que busca o filtra prospectos según reglas fijas que tú defines — sin IA generativa todavía',
    fuera:
      'CRM completo, outreach automático con IA, pagos o integraciones complejas',
    tiempoBase: { min: 10, max: 14 },
    notaColaboradores:
      '. Si trabajan varios, que quien define las reglas no sea quien aprueba la lista filtrada: el filtro y su revisión tienen que ser dos manos distintas.',
    validacion:
      'Consigue que un negocio real lo use con una lista real y te diga si los prospectos sirven',
    pasos: [
      'Si ya tienes un negocio real esperando esto, siéntate con él a definir las 3 a 5 reglas que usa hoy para decidir si un prospecto sirve. Si no, consíguelo antes de programar: sin un negocio concreto no sabes qué filtrar',
      'Automatiza solo el filtro, no el contacto',
      'Entrégale la primera lista filtrada a un negocio real',
      'Ajusta las reglas según lo que digan que sí sirvió',
    ],
  }),

  D: congelar({
    id: 'D',
    tag: 'Vertical de sector',
    title: 'Resuelve el problema de tu propio oficio',
    ejemplo:
      'En un estudio de arquitectura la memoria descriptiva se arma copiando de proyectos viejos. La herramienta pregunta 8 datos del proyecto y devuelve el documento listo para revisar, con el vocabulario que usa el gremio.',
    herramientas:
      'Una web de una sola pantalla: HTML y JS alcanzan si todavía no hay cuentas. Publícala en Vercel o Netlify. Guarda en el navegador antes de montar un login — tus 3 colegas no se van a registrar para probarla.',
    usuario: 'Colegas de tu misma industria o profesión',
    problema:
      'Un dolor específico que solo alguien de tu mismo oficio reconoce de inmediato — para cualquier otra persona pasa desapercibido',
    resultado:
      'Una herramienta que tu gremio adopta porque le habla en su propio lenguaje, no en jerga genérica de software',
    mvp: 'Una aplicación web simple enfocada en un solo caso de uso de tu sector, nada genérico',
    fuera:
      'Soporte para otras industrias, personalización profunda, integraciones con sistemas externos',
    tiempoBase: { min: 7, max: 14 },
    notaColaboradores:
      '. Si sumas colegas del gremio, que entren como usuarios antes que como socios: primero que lo usen, después se reparte el trabajo.',
    validacion:
      'Pruébalo con 3 colegas reales antes de seguir construyendo cualquier función nueva',
    pasos: [
      'Nombra a las 3 personas concretas de tu sector que lo usarían primero',
      'Pregúntales qué parte del problema les duele más, no asumas',
      'Construye solo esa parte',
      'Vuelve con ellos antes de agregar la siguiente función',
    ],
  }),

  E: congelar({
    id: 'E',
    tag: 'Asistente de atención',
    title: 'Responde o atiende a usuarios reales',
    ejemplo:
      'La clínica recibe siempre lo mismo por WhatsApp: horarios, si atienden esa obra social, cuánto sale una limpieza. El asistente responde esas 10 y para todo lo demás dice "te contesta una persona" en vez de inventar.',
    herramientas:
      'Un árbol de respuestas fijas antes que un modelo: sale más barato, no inventa y ya cubre la mayoría. WhatsApp Business trae respuestas rápidas sin programar nada. Si te queda corto, la API de WhatsApp Cloud o un bot de Telegram.',
    usuario: 'Un negocio o comunidad con volumen de preguntas repetidas',
    problema:
      'Las mismas preguntas se responden una y otra vez a mano, y nadie lleva registro de cuáles son',
    resultado:
      'Respuestas consistentes e inmediatas para las preguntas frecuentes, sin esperar a que una persona esté disponible',
    mvp: 'Un asistente que cubre las 10 preguntas más frecuentes de un caso concreto, nada más',
    fuera:
      'Cobertura de todas las preguntas posibles, escalamiento automático a un humano, soporte multi-idioma',
    tiempoBase: { min: 7, max: 10 },
    notaColaboradores:
      '. Si trabajan varios, que las 10 respuestas las escriba quien hoy contesta a mano: nadie más conoce el tono que espera esa gente.',
    validacion:
      'Déjalo responder preguntas reales durante una semana y revisa cada vez que falló',
    pasos: [
      'Reúne las 10 preguntas que más se repiten hoy (revisa chats o correos pasados)',
      'Escribe la respuesta correcta para cada una, a tu manera, no genérica',
      'Conecta el asistente solo a esas 10',
      'Cada pregunta nueva que falle, agrégala a la lista para la siguiente versión',
    ],
  }),

  F: congelar({
    id: 'F',
    tag: 'Micro-SaaS',
    title: 'Construye algo que un tercero pagaría por usar',
    ejemplo:
      'Una inmobiliaria arma la ficha de cada propiedad a mano en Word. La herramienta toma las fotos y 6 datos, y devuelve la ficha en PDF con su marca. Le cobras por ficha, o una cuota mensual si publica seguido.',
    herramientas:
      'El framework que ya sepas — este no es el momento de aprender uno nuevo. Acceso por enlace mágico al correo antes que contraseñas. Cobro: transferencia y factura a mano hasta el tercer cliente; recién ahí Stripe o Mercado Pago.',
    usuario: 'Un cliente externo con un problema puntual y presupuesto para resolverlo',
    problema:
      'Un dolor específico que hoy resuelven a mano, pagando de más, o simplemente aguantando',
    resultado:
      'Una herramienta pequeña y cobrable que resuelve un solo trabajo, bien hecho',
    mvp: 'Una función única, con acceso básico (login simple) y una forma de cobrar, aunque sea manual al inicio',
    fuera:
      'Planes múltiples, panel de administración completo, escalar antes de tener el primer cliente pagando',
    tiempoBase: { min: 14, max: 21 },
    notaColaboradores:
      '. Si sumas a alguien, acuerden por escrito quién cobra y quién atiende al cliente antes del primer pago: eso es lo que se rompe primero.',
    validacion:
      'Consigue que una persona ajena a ti pague o se comprometa a pagar antes de seguir construyendo',
    pasos: [
      'Si ya tienes a alguien dispuesto a pagar, salta directo al paso 2. Si no, consíguelo antes de programar la primera línea',
      'Cóbrale manualmente (transferencia, no un sistema de pagos) la primera vez',
      'Construye solo la función que le resuelve el problema a esa persona',
      'Automatiza el cobro solo cuando tengas 2 o 3 clientes reales',
    ],
  }),
});

/**
 * Devuelve la categoría con ese id, o revienta.
 * Nunca `undefined`: un id malo es un bug, no un caso a tolerar en silencio.
 */
export function obtenerCategoria(id) {
  const categoria = Object.prototype.hasOwnProperty.call(CATEGORIAS, id)
    ? CATEGORIAS[id]
    : undefined;
  if (!categoria) {
    throw new Error(`Categoría desconocida: ${JSON.stringify(id)}`);
  }
  return categoria;
}
